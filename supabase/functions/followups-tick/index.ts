// Scheduler entry point. Called every 15 minutes by pg_cron (public.followups_call_tick),
// authenticated with a shared secret read from Vault. Not callable by browsers.

import { runTick } from "../_shared/followups/services/tick.ts";
import { buildDeps, handleError, json, requireSecret } from "../_shared/followups/runtime.ts";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
    requireSecret(req.headers.get("x-internal-secret"), "FOLLOWUPS_INTERNAL_SECRET");
    const report = await runTick(buildDeps());
    // Counts only: no message content leaves this function.
    return json({ ok: report.errors.length === 0, ...report, errors: report.errors.length });
  } catch (e) {
    return handleError(e);
  }
});
