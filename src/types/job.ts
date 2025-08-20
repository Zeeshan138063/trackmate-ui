export interface Job {
  id: string;
  position: string;
  url?: string;
  company: string;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  description?: string;
  status: "Bookmarked" | "Applying" | "Applied" | "Interviewing" | "Negotiating" | "Accepted" | "Rejected";
  datePosted?: string;
  dateSaved: string;
  deadline?: string;
  dateApplied?: string;
  followUp?: string;
  excitement: number; // 1-5 stars
}

export interface JobStats {
  bookmarked: number;
  applying: number;
  applied: number;
  interviewing: number;
  negotiating: number;
  accepted: number;
}