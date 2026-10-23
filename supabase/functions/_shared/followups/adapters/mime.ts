import { base64url, headerSafe } from "../security.ts";

const enc = new TextEncoder();

function b64(s: string): string {
  let bin = "";
  for (const b of enc.encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** RFC 2047 encoded-word for non-ASCII header values. */
export function encodeHeader(value: string): string {
  const clean = headerSafe(value);
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${b64(clean)}?=`;
}

export function replySubject(original: string | null, fallback: string): string {
  if (!original) return fallback;
  return /^\s*re:/i.test(original) ? original : `Re: ${original}`;
}

export interface MimeInput {
  to: string;
  subject: string;
  bodyText: string;
  followUpId: string;
  inReplyTo?: string | null;
  references?: string | null;
}

/** Plain-text RFC 2822 message, base64url-encoded for the Gmail API `raw` field. */
export function buildRawMessage(m: MimeInput): string {
  const body = b64(m.bodyText.replace(/\r?\n/g, "\r\n")).replace(/.{76}/g, "$&\r\n");
  const headers = [
    `To: ${headerSafe(m.to)}`,
    `Subject: ${encodeHeader(m.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    `X-JobOS-Followup-Id: ${headerSafe(m.followUpId)}`,
  ];
  if (m.inReplyTo) {
    headers.push(`In-Reply-To: ${headerSafe(m.inReplyTo)}`);
    headers.push(`References: ${headerSafe(m.references ?? m.inReplyTo)}`);
  }
  return base64url(enc.encode(`${headers.join("\r\n")}\r\n\r\n${body}`));
}

/** "Sara K <sara@x.com>" -> { address: "sara@x.com", name: "Sara K" } */
export function parseAddress(raw: string): { address: string; name: string | null } {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { address: m[2].trim().toLowerCase(), name: m[1].trim() || null };
  return { address: raw.trim().toLowerCase(), name: null };
}
