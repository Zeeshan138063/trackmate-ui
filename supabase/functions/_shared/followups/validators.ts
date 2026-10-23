// Checks every draft must pass before it reaches you. Code, not the prompt, is the gate.

import type { Draft, DraftContext } from "./ports.ts";

export interface ValidationResult {
  ok: boolean;
  problems: string[];
}

const BANNED = [
  "i hope this email finds you well",
  "i hope this message finds you well",
  "just checking in",
  "just following up",
  "touch base",
  "circle back",
  "i wanted to reach out",
  "as an ai",
];

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function overlap(a: string, b: string): number {
  const x = new Set(normalise(a).split(" ").filter((w) => w.length > 2));
  const y = new Set(normalise(b).split(" ").filter((w) => w.length > 2));
  if (x.size === 0) return 0;
  let hit = 0;
  for (const w of x) if (y.has(w)) hit++;
  return hit / x.size;
}

export function limitsFor(ctx: Pick<DraftContext, "channel" | "kind">): { min: number; max: number } {
  if (ctx.channel === "linkedin") return { min: 25, max: 80 };
  if (ctx.kind === "thank_you") return { min: 40, max: 120 };
  return { min: 40, max: 110 };
}

export function validateDraft(draft: Draft, ctx: DraftContext): ValidationResult {
  const problems: string[] = [];
  const body = draft.body ?? "";
  const lower = body.toLowerCase();
  const { min, max } = limitsFor(ctx);
  const words = wordCount(body);

  if (words < min || words > max) problems.push(`body is ${words} words; keep it between ${min} and ${max}`);
  if (/[—–]/.test(body) || /[—–]/.test(draft.subject)) {
    problems.push("remove em and en dashes; use commas or full stops");
  }
  for (const phrase of BANNED) if (lower.includes(phrase)) problems.push(`remove the phrase "${phrase}"`);
  if (/\[[^\]]{2,40}\]|\{\{[^}]*\}\}|<[A-Z_ ]{3,}>/.test(body)) problems.push("fill in or remove placeholders");
  if (ctx.contact.firstName && !lower.includes(ctx.contact.firstName.toLowerCase())) {
    problems.push(`address ${ctx.contact.firstName} by first name`);
  }
  const roleHit = overlap(ctx.job.position, body) >= 0.5 || lower.includes(ctx.job.company.toLowerCase().trim());
  if (!roleHit) problems.push(`mention the ${ctx.job.position} role or ${ctx.job.company}`);
  if (ctx.channel === "email" && !draft.subject.trim()) problems.push("email needs a subject");

  if (ctx.you.facts.length > 0) {
    const grounded = ctx.you.facts.some((f) => overlap(draft.valuePoint, f) >= 0.6);
    if (!grounded) problems.push("value_point must come from your facts list, not be invented");
    for (const prev of ctx.previousValuePoints) {
      if (overlap(draft.valuePoint, prev) >= 0.8) problems.push("use a different value point than the last follow-up");
    }
  }
  return { ok: problems.length === 0, problems };
}
