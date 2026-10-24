import type { Classifier, Draft, DraftContext, Drafter, ReplyLabel } from "../ports.ts";
import { FOLLOWUP_WRITER_PROMPT, REPLY_CLASSIFIER_PROMPT } from "../prompts.ts";
import { limitsFor } from "../validators.ts";
import type { FetchFn } from "./http.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
export const DEFAULT_DRAFT_MODEL = "claude-sonnet-5-5";
export const DEFAULT_CLASSIFY_MODEL = "claude-haiku-5-5";

const LABELS: ReplyLabel[] = ["interview_invite", "rejection", "still_reviewing", "question_for_you", "auto_reply_ooo", "other"];

interface ToolUseResponse {
  content: { type: string; name?: string; input?: Record<string, unknown> }[];
  stop_reason?: string;
}

/** Strip anything that could close our XML-ish wrappers, then cap length. */
function untrusted(s: string, max: number): string {
  return s.replace(/<\/?(thread|email|message)[^>]*>/gi, "").replace(/"/g, "'").slice(0, max);
}

export class ClaudeClient {
  constructor(private apiKey: string, private fetchFn: FetchFn = fetch) {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  }

  async tool(model: string, system: string, user: string, tool: { name: string; description: string; input_schema: unknown }, maxTokens: number) {
    const res = await this.fetchFn(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json() as ToolUseResponse;
    const block = json.content.find((c) => c.type === "tool_use" && c.name === tool.name);
    if (!block?.input) throw new Error("Claude returned no tool output");
    return block.input;
  }
}

export class ClaudeDrafter implements Drafter {
  constructor(private claude: ClaudeClient, private model = DEFAULT_DRAFT_MODEL) {}

  async draft(ctx: DraftContext, fixes: string[] = []): Promise<Draft> {
    const { min, max } = limitsFor(ctx);
    const thread = ctx.thread.length
      ? ctx.thread.map((m) =>
        `<message from="${untrusted(m.from, 120)}" date="${m.date}" subject="${untrusted(m.subject, 160)}">\n${untrusted(m.text, 800)}\n</message>`
      ).join("\n")
      : "(no earlier messages)";

    const user = [
      `Kind: ${ctx.kind} (attempt ${ctx.attemptNo})`,
      `Channel: ${ctx.channel}`,
      `Resume attached to this message: ${ctx.hasAttachment ? "yes" : "no"}`,
      `Word limit: ${min} to ${max} words`,
      `Role: ${ctx.job.position} at ${ctx.job.company}${ctx.job.appliedOn ? `, applied on ${ctx.job.appliedOn}` : ""}`,
      ctx.job.jdSummary ? `Role summary: ${ctx.job.jdSummary}` : "",
      `Recipient: ${ctx.contact.name}${ctx.contact.role ? `, ${ctx.contact.role}` : ""}`,
      `Candidate: ${ctx.you.name ?? "the candidate"}`,
      `Candidate facts (the ONLY facts you may cite):\n${ctx.you.facts.map((f) => `- ${f}`).join("\n") || "(none)"}`,
      ctx.previousValuePoints.length ? `Value points already used (do not repeat): ${ctx.previousValuePoints.join(" | ")}` : "",
      ctx.you.signature ? `Sign off with exactly:\n${ctx.you.signature}` : "Sign off with the candidate's first name.",
      `<thread>\n${thread}\n</thread>`,
      ctx.editNotes.length ? `The candidate asked for these changes, apply all of them:\n${ctx.editNotes.map((n) => `- ${n}`).join("\n")}` : "",
      fixes.length ? `Your previous draft was rejected. Fix these problems:\n${fixes.map((f) => `- ${f}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const out = await this.claude.tool(this.model, FOLLOWUP_WRITER_PROMPT, user, {
      name: "write_followup",
      description: "Return the follow-up message.",
      input_schema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Email subject; empty for LinkedIn" },
          body: { type: "string", description: "The full message body, plain text, including sign-off" },
          value_point: { type: "string", description: "The single fact from the facts list that the message uses" },
        },
        required: ["subject", "body", "value_point"],
      },
    }, 800);

    return {
      subject: String(out.subject ?? "").trim(),
      body: String(out.body ?? "").trim(),
      valuePoint: String(out.value_point ?? "").trim(),
    };
  }
}

export class ClaudeClassifier implements Classifier {
  constructor(private claude: ClaudeClient, private model = DEFAULT_CLASSIFY_MODEL) {}

  async classify(email: { subject: string; text: string }): Promise<ReplyLabel> {
    const out = await this.claude.tool(
      this.model,
      REPLY_CLASSIFIER_PROMPT,
      `<email subject="${untrusted(email.subject, 200)}">\n${untrusted(email.text, 2000)}\n</email>`,
      {
        name: "classify",
        description: "Return the label.",
        input_schema: {
          type: "object",
          properties: { label: { type: "string", enum: LABELS } },
          required: ["label"],
        },
      },
      50,
    );
    const label = out.label as ReplyLabel;
    return LABELS.includes(label) ? label : "other";
  }
}
