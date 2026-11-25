// Job intake. Called hourly by pg_cron (fetch-ats-jobs-hourly).
//
// For every company on a user's watchlist whose careers page is a Greenhouse, Lever or Ashby
// board, read that board's public feed and keep the postings whose title matches a keyword
// some user is actively searching for. New rows go to discovered_jobs with an embedding.
//
// Decision DEC-001 (answer to OQ-01): JobOS takes jobs only from feeds the job boards publish
// for this purpose. It does not fetch LinkedIn and does not scrape search results (P1).

import { createClient } from "npm:@supabase/supabase-js@2";
import { type Board, boardKey, feedUrl, type FeedJob, firstMatchingKeyword, normalize, parseBoard } from "./feeds.ts";

const MAX_BOARDS_PER_RUN = 60;
const MAX_NEW_JOBS_PER_BOARD = 25;
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "JobOS job intake (+https://jobos.dev)";
const EMBEDDING_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
const HF_TOKEN = Deno.env.get("HF_TOKEN");

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!HF_TOKEN) return null;
  try {
    const response = await fetch(EMBEDDING_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text.substring(0, 5000) }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
    if (Array.isArray(result)) return result;
    return null;
  } catch {
    return null;
  }
}

/** Reads one board's feed. Returns null (and logs why) on any failure: never a partial guess. */
async function readFeed(board: Board, company: string): Promise<FeedJob[] | null> {
  try {
    const res = await fetch(feedUrl(board), {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`feed ${boardKey(board)}: HTTP ${res.status}`);
      return null;
    }
    // Lever can answer with HTML even when JSON was asked for.
    if (!(res.headers.get("Content-Type") ?? "").includes("json")) {
      console.warn(`feed ${boardKey(board)}: not JSON`);
      return null;
    }
    return normalize(board, company, await res.json());
  } catch (e) {
    console.warn(`feed ${boardKey(board)}: ${e instanceof Error ? e.name : "error"}`);
    return null;
  }
}

Deno.serve(async () => {
  try {
    // 1. What are people searching for?
    const { data: queries, error: queryError } = await supabase
      .from("job_search_queries")
      .select("id, keyword")
      .eq("is_active", true);
    if (queryError) throw queryError;
    const keywords = [...new Set((queries ?? []).map((q) => String(q.keyword ?? "").trim()).filter(Boolean))];

    // 2. Which boards are on someone's watchlist?
    const { data: companies, error: companyError } = await supabase
      .from("dream_companies")
      .select("name, careers_page_url")
      .not("careers_page_url", "is", null);
    if (companyError) throw companyError;

    const boards = new Map<string, { board: Board; company: string }>();
    for (const c of companies ?? []) {
      const board = parseBoard(c.careers_page_url);
      if (board && !boards.has(boardKey(board))) boards.set(boardKey(board), { board, company: String(c.name ?? board.token) });
    }

    const summary = { boards: boards.size, read: 0, failed: 0, matched: 0, inserted: 0, skippedBoards: 0 };
    if (keywords.length === 0 || boards.size === 0) {
      return Response.json({ success: true, ...summary, note: "no active keywords or no supported careers pages" });
    }

    // Take a different slice each hour so a long watchlist is covered over the day.
    const all = [...boards.values()];
    const start = all.length > MAX_BOARDS_PER_RUN ? (new Date().getUTCHours() * MAX_BOARDS_PER_RUN) % all.length : 0;
    const batch = all.slice(start, start + MAX_BOARDS_PER_RUN);
    summary.skippedBoards = all.length - batch.length;

    for (const { board, company } of batch) {
      const jobs = await readFeed(board, company);
      if (jobs === null) {
        summary.failed++;
        continue;
      }
      summary.read++;

      const wanted = jobs
        .map((job) => ({ job, keyword: firstMatchingKeyword(job.title, keywords) }))
        .filter((x): x is { job: FeedJob; keyword: string } => x.keyword !== null);
      summary.matched += wanted.length;
      if (wanted.length === 0) continue;

      // Only embed and insert what we have not seen.
      const { data: existing, error: existingError } = await supabase
        .from("discovered_jobs")
        .select("external_id")
        .in("external_id", wanted.map((w) => w.job.external_id));
      if (existingError) throw existingError;
      const seen = new Set((existing ?? []).map((r) => r.external_id));
      const fresh = wanted.filter((w) => !seen.has(w.job.external_id)).slice(0, MAX_NEW_JOBS_PER_BOARD);
      if (fresh.length === 0) continue;

      const rows = [];
      for (const { job, keyword } of fresh) {
        const embedding = await generateEmbedding(`${job.title} ${job.company} ${job.location ?? ""} ${(job.description ?? "").substring(0, 200)}`);
        rows.push({ ...job, keyword, ...(embedding ? { embedding } : {}) });
      }

      const { error: insertError } = await supabase
        .from("discovered_jobs")
        .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
      if (insertError) throw insertError;
      summary.inserted += rows.length;

      await new Promise((r) => setTimeout(r, 300)); // be a polite client
    }

    if (queries?.length) {
      await supabase
        .from("job_search_queries")
        .update({ last_run_at: new Date().toISOString() })
        .in("id", queries.map((q) => q.id));
    }

    console.log("fetch-jobs", JSON.stringify(summary));
    return Response.json({ success: true, ...summary });
  } catch (error) {
    console.error("fetch-jobs failed:", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "job intake failed" }, { status: 500 });
  }
});
