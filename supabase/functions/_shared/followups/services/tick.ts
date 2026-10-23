// One scheduler pass. Each stage is independent: a failure in one never stops the others.

import { localParts } from "../calendar.ts";
import { escapeHtml } from "../security.ts";
import { type Deps, errorMessage, isQuiet, providerFor } from "./deps.ts";
import { draftOne, postCard } from "./draft.ts";
import { ingestAccount } from "./ingest.ts";
import { planAll } from "./plan.ts";
import { sendOne, sweepStuck } from "./send.ts";

const DAY = 86_400_000;
export const TICK_BUDGET_MS = 110_000; // edge functions stop at 150 s on the free plan

export interface TickReport {
  ingested: number;
  planned: number;
  nurtured: number;
  drafted: number;
  sent: number;
  errors: string[];
}

export async function runTick(deps: Deps, opts: { draftBatch?: number; sendBatch?: number } = {}): Promise<TickReport> {
  const started = Date.now();
  const timeLeft = () => TICK_BUDGET_MS - (Date.now() - started);
  const report: TickReport = { ingested: 0, planned: 0, nurtured: 0, drafted: 0, sent: 0, errors: [] };
  const stage = async (name: string, fn: () => Promise<void>) => {
    if (timeLeft() <= 0) return void report.errors.push(`${name}: skipped, out of time`);
    try {
      await fn();
    } catch (e) {
      report.errors.push(`${name}: ${errorMessage(e)}`);
      deps.log.error(`tick stage ${name} failed`, { error: errorMessage(e) });
    }
  };

  await stage("heartbeat", () => deps.repo.heartbeat("followups-tick"));

  await stage("subscriptions", async () => {
    const soon = new Date(deps.now().getTime() + 2 * DAY);
    for (const acct of await deps.repo.activeMailAccounts()) {
      if (acct.watchExpiresAt && acct.watchExpiresAt > soon) continue;
      try {
        const r = await providerFor(deps, acct).ensureSubscription(acct);
        await deps.repo.updateMailAccount(acct.id, {
          watchExpiresAt: r.expiresAt ?? new Date(deps.now().getTime() + 7 * DAY), // re-check weekly when push is off
          subscriptionId: r.subscriptionId,
          ...(r.cursor ? { syncCursor: r.cursor } : {}),
        });
      } catch (e) {
        deps.log.warn("subscription renew failed", { accountId: acct.id, error: errorMessage(e) });
      }
    }
  });

  // Replies first, so nobody who just answered gets chased in this same pass.
  await stage("ingest", async () => {
    for (const acct of await deps.repo.activeMailAccounts()) {
      if (timeLeft() <= 0) break;
      try {
        report.ingested += await ingestAccount(deps, acct);
      } catch (e) {
        report.errors.push(`ingest ${acct.id}: ${errorMessage(e)}`);
      }
    }
  });

  await stage("plan", async () => {
    const r = await planAll(deps);
    report.planned = r.planned;
    report.nurtured = r.nurtured;
  });

  await stage("sweep", async () => {
    await sweepStuck(deps);
    // A draft interrupted mid-way (timeout, crash) goes back to the queue.
    for (const row of await deps.repo.stuck("drafting", deps.now())) {
      await deps.repo.transition(row.id, null, { to: "planned", actor: "system", expect: ["drafting"], detail: { recovered: true } });
    }
  });

  await stage("send", async () => {
    const rows = await deps.repo.claim("approved", "sending", deps.now(), opts.sendBatch ?? 10);
    for (const row of rows) {
      try {
        await sendOne(deps, row);
        report.sent++;
      } catch (e) {
        // Left in `sending`; the sweeper resolves it after the lease expires.
        report.errors.push(`send ${row.id}: ${errorMessage(e)}`);
      }
    }
  });

  await stage("draft", async () => {
    const horizon = new Date(deps.now().getTime() + DAY);
    const rows = await deps.repo.claim("planned", "drafting", horizon, opts.draftBatch ?? 5);
    for (const row of rows) {
      if (timeLeft() < 20_000) {
        // Not enough time to draft safely: hand it back for the next tick.
        await deps.repo.transition(row.id, null, { to: "planned", actor: "system", expect: ["drafting"] });
        continue;
      }
      try {
        await draftOne(deps, row);
        report.drafted++;
      } catch (e) {
        report.errors.push(`draft ${row.id}: ${errorMessage(e)}`);
      }
    }
  });

  await stage("digest", () => sendDigests(deps));

  deps.log.info("tick done", { ...report, errors: report.errors.length, ms: Date.now() - started });
  return report;
}

/** Once a day after quiet hours: re-post held cards and summarise what's waiting. */
export async function sendDigests(deps: Deps): Promise<void> {
  if (!deps.notifier) return;
  const now = deps.now();
  for (const link of await deps.repo.allTelegramLinks()) {
    if (isQuiet(link, now)) continue;
    const p = localParts(now, link.timeZone);
    const today = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
    if (link.lastDigestOn === today) continue;

    const waiting = await deps.repo.awaitingApproval(link.userId);
    for (const f of waiting.filter((w) => !w.telegramMessageId)) {
      const v = await deps.repo.view(f.id);
      if (v) await postCard(deps, v, [], true);
    }
    if (waiting.length) {
      await deps.notifier.sendText(
        link.chatId,
        `<b>Good morning.</b> ${waiting.length} follow-up${waiting.length === 1 ? "" : "s"} waiting for your approval above.` +
          (deps.appUrl ? `\n${escapeHtml(deps.appUrl)}` : ""),
      );
    }
    await deps.repo.setDigestSent(link.userId, today);
  }
}
