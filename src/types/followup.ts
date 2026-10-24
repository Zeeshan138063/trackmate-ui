export type FollowUpState =
  | "planned"
  | "drafting"
  | "awaiting_approval"
  | "approved"
  | "sending"
  | "awaiting_manual_send"
  | "sent"
  | "skipped"
  | "cancelled"
  | "failed";

export type FollowUpKind = "chaser" | "thank_you" | "deadline_checkin" | "nurture";

export interface AgentFollowUp {
  id: string;
  job_id: string;
  contact_id: string;
  kind: FollowUpKind;
  attempt_no: number;
  channel: "email" | "linkedin";
  state: FollowUpState;
  due_date: string;
  send_at: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  draft_version: number;
  edit_notes: string[];
  last_error: string | null;
  sent_at: string | null;
  mail_account_id: string | null;
  attach_resume: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimelineEngagement {
  id: string;
  contact_id: string;
  job_id: string | null;
  type: string;
  direction: "inbound" | "outbound";
  kind: string | null;
  date: string;
  notes: string | null;
  subject: string | null;
  classification: string | null;
  provider: "gmail" | "outlook" | null;
}

export interface TimelineContact {
  id: string;
  name: string;
  email: string | null;
  linkedin_url: string | null;
  position: string | null;
  interaction_type: string | null;
}

export interface MailAccountSummary {
  id: string;
  provider: "gmail" | "outlook";
  address: string;
  status: "active" | "reauth_required" | "disabled";
}

export type TimelineItem =
  | { type: "engagement"; at: Date; engagement: TimelineEngagement }
  | { type: "followup"; at: Date; followUp: AgentFollowUp };

export interface ContactBranch {
  contact: TimelineContact;
  items: TimelineItem[];
}

export const OPEN_STATES: FollowUpState[] = [
  "planned",
  "drafting",
  "awaiting_approval",
  "approved",
  "sending",
  "awaiting_manual_send",
  "failed",
];

export const NEEDS_YOU: FollowUpState[] = ["awaiting_approval", "awaiting_manual_send", "failed"];
