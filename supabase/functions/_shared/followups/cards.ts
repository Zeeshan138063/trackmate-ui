// Text of the approval cards and status lines. Everything user-supplied is escaped.

import { localParts } from "./calendar.ts";
import type { FollowUpView } from "./ports.ts";
import { escapeHtml as e } from "./security.ts";

const KIND_LABEL: Record<string, string> = {
  chaser: "Follow-up",
  thank_you: "Thank-you",
  deadline_checkin: "Check-in after their date",
  nurture: "Keep-in-touch note",
};
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatSlot(at: Date, timeZone: string): string {
  const p = localParts(at, timeZone);
  return `${WEEKDAY[p.weekday]} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")} their time`;
}

export function approvalCardText(v: FollowUpView, warnings: string[] = []): string {
  const kind = KIND_LABEL[v.kind] ?? v.kind;
  const attempt = v.kind === "chaser" ? ` ${v.attemptNo} of 2` : "";
  const via = v.channel === "email" ? "Email" : "LinkedIn, you send it";
  const lines = [
    `<b>${e(v.job.position)}</b> · ${e(v.job.company)}`,
    `To: ${e(v.contact.name)}${v.contact.position ? ` (${e(v.contact.position)})` : ""} · ${via}`,
    `${kind}${attempt}${v.sendAt && v.channel === "email" ? ` · sends ${e(formatSlot(v.sendAt, v.contact.timeZone))}` : ""}`,
    "",
  ];
  if (v.channel === "email" && v.draftSubject && !v.replyTarget) lines.push(`<b>Subject:</b> ${e(v.draftSubject)}`);
  if (v.channel === "email" && v.attachResume) {
    lines.push(v.resume ? `<b>Attachment:</b> ${e(v.resume.fileName)}` : "<b>Attachment:</b> <i>no resume attached to this application</i>");
  }
  lines.push(e(v.draftBody ?? ""));
  if (warnings.length) lines.push("", `<i>Check before approving: ${e(warnings.join("; "))}</i>`);
  return lines.join("\n");
}

export function outcomeLine(v: Pick<FollowUpView, "job" | "contact">, outcome: string): string {
  return `<b>${e(v.job.position)}</b> · ${e(v.job.company)}\nTo: ${e(v.contact.name)}\n\n${e(outcome)}`;
}

export function linkedInHandoff(v: FollowUpView): string {
  return [
    `Send this on LinkedIn to <b>${e(v.contact.name)}</b>, then tap <b>Mark sent</b>.`,
    "",
    `<code>${e(v.draftBody ?? "")}</code>`,
  ].join("\n");
}
