-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  department TEXT,
  
  -- Professional Info
  contact_type TEXT NOT NULL CHECK (contact_type IN ('recruiter', 'hiring_manager', 'employee', 'referral', 'networking', 'other')),
  seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'director', 'vp', 'c_level')),
  
  -- Social/Professional Links
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  personal_website TEXT,
  
  -- Relationship Context
  how_we_met TEXT CHECK (how_we_met IN ('job_application', 'networking_event', 'referral', 'linkedin', 'conference', 'other')),
  relationship_strength TEXT NOT NULL DEFAULT 'cold' CHECK (relationship_strength IN ('cold', 'warm', 'strong', 'advocate')),
  
  -- Communication Tracking
  last_contact_date DATE,
  next_follow_up_date DATE,
  communication_frequency TEXT CHECK (communication_frequency IN ('weekly', 'monthly', 'quarterly', 'as_needed')),
  
  -- Notes & Tags
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_interactions table
CREATE TABLE public.contact_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email', 'phone', 'linkedin_message', 'coffee_chat', 'interview', 'networking_event', 'referral_request', 'other')),
  interaction_date DATE NOT NULL,
  subject TEXT,
  notes TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_response')),
  
  -- Link to jobs/interviews if relevant
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  interview_feedback_id UUID REFERENCES public.interview_feedback(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_job_links table (many-to-many relationship)
CREATE TABLE public.contact_job_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('recruiter', 'hiring_manager', 'referral', 'team_member', 'interviewer')),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique contact-job-relationship combinations
  UNIQUE(contact_id, job_id, relationship_type)
);

-- Create follow_up_reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow_up', 'birthday', 'job_update', 'check_in', 'thank_you')),
  message_template TEXT,
  completed BOOLEAN DEFAULT false,
  snoozed_until DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_job_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for contact_interactions
CREATE POLICY "Users can view their own contact interactions" 
ON public.contact_interactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact interactions" 
ON public.contact_interactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact interactions" 
ON public.contact_interactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact interactions" 
ON public.contact_interactions FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for contact_job_links
CREATE POLICY "Users can view their own contact job links" 
ON public.contact_job_links FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_job_links.contact_id AND contacts.user_id = auth.uid()));

CREATE POLICY "Users can insert their own contact job links" 
ON public.contact_job_links FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_job_links.contact_id AND contacts.user_id = auth.uid()));

CREATE POLICY "Users can update their own contact job links" 
ON public.contact_job_links FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_job_links.contact_id AND contacts.user_id = auth.uid()));

CREATE POLICY "Users can delete their own contact job links" 
ON public.contact_job_links FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_job_links.contact_id AND contacts.user_id = auth.uid()));

-- Create RLS policies for follow_up_reminders
CREATE POLICY "Users can view their own follow up reminders" 
ON public.follow_up_reminders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow up reminders" 
ON public.follow_up_reminders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow up reminders" 
ON public.follow_up_reminders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow up reminders" 
ON public.follow_up_reminders FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_company ON public.contacts(company);
CREATE INDEX idx_contacts_contact_type ON public.contacts(contact_type);
CREATE INDEX idx_contacts_relationship_strength ON public.contacts(relationship_strength);
CREATE INDEX idx_contacts_next_follow_up ON public.contacts(next_follow_up_date);

CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_user_id ON public.contact_interactions(user_id);
CREATE INDEX idx_contact_interactions_date ON public.contact_interactions(interaction_date);

CREATE INDEX idx_contact_job_links_contact_id ON public.contact_job_links(contact_id);
CREATE INDEX idx_contact_job_links_job_id ON public.contact_job_links(job_id);

CREATE INDEX idx_follow_up_reminders_user_id ON public.follow_up_reminders(user_id);
CREATE INDEX idx_follow_up_reminders_date ON public.follow_up_reminders(reminder_date);
CREATE INDEX idx_follow_up_reminders_completed ON public.follow_up_reminders(completed);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
