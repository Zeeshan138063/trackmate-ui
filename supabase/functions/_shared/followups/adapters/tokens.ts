import { MailAuthError, type MailAccount, type TokenProvider, TransientMailError } from "../ports.ts";
import { redact } from "../security.ts";
import type { FetchFn } from "./http.ts";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];
export const OUTLOOK_SCOPES = ["offline_access", "User.Read", "Mail.ReadWrite", "Mail.Send"];

export interface OAuthClients {
  google: { clientId: string; clientSecret: string };
  microsoft: { clientId: string; clientSecret: string };
}

export interface TokenStore {
  refreshToken(accountId: string): Promise<string | null>;
  saveRefreshToken(accountId: string, token: string): Promise<void>;
  markReauthRequired(accountId: string): Promise<void>;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

/** Exchanges stored refresh tokens for short-lived access tokens, kept in memory only. */
export class RefreshingTokenProvider implements TokenProvider {
  private cache = new Map<string, { token: string; exp: number }>();

  constructor(private clients: OAuthClients, private store: TokenStore, private fetchFn: FetchFn = fetch) {}

  async accessToken(acct: MailAccount): Promise<string> {
    const hit = this.cache.get(acct.id);
    if (hit && hit.exp > Date.now() + 60_000) return hit.token;

    const refresh = await this.store.refreshToken(acct.id);
    if (!refresh) {
      await this.store.markReauthRequired(acct.id);
      throw new MailAuthError(`no refresh token for ${acct.provider} account ${acct.id}`);
    }

    const google = acct.provider === "gmail";
    const client = google ? this.clients.google : this.clients.microsoft;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: client.clientId,
      client_secret: client.clientSecret,
    });
    if (!google) body.set("scope", OUTLOOK_SCOPES.join(" "));

    let res: Response;
    try {
      res = await this.fetchFn(google ? GOOGLE_TOKEN_URL : MS_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new TransientMailError(`token endpoint unreachable: ${(e as Error).message}`);
    }
    const json = await res.json().catch(() => ({})) as TokenResponse;

    if (!res.ok || !json.access_token) {
      if (res.status >= 500 || res.status === 429) throw new TransientMailError(`token refresh ${res.status}`);
      // invalid_grant: revoked, password changed, or expired testing-mode token.
      await this.store.markReauthRequired(acct.id);
      throw new MailAuthError(`token refresh failed: ${json.error ?? res.status} ${redact(json.error_description ?? "")}`);
    }

    // Microsoft rotates refresh tokens; keep the newest one.
    if (json.refresh_token && json.refresh_token !== refresh) {
      await this.store.saveRefreshToken(acct.id, json.refresh_token);
    }
    this.cache.set(acct.id, { token: json.access_token, exp: Date.now() + json.expires_in * 1000 });
    return json.access_token;
  }
}
