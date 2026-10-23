// Connect Gmail or Outlook.
//   POST {action:"start", provider}  (signed-in user)  -> { url } to send the browser to
//   GET  ?code&state                 (provider redirect) -> stores the inbox, redirects to Settings
// Security: signed + expiring state bound to the user, PKCE (S256), minimal scopes,
// refresh token stored only in Vault, nothing sensitive in redirects or logs.

import { GMAIL_SCOPES, GOOGLE_TOKEN_URL, MS_TOKEN_URL, OUTLOOK_SCOPES } from "../_shared/followups/adapters/tokens.ts";
import {
  appUrl,
  buildDeps,
  corsHeaders,
  env,
  functionUrl,
  handleError,
  HttpError,
  json,
  readJson,
  redirect,
  requireUser,
  serviceClient,
} from "../_shared/followups/runtime.ts";
import type { MailAccount } from "../_shared/followups/ports.ts";
import { pkceChallenge, pkceVerifier, randomToken, signState, verifyState } from "../_shared/followups/security.ts";

const STATE_TTL_SECONDS = 600;

function settingsRedirect(result: string, provider?: string): Response {
  const base = appUrl() ?? "/";
  const q = new URLSearchParams({ followups: result, ...(provider ? { provider } : {}) });
  return redirect(`${base}/settings?${q}`);
}

async function startUrl(userId: string, provider: "gmail" | "outlook"): Promise<string> {
  const secret = env("OAUTH_STATE_SECRET");
  const nonce = randomToken(16);
  const state = await signState(secret, {
    uid: userId,
    provider,
    nonce,
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
  });
  const challenge = await pkceChallenge(await pkceVerifier(secret, nonce));
  const redirectUri = functionUrl("followups-oauth");

  if (provider === "gmail") {
    const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    u.search = new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [...GMAIL_SCOPES, "openid", "email"].join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
    return u.toString();
  }
  const u = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  u.search = new URLSearchParams({
    client_id: env("MS_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" "),
    prompt: "select_account",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return u.toString();
}

async function exchange(provider: "gmail" | "outlook", code: string, verifier: string) {
  const google = provider === "gmail";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: functionUrl("followups-oauth"),
    client_id: env(google ? "GOOGLE_CLIENT_ID" : "MS_CLIENT_ID"),
    client_secret: env(google ? "GOOGLE_CLIENT_SECRET" : "MS_CLIENT_SECRET"),
    code_verifier: verifier,
  });
  if (!google) body.set("scope", OUTLOOK_SCOPES.join(" "));
  const res = await fetch(google ? GOOGLE_TOKEN_URL : MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const tok = await res.json() as { access_token?: string; refresh_token?: string; scope?: string };
  if (!res.ok || !tok.access_token || !tok.refresh_token) throw new Error(`token exchange failed (${res.status})`);
  return tok as { access_token: string; refresh_token: string; scope?: string };
}

async function mailboxAddress(provider: "gmail" | "outlook", accessToken: string): Promise<string> {
  const url = provider === "gmail"
    ? "https://gmail.googleapis.com/gmail/v1/users/me/profile"
    : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`profile lookup failed (${res.status})`);
  const p = await res.json() as { emailAddress?: string; mail?: string; userPrincipalName?: string };
  const address = (p.emailAddress ?? p.mail ?? p.userPrincipalName ?? "").toLowerCase();
  if (!address.includes("@")) throw new Error("no mailbox address on this account");
  return address;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (req.method === "POST") {
    try {
      const db = serviceClient();
      const userId = await requireUser(req, db);
      const b = await readJson<{ action?: string; provider?: string }>(req);
      if (b.action !== "start" || (b.provider !== "gmail" && b.provider !== "outlook")) {
        throw new HttpError(400, "expected {action:'start', provider:'gmail'|'outlook'}");
      }
      return json({ url: await startUrl(userId, b.provider) }, 200, cors);
    } catch (e) {
      return handleError(e, cors);
    }
  }

  if (req.method !== "GET") return json({ error: "method not allowed" }, 405);

  // Provider callback. Any failure redirects with a generic result; details stay in the logs.
  const params = new URL(req.url).searchParams;
  const secret = env("OAUTH_STATE_SECRET");
  const state = await verifyState(secret, params.get("state") ?? "");
  if (!state) return settingsRedirect("invalid_state");
  if (params.get("error")) return settingsRedirect("denied", state.provider);
  const code = params.get("code");
  if (!code) return settingsRedirect("error", state.provider);

  try {
    const tok = await exchange(state.provider, code, await pkceVerifier(secret, state.nonce));
    if (state.provider === "gmail") {
      const granted = new Set((tok.scope ?? "").split(" "));
      if (!GMAIL_SCOPES.every((s) => granted.has(s))) return settingsRedirect("missing_permissions", "gmail");
    }
    const address = await mailboxAddress(state.provider, tok.access_token);

    const db = serviceClient();
    const { data, error } = await db.rpc("upsert_mail_account", {
      p_user_id: state.uid,
      p_provider: state.provider,
      p_address: address,
      p_refresh_token: tok.refresh_token,
    });
    if (error) throw new Error(error.message);

    // Start reply tracking from now (and push notifications when configured).
    const row = data as { id: string };
    const deps = buildDeps(db);
    const acct = await deps.repo.mailAccount(row.id) as MailAccount;
    const provider = deps.providers[state.provider];
    if (provider) {
      const start = await provider.inboundSince(acct, null);
      const sub = await provider.ensureSubscription({ ...acct, syncCursor: start.cursor }).catch(() => null);
      await deps.repo.updateMailAccount(acct.id, {
        syncCursor: sub?.cursor ?? start.cursor,
        subscriptionId: sub?.subscriptionId ?? null,
        watchExpiresAt: sub?.expiresAt ?? null,
      });
    }
    return settingsRedirect("connected", state.provider);
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "oauth callback failed", provider: state.provider, error: String((e as Error).message) }));
    return settingsRedirect("error", state.provider);
  }
});
