// Push notifications for new mail, so replies cancel follow-ups within seconds.
// Optional: without it, the 15-minute tick polls every inbox anyway.
//
// Gmail:   Pub/Sub push subscription to <url>?provider=gmail&token=<GMAIL_PUSH_TOKEN>
// Outlook: Graph subscription created by the app; every notification must echo GRAPH_CLIENT_STATE.

import { ingestAccount } from "../_shared/followups/services/ingest.ts";
import { background, buildDeps, json, requireSecret, text } from "../_shared/followups/runtime.ts";
import { safeEqual } from "../_shared/followups/security.ts";

interface GraphNotification {
  subscriptionId?: string;
  clientState?: string;
  lifecycleEvent?: string;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");

  // Graph subscription handshake: echo the token as plain text within 10 seconds.
  const validationToken = url.searchParams.get("validationToken");
  if (provider === "outlook" && validationToken) return text(validationToken.slice(0, 1024));

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    if (provider === "gmail") {
      requireSecret(url.searchParams.get("token"), "GMAIL_PUSH_TOKEN");
      const body = await req.json() as { message?: { data?: string } };
      const data = JSON.parse(atob(body.message?.data ?? "")) as { emailAddress?: string };
      if (data.emailAddress) {
        const deps = buildDeps();
        background((async () => {
          const acct = await deps.repo.mailAccountByAddress("gmail", data.emailAddress!);
          if (acct) await ingestAccount(deps, acct);
        })());
      }
      return json({ ok: true });
    }

    if (provider === "outlook") {
      const expected = Deno.env.get("GRAPH_CLIENT_STATE") ?? "";
      const body = await req.json() as { value?: GraphNotification[] };
      const deps = buildDeps();
      const subs = new Set<string>();
      for (const n of body.value ?? []) {
        if (!safeEqual(n.clientState, expected) || !n.subscriptionId) continue; // forged or foreign: drop
        subs.add(n.subscriptionId);
      }
      background((async () => {
        for (const sub of subs) {
          const acct = await deps.repo.mailAccountBySubscription(sub);
          if (!acct) continue;
          const lifecycle = (body.value ?? []).find((n) => n.subscriptionId === sub && n.lifecycleEvent);
          if (lifecycle) {
            // reauthorizationRequired / subscriptionRemoved: make the next tick renew it.
            await deps.repo.updateMailAccount(acct.id, { watchExpiresAt: null });
          } else {
            await ingestAccount(deps, acct);
          }
        }
      })());
      return new Response(null, { status: 202 });
    }

    return json({ error: "unknown provider" }, 400);
  } catch {
    return json({ error: "bad request" }, 400);
  }
});
