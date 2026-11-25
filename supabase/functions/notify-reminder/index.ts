// Sends the signed-in user an in-app reminder (Novu) about one of their own jobs.
//   POST { kind: "deadline" | "follow_up", jobId }
// The Novu API key stays here (secret NOVU_API_KEY), never in the browser (P4). The message is
// built from the job row, not from text sent by the browser, and always goes to the caller.

import { createClient } from "npm:@supabase/supabase-js@2";
import { errorResponse, requireUserId } from "../_shared/auth.ts";
import { appCors } from "../_shared/cors.ts";
import { buildReminder, isReminderKind, isUuid } from "./message.ts";

const NOVU_URL = "https://api.novu.co/v1/events/trigger";
const WORKFLOW_ID = "job-alert";

Deno.serve(async (req) => {
  const cors = appCors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") return reply({ error: "method not allowed" }, 405);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const userId = await requireUserId(req, admin);

    const body = await req.json().catch(() => ({}));
    if (!isReminderKind(body?.kind) || !isUuid(body?.jobId)) return reply({ error: "invalid request" }, 400);

    const { data: job, error } = await admin
      .from("jobs")
      .select("id, position, company, location, job_url")
      .eq("id", body.jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!job) return reply({ error: "not found" }, 404);

    const apiKey = Deno.env.get("NOVU_API_KEY");
    if (!apiKey) return reply({ error: "notifications are not configured" }, 503);

    const res = await fetch(NOVU_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `ApiKey ${apiKey}` },
      body: JSON.stringify({ name: WORKFLOW_ID, to: { subscriberId: userId }, payload: buildReminder(body.kind, job) }),
    });
    if (!res.ok) {
      console.error("novu trigger failed", res.status);
      return reply({ error: "notification service failed" }, 502);
    }
    return reply({ ok: true });
  } catch (e) {
    return errorResponse(e, cors);
  }
});
