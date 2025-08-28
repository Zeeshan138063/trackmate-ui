-- Dream Companies Tracker System Migration
-- This creates a comprehensive system for tracking target companies

-- Main dream companies table
CREATE TABLE IF NOT EXISTS dream_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Company Info
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(20) CHECK (company_size IN ('startup', 'mid', 'large', 'enterprise')),
    location VARCHAR(255),
    founded_year INTEGER,
    employee_count INTEGER,
    
    -- Remote Work Metrics
    remote_policy VARCHAR(20) CHECK (remote_policy IN ('fully-remote', 'hybrid', 'remote-first', 'office-required')) DEFAULT 'hybrid',
    flexibility_score INTEGER CHECK (flexibility_score >= 1 AND flexibility_score <= 10) DEFAULT 5,
    timezone_flexibility TEXT[], -- Array of supported timezones
    
    -- Python-Specific Information
    python_usage VARCHAR(20) CHECK (python_usage IN ('primary', 'secondary', 'occasional')) DEFAULT 'secondary',
    tech_stack TEXT[], -- Array of technologies
    python_frameworks TEXT[], -- Array of Python frameworks
    
    -- Compensation & Benefits
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_level VARCHAR(20) CHECK (salary_level IN ('junior', 'mid', 'senior', 'staff', 'principal')),
    
    -- Benefits (stored as JSONB for flexibility)
    benefits JSONB DEFAULT '{
        "healthInsurance": false,
        "dentalVision": false,
        "retirement401k": false,
        "stockOptions": false,
        "unlimitedPTO": false,
        "learningBudget": 0,
        "homeOfficeStipend": 0,
        "relocationAssistance": false,
        "visaSponsorship": false
    }'::jsonb,
    
    -- Culture & Growth Scores (1-10)
    work_life_balance INTEGER CHECK (work_life_balance >= 1 AND work_life_balance <= 10) DEFAULT 5,
    learning_opportunities INTEGER CHECK (learning_opportunities >= 1 AND learning_opportunities <= 10) DEFAULT 5,
    career_growth INTEGER CHECK (career_growth >= 1 AND career_growth <= 10) DEFAULT 5,
    diversity_score INTEGER CHECK (diversity_score >= 1 AND diversity_score <= 10) DEFAULT 5,
    
    -- Application Intelligence
    hiring_difficulty VARCHAR(20) CHECK (hiring_difficulty IN ('easy', 'moderate', 'hard', 'extremely-hard')) DEFAULT 'moderate',
    average_interview_process TEXT,
    response_rate INTEGER CHECK (response_rate >= 0 AND response_rate <= 100),
    
    -- Tracking & Status
    status VARCHAR(20) CHECK (status IN ('researching', 'targeting', 'applied', 'interviewing', 'rejected', 'offer', 'hired')) DEFAULT 'researching',
    priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    notes TEXT,
    
    -- Research Data
    glassdoor_rating DECIMAL(3,1),
    glassdoor_reviews_count INTEGER,
    recent_funding_amount BIGINT,
    recent_funding_date DATE,
    is_actively_hiring BOOLEAN DEFAULT false,
    
    -- Tracking Dates
    date_added DATE DEFAULT CURRENT_DATE,
    target_application_date DATE,
    last_researched DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Company contacts/employees table
-- NOTE: This table is deprecated - use the unified 'contacts' table with dream_company_id instead
-- This will be removed in migration 20250128000008
CREATE TABLE IF NOT EXISTS company_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES dream_companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    department VARCHAR(100),
    email VARCHAR(255),
    linkedin_url TEXT,
    
    -- Relationship tracking
    connection_type VARCHAR(20) CHECK (connection_type IN ('direct', 'second-degree', 'cold', 'referral')) DEFAULT 'cold',
    relationship_notes TEXT,
    last_contact_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Company job openings tracking
CREATE TABLE IF NOT EXISTS company_job_openings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES dream_companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    job_url TEXT,
    description TEXT,
    requirements TEXT[],
    python_requirements TEXT[],
    
    -- Job details
    employment_type VARCHAR(20) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
    experience_level VARCHAR(20) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'staff', 'principal')),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Tracking
    date_posted DATE,
    date_discovered DATE DEFAULT CURRENT_DATE,
    application_deadline DATE,
    is_applied BOOLEAN DEFAULT false,
    application_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Company research notes and intelligence
CREATE TABLE IF NOT EXISTS company_research (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES dream_companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    research_type VARCHAR(50) CHECK (research_type IN ('culture', 'tech-stack', 'compensation', 'interview-process', 'news', 'funding', 'hiring-trends', 'employee-reviews', 'other')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    source_type VARCHAR(50), -- glassdoor, linkedin, crunchbase, etc.
    
    -- Metadata
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5) DEFAULT 3,
    is_verified BOOLEAN DEFAULT false,
    research_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Application timeline and activities
CREATE TABLE IF NOT EXISTS company_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES dream_companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    activity_type VARCHAR(50) CHECK (activity_type IN ('research', 'networking', 'application', 'interview', 'follow-up', 'rejection', 'offer', 'note')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Activity metadata
    activity_date DATE DEFAULT CURRENT_DATE,
    is_completed BOOLEAN DEFAULT false,
    scheduled_date DATE,
    reminder_date DATE,
    
    -- Related data
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    job_opening_id UUID REFERENCES company_job_openings(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Company comparison lists
CREATE TABLE IF NOT EXISTS company_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_ids UUID[] NOT NULL,
    comparison_criteria JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dream_companies_user_id ON dream_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_companies_status ON dream_companies(status);
CREATE INDEX IF NOT EXISTS idx_dream_companies_priority ON dream_companies(priority);
CREATE INDEX IF NOT EXISTS idx_dream_companies_python_usage ON dream_companies(python_usage);
CREATE INDEX IF NOT EXISTS idx_dream_companies_remote_policy ON dream_companies(remote_policy);
CREATE INDEX IF NOT EXISTS idx_dream_companies_salary_range ON dream_companies(salary_min, salary_max);

CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_user_id ON company_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_company_job_openings_company_id ON company_job_openings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_job_openings_user_id ON company_job_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_company_job_openings_is_applied ON company_job_openings(is_applied);

CREATE INDEX IF NOT EXISTS idx_company_research_company_id ON company_research(company_id);
CREATE INDEX IF NOT EXISTS idx_company_research_type ON company_research(research_type);

CREATE INDEX IF NOT EXISTS idx_company_activities_company_id ON company_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_company_activities_type ON company_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_company_activities_date ON company_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_company_comparisons_user_id ON company_comparisons(user_id);

-- Row Level Security (RLS) Policies

-- Dream Companies policies
ALTER TABLE dream_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own dream companies" ON dream_companies;
CREATE POLICY "Users can view their own dream companies"
    ON dream_companies FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own dream companies" ON dream_companies;
CREATE POLICY "Users can insert their own dream companies"
    ON dream_companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own dream companies" ON dream_companies;
CREATE POLICY "Users can update their own dream companies"
    ON dream_companies FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own dream companies" ON dream_companies;
CREATE POLICY "Users can delete their own dream companies"
    ON dream_companies FOR DELETE
    USING (auth.uid() = user_id);

-- Company contacts policies
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company contacts" ON company_contacts;
CREATE POLICY "Users can view their own company contacts"
    ON company_contacts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company contacts" ON company_contacts;
CREATE POLICY "Users can insert their own company contacts"
    ON company_contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company contacts" ON company_contacts;
CREATE POLICY "Users can update their own company contacts"
    ON company_contacts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company contacts" ON company_contacts;
CREATE POLICY "Users can delete their own company contacts"
    ON company_contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Company job openings policies
ALTER TABLE company_job_openings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company job openings" ON company_job_openings;
CREATE POLICY "Users can view their own company job openings"
    ON company_job_openings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company job openings" ON company_job_openings;
CREATE POLICY "Users can insert their own company job openings"
    ON company_job_openings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company job openings" ON company_job_openings;
CREATE POLICY "Users can update their own company job openings"
    ON company_job_openings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company job openings" ON company_job_openings;
CREATE POLICY "Users can delete their own company job openings"
    ON company_job_openings FOR DELETE
    USING (auth.uid() = user_id);

-- Company research policies
ALTER TABLE company_research ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company research" ON company_research;
CREATE POLICY "Users can view their own company research"
    ON company_research FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company research" ON company_research;
CREATE POLICY "Users can insert their own company research"
    ON company_research FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company research" ON company_research;
CREATE POLICY "Users can update their own company research"
    ON company_research FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company research" ON company_research;
CREATE POLICY "Users can delete their own company research"
    ON company_research FOR DELETE
    USING (auth.uid() = user_id);

-- Company activities policies
ALTER TABLE company_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company activities" ON company_activities;
CREATE POLICY "Users can view their own company activities"
    ON company_activities FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company activities" ON company_activities;
CREATE POLICY "Users can insert their own company activities"
    ON company_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company activities" ON company_activities;
CREATE POLICY "Users can update their own company activities"
    ON company_activities FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company activities" ON company_activities;
CREATE POLICY "Users can delete their own company activities"
    ON company_activities FOR DELETE
    USING (auth.uid() = user_id);

-- Company comparisons policies
ALTER TABLE company_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company comparisons" ON company_comparisons;
CREATE POLICY "Users can view their own company comparisons"
    ON company_comparisons FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company comparisons" ON company_comparisons;
CREATE POLICY "Users can insert their own company comparisons"
    ON company_comparisons FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company comparisons" ON company_comparisons;
CREATE POLICY "Users can update their own company comparisons"
    ON company_comparisons FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company comparisons" ON company_comparisons;
CREATE POLICY "Users can delete their own company comparisons"
    ON company_comparisons FOR DELETE
    USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables
DROP TRIGGER IF EXISTS update_dream_companies_updated_at ON dream_companies;
CREATE TRIGGER update_dream_companies_updated_at
    BEFORE UPDATE ON dream_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON company_contacts;
CREATE TRIGGER update_company_contacts_updated_at
    BEFORE UPDATE ON company_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_job_openings_updated_at ON company_job_openings;
CREATE TRIGGER update_company_job_openings_updated_at
    BEFORE UPDATE ON company_job_openings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_research_updated_at ON company_research;
CREATE TRIGGER update_company_research_updated_at
    BEFORE UPDATE ON company_research
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_activities_updated_at ON company_activities;
CREATE TRIGGER update_company_activities_updated_at
    BEFORE UPDATE ON company_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_comparisons_updated_at ON company_comparisons;
CREATE TRIGGER update_company_comparisons_updated_at
    BEFORE UPDATE ON company_comparisons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
