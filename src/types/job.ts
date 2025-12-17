export interface Job {
  id: string;
  position: string;
  jobUrl?: string;
  company: string;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  description?: string;
  status: "Bookmarked" | "Applying" | "Applied" | "Interviewing" | "Negotiating" | "Accepted" | "Rejected";
  source?: "manual" | "auto" | "linkedin_auto";
  datePosted?: string;
  dateSaved: string;
  deadline?: string;
  dateApplied?: string;
  followUp?: string;
  excitement: number; // 1-5 stars
  checklist?: JobChecklist;
  notes?: string;
  attachedResume?: string; // Legacy: JSON snapshot
  resumeS3Key?: string; // New: S3 Key
}

export type JobChecklist = Record<string, boolean>;

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface JobStats {
  bookmarked: number;
  applying: number;
  applied: number;
  interviewing: number;
  negotiating: number;
  accepted: number;
}