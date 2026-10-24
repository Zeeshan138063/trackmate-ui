function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

/** Plain-language reason nothing is scheduled, so you know what to change. */
export function idleReason(o: {
  setupMissing: boolean;
  status?: string;
  appliedOn?: string | null;
  contacts: { email: string | null; linkedin_url: string | null }[];
  now?: Date;
}): string {
  if (o.setupMissing) return "Follow-ups aren't switched on yet. Once the follow-up agent is set up, they'll be planned here automatically.";
  if (o.contacts.length === 0) return "Link the recruiter or hiring manager in the Contacts tab. Follow-ups go to a person, not the job board.";
  if (!o.contacts.some((c) => c.email || c.linkedin_url)) return "Add an email or LinkedIn URL to this contact so there's somewhere to send a follow-up.";
  if (o.status && !["Applied", "Interviewing", "Negotiating"].includes(o.status)) {
    return `Follow-ups start once you apply. Set the status to Applied and fill in Date Applied in the Details tab (it's ${o.status} now).`;
  }
  if (!o.appliedOn) return "Set Date Applied in the Details tab. The first follow-up is planned 6 business days after it.";
  const applied = new Date(`${o.appliedOn}T09:00:00`);
  const now = o.now ?? new Date();
  if (now.getTime() - applied.getTime() > 21 * 86_400_000) {
    return "You applied more than 3 weeks ago, so no automatic chaser is planned (the role has often moved on by then).";
  }
  const due = addBusinessDays(applied, 6);
  const how = o.contacts.some((c) => c.email)
    ? "You'll approve the draft, then it's emailed from your inbox."
    : "It will be a LinkedIn draft for you to send yourself.";
  return due > now
    ? `First follow-up is planned for ${due.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, 6 business days after you applied. ${how}`
    : `A follow-up is due now and will be drafted on the next run (every 15 minutes). ${how}`;
}
