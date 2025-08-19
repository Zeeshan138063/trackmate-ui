export interface Job {
  id: string;
  position: string;
  company: string;
  maxSalary?: number;
  location?: string;
  status: "Bookmarked" | "Applying" | "Applied" | "Interviewing" | "Negotiating" | "Accepted" | "Rejected";
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