import { MailAuthError, TransientMailError } from "../ports.ts";
import { redact } from "../security.ts";

export type FetchFn = typeof fetch;

/** JSON request with a timeout and error mapping: 401/403 auth, 429/5xx transient. */
export async function requestJson<T>(
  fetchFn: FetchFn,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs ?? 20_000) });
  } catch (e) {
    throw new TransientMailError(`network error: ${(e as Error).message}`);
  }
  if (res.status === 204 || res.status === 202) return undefined as T;
  const text = await res.text();
  if (res.ok) return (text ? JSON.parse(text) : undefined) as T;

  const detail = redact(text.slice(0, 300));
  if (res.status === 401) throw new MailAuthError(`auth failed (${res.status}): ${detail}`);
  if (res.status === 429 || res.status >= 500) throw new TransientMailError(`provider ${res.status}: ${detail}`, res.status);
  const err = new Error(`provider ${res.status}: ${detail}`) as Error & { status?: number };
  err.status = res.status;
  throw err;
}
