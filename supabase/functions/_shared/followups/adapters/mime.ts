import type { EmailAttachment } from "../ports.ts";
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
  attachment?: EmailAttachment | null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Safe attachment file name: no quotes, slashes or control characters; extension kept. */
export function attachmentName(name: string): string {
  // deno-lint-ignore no-control-regex
  const clean = name.replace(/[\x00-\x1f\x7f"\\/]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  return clean || "Resume.pdf";
}

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function assertAttachment(a: EmailAttachment): void {
  if (!ALLOWED_ATTACHMENT_TYPES.has(a.mimeType)) throw new Error(`attachment type ${a.mimeType} is not allowed`);
  if (a.content.length === 0 || a.content.length > MAX_ATTACHMENT_BYTES) throw new Error("attachment must be between 1 byte and 2 MB");
}

const wrap76 = (s: string) => s.replace(/.{76}/g, "$&\r\n");

/** RFC 2822 message (plain text, or multipart/mixed with one attachment), base64url for Gmail's `raw`. */
export function buildRawMessage(m: MimeInput): string {
  const textBody = wrap76(b64(m.bodyText.replace(/\r?\n/g, "\r\n")));
  const headers = [
    `To: ${headerSafe(m.to)}`,
    `Subject: ${encodeHeader(m.subject)}`,
    "MIME-Version: 1.0",
    `X-JobOS-Followup-Id: ${headerSafe(m.followUpId)}`,
  ];
  if (m.inReplyTo) {
    headers.push(`In-Reply-To: ${headerSafe(m.inReplyTo)}`);
    headers.push(`References: ${headerSafe(m.references ?? m.inReplyTo)}`);
  }

  if (!m.attachment) {
    headers.push('Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64");
    return base64url(enc.encode(`${headers.join("\r\n")}\r\n\r\n${textBody}`));
  }

  assertAttachment(m.attachment);
  const boundary = `jobos_${crypto.randomUUID().replace(/-/g, "")}`;
  const name = attachmentName(m.attachment.fileName);
  // RFC 2231 encoding keeps any non-ASCII file name intact and quote-free.
  const nameParam = /^[\x20-\x7e]*$/.test(name) ? `filename="${name}"` : `filename*=UTF-8''${encodeURIComponent(name)}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textBody,
    `--${boundary}`,
    `Content-Type: ${m.attachment.mimeType}`,
    `Content-Disposition: attachment; ${nameParam}`,
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(bytesToBase64(m.attachment.content)),
    `--${boundary}--`,
    "",
  ];
  return base64url(enc.encode(`${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`));
}

/** "Sara K <sara@x.com>" -> { address: "sara@x.com", name: "Sara K" } */
export function parseAddress(raw: string): { address: string; name: string | null } {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { address: m[2].trim().toLowerCase(), name: m[1].trim() || null };
  return { address: raw.trim().toLowerCase(), name: null };
}
