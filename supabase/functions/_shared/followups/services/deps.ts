import { localParts } from "../calendar.ts";
import type { Classifier, Drafter, EmailProvider, MailAccount, MailProvider, Notifier, Repo, TelegramLink } from "../ports.ts";

export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  info: (msg, data) => console.log(JSON.stringify({ level: "info", msg, ...data })),
  warn: (msg, data) => console.warn(JSON.stringify({ level: "warn", msg, ...data })),
  error: (msg, data) => console.error(JSON.stringify({ level: "error", msg, ...data })),
};

export interface Deps {
  repo: Repo;
  providers: Partial<Record<MailProvider, EmailProvider>>;
  drafter: Drafter;
  classifier: Classifier;
  notifier: Notifier | null;
  now: () => Date;
  log: Logger;
  appUrl: string | null;
}

export function providerFor(deps: Deps, acct: MailAccount): EmailProvider {
  const p = deps.providers[acct.provider];
  if (!p) throw new Error(`${acct.provider} is not configured`);
  return p;
}

/** Inside the user's quiet hours, cards wait for the morning digest instead of buzzing the phone. */
export function isQuiet(link: TelegramLink, now: Date): boolean {
  const h = localParts(now, link.timeZone).hour;
  return link.quietStart > link.quietEnd
    ? h >= link.quietStart || h < link.quietEnd
    : h >= link.quietStart && h < link.quietEnd;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
