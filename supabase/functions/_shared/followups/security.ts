// Security helpers shared by the follow-up edge functions.
// Web Crypto only, so this runs in Deno edge functions and in tests.

const enc = new TextEncoder();

/** Constant-time string comparison (avoids leaking secrets through timing). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length === 0 || b.length === 0) return false;
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function hmac(secret: string, data: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data));
  return base64url(new Uint8Array(sig));
}

export async function sha256b64url(data: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(data))));
}

// ---------------------------------------------------------- OAuth state ----

export interface OAuthState {
  uid: string;
  provider: "gmail" | "outlook";
  nonce: string;
  exp: number; // epoch seconds
}

/** Signed, expiring OAuth state. The PKCE verifier is derived from it, so nothing is stored server side. */
export async function signState(secret: string, state: OAuthState): Promise<string> {
  const payload = base64url(enc.encode(JSON.stringify(state)));
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyState(secret: string, token: string, now = Date.now()): Promise<OAuthState | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sig, await hmac(secret, payload))) return null;
  try {
    const state = JSON.parse(new TextDecoder().decode(base64urlDecode(payload))) as OAuthState;
    if (typeof state.uid !== "string" || !/^[0-9a-f-]{36}$/i.test(state.uid)) return null;
    if (state.provider !== "gmail" && state.provider !== "outlook") return null;
    if (typeof state.exp !== "number" || state.exp * 1000 < now) return null;
    return state;
  } catch {
    return null;
  }
}

/** PKCE verifier bound to the signed state: unguessable without the server secret. */
export async function pkceVerifier(secret: string, nonce: string): Promise<string> {
  return await hmac(secret, `pkce:${nonce}`);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return await sha256b64url(verifier);
}

// ------------------------------------------------------------ escaping ----

/** Escape text for Telegram HTML parse mode. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Header-injection guard for anything placed in an email header. */
export function headerSafe(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export function isEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && /^[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[a-z]{2,}$/i.test(s);
}

/** Never let a token or long secret reach logs. */
export function redact(s: string): string {
  return s.replace(/(ya29\.|eyJ|EwB|M\.R3_|1\/\/)[A-Za-z0-9._\-~+/=]{8,}/g, "$1[redacted]");
}
