export interface Contact {
  id: string;
  user_id: string;
  
  // Basic Info
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  department?: string;
  
  // Professional Info
  contact_type: 'recruiter' | 'hiring_manager' | 'employee' | 'referral' | 'networking' | 'other';
  seniority_level?: 'junior' | 'mid' | 'senior' | 'director' | 'vp' | 'c_level';
  
  // Social/Professional Links
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  personal_website?: string;
  
  // Relationship Context
  how_we_met?: 'job_application' | 'networking_event' | 'referral' | 'linkedin' | 'conference' | 'other';
  relationship_strength: 'cold' | 'warm' | 'strong' | 'advocate';
  
  // Communication Tracking
  last_contact_date?: string;
  next_follow_up_date?: string;
  communication_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'as_needed';
  
  // Notes & Tags
  notes?: string;
  tags: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  user_id: string;
  
  interaction_type: 'email' | 'phone' | 'linkedin_message' | 'coffee_chat' | 'interview' | 'networking_event' | 'referral_request' | 'other';
  interaction_date: string;
  subject?: string;
  notes: string;
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response';
  
  // Link to jobs/interviews if relevant
  job_id?: string;
  interview_feedback_id?: string;
  
  created_at: string;
}

export interface ContactJobLink {
  id: string;
  contact_id: string;
  job_id: string;
  relationship_type: 'recruiter' | 'hiring_manager' | 'referral' | 'team_member' | 'interviewer';
  is_primary_contact: boolean;
  created_at: string;
}

export interface FollowUpReminder {
  id: string;
  contact_id: string;
  user_id: string;
  
  reminder_date: string;
  reminder_type: 'follow_up' | 'birthday' | 'job_update' | 'check_in' | 'thank_you';
  message_template?: string;
  completed: boolean;
  snoozed_until?: string;
  
  created_at: string;
}

// Database insert types
export interface ContactInsert {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title: string;
  company: string;
  department?: string;
  contact_type: Contact['contact_type'];
  seniority_level?: Contact['seniority_level'];
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  personal_website?: string;
  how_we_met?: Contact['how_we_met'];
  relationship_strength?: Contact['relationship_strength'];
  last_contact_date?: string;
  next_follow_up_date?: string;
  communication_frequency?: Contact['communication_frequency'];
  notes?: string;
  tags?: any; // JSONB
}

export interface ContactInteractionInsert {
  contact_id: string;
  user_id: string;
  interaction_type: ContactInteraction['interaction_type'];
  interaction_date: string;
  subject?: string;
  notes: string;
  outcome?: ContactInteraction['outcome'];
  job_id?: string;
  interview_feedback_id?: string;
}

export interface FollowUpReminderInsert {
  contact_id: string;
  user_id: string;
  reminder_date: string;
  reminder_type: FollowUpReminder['reminder_type'];
  message_template?: string;
  completed?: boolean;
  snoozed_until?: string;
}

// Extended types with relationships
export interface ContactWithRelations extends Contact {
  interactions?: ContactInteraction[];
  job_links?: (ContactJobLink & { job?: any })[];
  reminders?: FollowUpReminder[];
}

// Contact statistics
export interface ContactStats {
  total_contacts: number;
  by_type: Record<Contact['contact_type'], number>;
  by_strength: Record<Contact['relationship_strength'], number>;
  recent_interactions: number;
  pending_follow_ups: number;
}

// Search and filter types
export interface ContactFilters {
  search?: string;
  contact_type?: Contact['contact_type'] | 'all';
  relationship_strength?: Contact['relationship_strength'] | 'all';
  company?: string;
  tags?: string[];
  has_pending_followup?: boolean;
  last_contact_before?: string;
  last_contact_after?: string;
}
