export interface Interviewer {
  name: string;
  title: string;
  email?: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  notes?: string;
}

export interface InterviewFeedback {
  id: string;
  user_id: string;
  job_id?: string;
  company: string;
  position: string;
  interview_date: string;
  interview_time?: string;
  interview_type: string;
  interview_round: string;
  interview_format: string;
  duration_minutes?: number;
  location_platform?: string;
  interviewers: Interviewer[];
  questions_answers: QuestionAnswer[];
  technical_assessment: boolean;
  salary_discussed: boolean;
  overall_rating?: number;
  feedback_notes?: string;
  outcome?: string;
  next_steps?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  jobs?: {
    id: string;
    position: string;
    company: string;
    status: string;
  };
}

// Database type for inserting
export interface InterviewFeedbackInsert {
  user_id: string;
  job_id?: string;
  company: string;
  position: string;
  interview_date: string;
  interview_time?: string;
  interview_type: string;
  interview_round: string;
  interview_format: string;
  duration_minutes?: number;
  location_platform?: string;
  interviewers: any; // JSONB
  questions_answers: any; // JSONB
  technical_assessment: boolean;
  salary_discussed: boolean;
  overall_rating?: number;
  feedback_notes?: string;
  outcome?: string;
  next_steps?: string;
  follow_up_date?: string;
}