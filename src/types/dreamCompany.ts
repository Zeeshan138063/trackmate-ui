import { Contact } from './contact';

export type CompanySize = 'startup' | 'mid' | 'large' | 'enterprise';

export type RemotePolicy = 'fully-remote' | 'hybrid' | 'remote-first' | 'office-required';

export type PythonUsage = 'primary' | 'secondary' | 'occasional';

export type SalaryLevel = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

export type CompanyStatus = 'researching' | 'targeting' | 'applied' | 'interviewing' | 'rejected' | 'offer' | 'hired';

export type Priority = 'high' | 'medium' | 'low';

export type HiringDifficulty = 'easy' | 'moderate' | 'hard' | 'extremely-hard';



export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

export type ResearchType = 'culture' | 'tech-stack' | 'compensation' | 'interview-process' | 'news' | 'funding' | 'hiring-trends' | 'employee-reviews' | 'other';

export type ActivityType = 'research' | 'networking' | 'application' | 'interview' | 'follow-up' | 'rejection' | 'offer' | 'note';

export interface CompanyBenefits {
  healthInsurance: boolean;
  dentalVision: boolean;
  retirement401k: boolean;
  stockOptions: boolean;
  unlimitedPTO: boolean;
  learningBudget: number;
  homeOfficeStipend: number;
  relocationAssistance: boolean;
  visaSponsorship: boolean;
}

export interface DreamCompany {
  id: string;
  user_id: string;
  
  // Basic Company Info
  name: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
  founded_year?: number;
  employee_count?: number;
  
  // Remote Work Metrics
  remote_policy: RemotePolicy;
  flexibility_score: number; // 1-10
  timezone_flexibility?: string[];
  
  // Python-Specific Information
  python_usage: PythonUsage;
  tech_stack?: string[];
  python_frameworks?: string[];
  
  // Compensation & Benefits
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  salary_level?: SalaryLevel;
  benefits: CompanyBenefits;
  
  // Culture & Growth Scores (1-10)
  work_life_balance: number;
  learning_opportunities: number;
  career_growth: number;
  diversity_score: number;
  
  // Application Intelligence
  hiring_difficulty: HiringDifficulty;
  average_interview_process?: string;
  response_rate?: number;
  
  // Tracking & Status
  status: CompanyStatus;
  priority: Priority;
  notes?: string;
  
  // Research Data
  glassdoor_rating?: number;
  glassdoor_reviews_count?: number;
  recent_funding_amount?: number;
  recent_funding_date?: string;
  is_actively_hiring: boolean;
  
  // Tracking Dates
  date_added: string;
  target_application_date?: string;
  last_researched?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}



export interface CompanyJobOpening {
  id: string;
  company_id: string;
  user_id: string;
  
  title: string;
  job_url?: string;
  description?: string;
  requirements?: string[];
  python_requirements?: string[];
  
  // Job details
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  
  // Tracking
  date_posted?: string;
  date_discovered: string;
  application_deadline?: string;
  is_applied: boolean;
  application_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CompanyResearch {
  id: string;
  company_id: string;
  user_id: string;
  
  research_type: ResearchType;
  title: string;
  content: string;
  source_url?: string;
  source_type?: string;
  
  // Metadata
  confidence_level: number; // 1-5
  is_verified: boolean;
  research_date: string;
  
  created_at: string;
  updated_at: string;
}

export interface CompanyActivity {
  id: string;
  company_id: string;
  user_id: string;
  
  activity_type: ActivityType;
  title: string;
  description?: string;
  
  // Activity metadata
  activity_date: string;
  is_completed: boolean;
  scheduled_date?: string;
  reminder_date?: string;
  
  // Related data
  contact_id?: string;
  job_opening_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CompanyComparison {
  id: string;
  user_id: string;
  
  name: string;
  description?: string;
  company_ids: string[];
  comparison_criteria: any[];
  
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface DreamCompanyWithDetails extends DreamCompany {
  contacts?: Contact[];
  job_openings?: CompanyJobOpening[];
  research?: CompanyResearch[];
  activities?: CompanyActivity[];
  open_positions_count?: number;
  recent_activity_count?: number;
}

// Form types for creating/editing
export interface CreateDreamCompanyData {
  name: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
  founded_year?: number;
  employee_count?: number;
  remote_policy?: RemotePolicy;
  flexibility_score?: number;
  timezone_flexibility?: string[];
  python_usage?: PythonUsage;
  tech_stack?: string[];
  python_frameworks?: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_level?: SalaryLevel;
  benefits?: Partial<CompanyBenefits>;
  work_life_balance?: number;
  learning_opportunities?: number;
  career_growth?: number;
  diversity_score?: number;
  hiring_difficulty?: HiringDifficulty;
  average_interview_process?: string;
  response_rate?: number;
  status?: CompanyStatus;
  priority?: Priority;
  notes?: string;
  glassdoor_rating?: number;
  glassdoor_reviews_count?: number;
  recent_funding_amount?: number;
  recent_funding_date?: string;
  is_actively_hiring?: boolean;
  target_application_date?: string;
}

export interface UpdateDreamCompanyData extends Partial<CreateDreamCompanyData> {
  id: string;
}

// Filter and search types
export interface CompanyFilters {
  status?: CompanyStatus[];
  priority?: Priority[];
  remote_policy?: RemotePolicy[];
  python_usage?: PythonUsage[];
  company_size?: CompanySize[];
  hiring_difficulty?: HiringDifficulty[];
  salary_min?: number;
  salary_max?: number;
  is_actively_hiring?: boolean;
  has_open_positions?: boolean;
  search_query?: string;
}

export interface CompanySortOption {
  field: 'name' | 'priority' | 'salary_max' | 'flexibility_score' | 'work_life_balance' | 'glassdoor_rating' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

// Analytics types
export interface CompanyAnalytics {
  total_companies: number;
  by_status: Record<CompanyStatus, number>;
  by_priority: Record<Priority, number>;
  by_remote_policy: Record<RemotePolicy, number>;
  by_python_usage: Record<PythonUsage, number>;
  average_salary_range: {
    min: number;
    max: number;
    currency: string;
  };
  top_tech_stacks: Array<{
    technology: string;
    count: number;
  }>;
  response_rate_stats: {
    average: number;
    median: number;
    companies_with_data: number;
  };
}

// Scoring and ranking types
export interface CompanyScore {
  company_id: string;
  overall_score: number;
  category_scores: {
    compensation: number;
    culture: number;
    remote_friendliness: number;
    python_opportunities: number;
    career_growth: number;
    application_feasibility: number;
  };
  ranking: number;
}

// Export types for data management
export interface CompanyExportData {
  companies: DreamCompany[];
  contacts: Contact[];
  job_openings: CompanyJobOpening[];
  research: CompanyResearch[];
  activities: CompanyActivity[];
  comparisons: CompanyComparison[];
  export_date: string;
  user_id: string;
}
