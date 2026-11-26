// Message drafting for contacts (REQ-005, strategy spec 5E).
//
// Pure: chooses the ask, builds the prompt and checks the result. The model call lives in
// services/AIGenerator.ts. JobOS only drafts; the user sends every message (P2), and a draft
// may only use facts the user supplied (P3).

import type { WarmthStage } from "./contact-next-action";

export const ASKS = ["connect", "advice", "call", "referral"] as const;
export type AskKind = (typeof ASKS)[number];

export const ASK_LABELS: Record<AskKind, string> = {
  connect: "Connection request",
  advice: "Ask for advice",
  call: "Ask for a 15-minute call",
  referral: "Ask for a referral",
};

/** LinkedIn caps invitation notes at 300 characters. Other messages stay short on purpose. */
export const ASK_MAX_CHARS: Record<AskKind, number> = { connect: 300, advice: 600, call: 600, referral: 700 };

const ASK_GOAL: Record<AskKind, string> = {
  connect: "ask to connect, with no other request",
  advice: "ask one specific question for their advice, something answerable in a short reply",
  call: "ask for a 15-minute call at a time that suits them, and say what you would like to learn",
  referral: "ask whether they would be comfortable referring you for the role, and make it easy to say no",
};

/**
 * The ask ladder: advice first, then a call, then a referral. A referral ask is available only
 * once a real exchange is logged (they have written or spoken to the user) and the relationship
 * is at In conversation or Advocate.
 */
export function availableAsks(stage: WarmthStage, hasInbound: boolean): AskKind[] {
  switch (stage) {
    case "identified":
    case "following":
    case "engaged":
      return ["connect"];
    case "connected":
      return ["advice", "call"];
    case "in_conversation":
    case "advocate":
      return hasInbound ? ["advice", "call", "referral"] : ["advice", "call"];
  }
}

export function recommendedAsk(stage: WarmthStage, hasInbound: boolean): AskKind {
  if (stage === "advocate" && hasInbound) return "referral";
  if (stage === "in_conversation") return "call";
  return availableAsks(stage, hasInbound)[0];
}

export interface DraftContact {
  name: string;
  position?: string | null;
  company?: string | null;
  /** How the user knows them. */
  relationship?: string | null;
  /** The user's own notes about this person. */
  notes?: string | null;
}

export interface DraftSender {
  firstName: string;
  targetTitle?: string | null;
  /** True statements about the sender, taken from the Master Profile, that may be cited. */
  facts: string[];
}

export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** What the user has told JobOS about this person. Drafting needs at least this (AC: uses the user's notes). */
export function personalContext(contact: DraftContact): string {
  return [contact.relationship, contact.notes].map((v) => (v ?? "").trim()).filter(Boolean).join("\n");
}

export class DraftInputError extends Error {}

export function buildDraftPrompt(contact: DraftContact, sender: DraftSender, ask: AskKind, jobContext?: string | null): string {
  const context = personalContext(contact);
  if (!context) {
    throw new DraftInputError("Add a note about this person first: how you know them or why you are writing. Drafts are built from your notes.");
  }
  const facts = sender.facts.map((f) => f.trim()).filter(Boolean);
  return [
    `Write a short LinkedIn message from ${sender.firstName || "me"} to ${contact.name}.`,
    "",
    "About them (given by the sender, treat as true):",
    `- Name: ${contact.name}`,
    contact.position ? `- Role: ${contact.position}` : "",
    contact.company ? `- Company: ${contact.company}` : "",
    "",
    "The sender's own notes about this person (the reason for writing must come from here):",
    context,
    "",
    "True facts about the sender that may be cited as proof (use at most one, and only if relevant):",
    facts.length ? facts.map((f) => `- ${f}`).join("\n") : "- (none given: do not cite any proof)",
    jobContext ? `\nThe role this is about: ${jobContext}` : "",
    "",
    "Structure, in this order:",
    `1. Greeting using their first name, "${firstNameOf(contact.name)}".`,
    "2. One line on why this person, drawn from the notes above.",
    "3. One line of relevant proof from the facts above, or nothing if none fits.",
    `4. One small ask: ${ASK_GOAL[ask]}.`,
    "",
    "Rules:",
    "- Use ONLY what is written above. Do not invent meetings, shared history, mutual contacts, posts you read, achievements, employers, dates, location or visa status.",
    "- No flattery, no generic praise, no hashtags, no emojis, no placeholders in brackets.",
    `- At most ${ASK_MAX_CHARS[ask]} characters in total.`,
    "- Output only the message text.",
  ].filter((line) => line !== "").join("\n");
}

// -------------------------------------------------------------- checking ---

const words = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

function shingles(text: string, skip: Set<string>): Set<string> {
  const w = words(text).filter((x) => !skip.has(x));
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}

/** 0 to 1: how much two drafts share, ignoring the names in `ignore`. */
export function draftSimilarity(a: string, b: string, ignore: string[] = []): number {
  const skip = new Set(ignore.flatMap(words));
  const sa = shingles(a, skip);
  const sb = shingles(b, skip);
  if (sa.size === 0 || sb.size === 0) return words(a).join(" ") === words(b).join(" ") && words(a).length > 0 ? 1 : 0;
  let shared = 0;
  for (const s of sa) if (sb.has(s)) shared++;
  return shared / (sa.size + sb.size - shared);
}

/** Two drafts this alike are the same message with the name swapped. */
export const TOO_SIMILAR = 0.8;

export interface DraftCheck {
  ok: boolean;
  problems: string[];
}

/**
 * Checks a draft in code, whoever wrote it. `otherDrafts` are the drafts saved for the user's
 * other contacts: a message may not be the same as one written for someone else.
 */
export function checkDraft(
  text: string,
  ask: AskKind,
  contact: DraftContact,
  otherDrafts: { name: string; text: string }[] = [],
): DraftCheck {
  const problems: string[] = [];
  const draft = text.trim();
  const first = firstNameOf(contact.name);

  if (!draft) problems.push("The draft is empty.");
  if (draft.length > ASK_MAX_CHARS[ask]) problems.push(`It is ${draft.length} characters; the limit is ${ASK_MAX_CHARS[ask]}.`);
  if (first && !draft.toLowerCase().includes(first.toLowerCase())) problems.push(`It does not greet ${first} by name.`);
  if (/\[[^\]]*\]|\{\{[^}]*\}\}|<[^>]+>/.test(draft)) problems.push("It still contains a placeholder in brackets.");

  for (const other of otherDrafts) {
    if (!other.text.trim()) continue;
    if (draftSimilarity(draft, other.text, [contact.name, other.name]) >= TOO_SIMILAR) {
      problems.push(`It is almost the same as your draft for ${other.name}. Make it about this person.`);
      break;
    }
  }
  return { ok: problems.length === 0, problems };
}

/** Facts from the Master Profile that a draft may cite. Nothing here is generated. */
export function senderFacts(profile: {
  targetTitle?: string;
  experience?: { position: string; company: string; current?: boolean }[];
  projects?: { name: string }[];
} | null): string[] {
  if (!profile) return [];
  const facts: string[] = [];
  const current = profile.experience?.find((e) => e.current) ?? profile.experience?.[0];
  if (current?.position && current.company) facts.push(`${current.current ? "Currently" : "Most recently"} ${current.position} at ${current.company}`);
  for (const project of (profile.projects ?? []).slice(0, 2)) if (project.name) facts.push(`Built ${project.name}`);
  if (profile.targetTitle) facts.push(`Looking for ${profile.targetTitle} roles`);
  return facts;
}
