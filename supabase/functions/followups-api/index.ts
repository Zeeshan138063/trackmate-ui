// Browser-facing actions for the Follow-ups tab and Settings.
// Every call is tied to the signed-in user; ownership is re-checked on every row.

import { approve, markSent, redraft, retry, skip, snooze } from "../_shared/followups/services/approvals.ts";
import {
  buildDeps,
  corsHeaders,
  env,
  handleError,
  HttpError,
  json,
  readJson,
  requireUser,
  serviceClient,
} from "../_shared/followups/runtime.ts";
import { isUuid, randomToken } from "../_shared/followups/security.ts";

type Body = {
  action?: string;
  id?: string;
  body?: string;
  instruction?: string;
  until?: string;
};

const ACTIONS = new Set(["approve", "redraft", "snooze", "skip", "mark_sent", "retry", "telegram_link"]);

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method not allowed");
    const db = serviceClient();
    const userId = await requireUser(req, db);
    const b = await readJson<Body>(req);
    if (!b.action || !ACTIONS.has(b.action)) throw new HttpError(400, "unknown action");

    if (b.action === "telegram_link") {
      // One-time code, valid 15 minutes, for t.me/<bot>?start=<code>.
      const code = randomToken(18);
      const { error } = await db.from("telegram_links").upsert({
        user_id: userId,
        link_code: code,
        link_code_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
      return json({ url: `https://t.me/${env("TELEGRAM_BOT_USERNAME")}?start=${code}` }, 200, cors);
    }

    if (!isUuid(b.id)) throw new HttpError(400, "invalid follow-up id");
    const deps = buildDeps(db);
    let row;
    switch (b.action) {
      case "approve":
        if (b.body !== undefined && typeof b.body !== "string") throw new HttpError(400, "invalid body");
        row = await approve(deps, userId, b.id, "web", b.body);
        break;
      case "redraft":
        if (typeof b.instruction !== "string") throw new HttpError(400, "instruction required");
        row = await redraft(deps, userId, b.id, "web", b.instruction);
        break;
      case "snooze":
        row = await snooze(deps, userId, b.id, "web", new Date(String(b.until)));
        break;
      case "skip":
        row = await skip(deps, userId, b.id, "web");
        break;
      case "mark_sent":
        row = await markSent(deps, userId, b.id, "web");
        break;
      case "retry":
        row = await retry(deps, userId, b.id, "web");
        break;
    }
    return json({ ok: true, state: row?.state ?? null }, 200, cors);
  } catch (e) {
    return handleError(e, cors);
  }
});
