// Wiring for the follow-up edge functions: config, clients, CORS, auth, responses.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { ClaudeClassifier, ClaudeClient, ClaudeDrafter, DEFAULT_CLASSIFY_MODEL, DEFAULT_DRAFT_MODEL } from "./adapters/claude.ts";
import { GmailProvider } from "./adapters/gmail.ts";
import { OutlookProvider } from "./adapters/outlook.ts";
import { SupabaseFileStore } from "./adapters/fileStore.ts";
import { SupabaseRepo } from "./adapters/supabaseRepo.ts";
import { TelegramNotifier } from "./adapters/telegram.ts";
import { RefreshingTokenProvider } from "./adapters/tokens.ts";
import type { EmailProvider, MailProvider } from "./ports.ts";
import { safeEqual } from "./security.ts";
import { consoleLogger, type Deps } from "./services/deps.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

export function env(name: string, required = true): string {
  const v = Deno.env.get(name) ?? "";
  if (required && !v) throw new Error(`missing environment variable ${name}`);
  return v;
}

export function serviceClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function functionUrl(name: string): string {
  return `${env("SUPABASE_URL")}/functions/v1/${name}`;
}

export function appUrl(): string | null {
  return Deno.env.get("APP_URL")?.replace(/\/+$/, "") || null;
}

/** Build the full dependency graph. Optional integrations are simply left out when not configured. */
export function buildDeps(db: SupabaseClient = serviceClient()): Deps {
  const repo = new SupabaseRepo(db);
  const tokens = new RefreshingTokenProvider(
    {
      google: { clientId: env("GOOGLE_CLIENT_ID", false), clientSecret: env("GOOGLE_CLIENT_SECRET", false) },
      microsoft: { clientId: env("MS_CLIENT_ID", false), clientSecret: env("MS_CLIENT_SECRET", false) },
    },
    {
      refreshToken: async (id) => {
        const { data, error } = await db.rpc("mail_account_refresh_token", { p_account_id: id });
        if (error) throw new Error(error.message);
        return data as string | null;
      },
      saveRefreshToken: async (id, token) => {
        const { error } = await db.rpc("set_mail_account_refresh_token", { p_account_id: id, p_token: token });
        if (error) throw new Error(error.message);
      },
      markReauthRequired: (id) => repo.updateMailAccount(id, { status: "reauth_required" }),
    },
  );

  const providers: Partial<Record<MailProvider, EmailProvider>> = {};
  if (Deno.env.get("GOOGLE_CLIENT_ID")) {
    providers.gmail = new GmailProvider(tokens, { pubsubTopic: Deno.env.get("GMAIL_PUBSUB_TOPIC") || undefined });
  }
  if (Deno.env.get("MS_CLIENT_ID")) {
    const clientState = Deno.env.get("GRAPH_CLIENT_STATE") || undefined;
    providers.outlook = new OutlookProvider(tokens, {
      clientState,
      notificationUrl: clientState ? `${functionUrl("followups-mail-webhook")}?provider=outlook` : undefined,
    });
  }

  const claude = new ClaudeClient(env("ANTHROPIC_API_KEY"));
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  return {
    repo,
    providers,
    drafter: new ClaudeDrafter(claude, Deno.env.get("FOLLOWUPS_DRAFT_MODEL") || DEFAULT_DRAFT_MODEL),
    classifier: new ClaudeClassifier(claude, Deno.env.get("FOLLOWUPS_CLASSIFY_MODEL") || DEFAULT_CLASSIFY_MODEL),
    notifier: botToken ? new TelegramNotifier(botToken, appUrl()) : null,
    files: new SupabaseFileStore(db),
    now: () => new Date(),
    log: consoleLogger,
    appUrl: appUrl(),
  };
}

// ------------------------------------------------------------------ http ----

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

/** Only the JobOS app (and any extra origins you list) may call the browser-facing API. */
export function corsHeaders(req: Request): Record<string, string> {
  const allowed = [appUrl(), ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",")]
    .map((o) => o?.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...(allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS, ...extra },
  });
}

export function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/plain", ...SECURITY_HEADERS } });
}

export function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url, ...SECURITY_HEADERS } });
}

/** Read a JSON body with a size cap. */
export async function readJson<T>(req: Request, maxBytes = 16_384): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, "request too large");
  const raw = await req.text();
  if (raw.length > maxBytes) throw new HttpError(413, "request too large");
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The signed-in JobOS user, verified with Supabase Auth (never trust a user id from the body). */
export async function requireUser(req: Request, db: SupabaseClient): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) throw new HttpError(401, "sign in required");
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, "sign in required");
  return data.user.id;
}

/** Shared-secret check for machine callers (pg_cron, webhooks). */
export function requireSecret(provided: string | null, envName: string): void {
  const expected = Deno.env.get(envName) ?? "";
  if (expected.length < 24) throw new HttpError(500, `${envName} is not configured`);
  if (!safeEqual(provided ?? "", expected)) throw new HttpError(401, "unauthorized");
}

/** Run work after the response is sent (webhooks must answer fast). */
export function background(p: Promise<unknown>): void {
  const guarded = p.catch((e) => consoleLogger.error("background task failed", { error: String(e) }));
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(guarded);
}

export function handleError(e: unknown, cors: Record<string, string> = {}): Response {
  if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
  const name = (e as Error)?.name;
  if (name === "ConflictError") return json({ error: "this follow-up was already handled" }, 409, cors);
  if (name === "ApprovalError") {
    const err = e as Error & { status?: number };
    return json({ error: err.message }, err.status ?? 400, cors);
  }
  consoleLogger.error("unhandled error", { error: String((e as Error)?.message ?? e) });
  return json({ error: "internal error" }, 500, cors); // no internals leak to the caller
}
