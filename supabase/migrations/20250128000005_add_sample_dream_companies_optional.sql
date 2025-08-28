-- Optional Sample Dream Companies Data
-- This is an alternative to the main sample data migration
-- Use this if you want to manually add sample data later or skip it entirely

-- To use this migration instead of the automatic one:
-- 1. Delete or rename the main sample data migration file
-- 2. Rename this file to remove the "_optional" suffix
-- 3. Run the migration

-- This migration provides a function to add sample data when you're ready
CREATE OR REPLACE FUNCTION add_sample_dream_companies(target_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_to_use UUID;
  companies_added INTEGER := 0;
BEGIN
  -- Use provided user_id or get the current authenticated user
  IF target_user_id IS NOT NULL THEN
    user_id_to_use := target_user_id;
  ELSE
    user_id_to_use := auth.uid();
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_use) THEN
    RAISE EXCEPTION 'User with ID % does not exist', user_id_to_use;
  END IF;
  
  -- Check if user already has companies
  IF EXISTS (SELECT 1 FROM dream_companies WHERE user_id = user_id_to_use) THEN
    RAISE NOTICE 'User already has dream companies. Skipping sample data insertion.';
    RETURN 0;
  END IF;
  
  -- Insert sample companies
  INSERT INTO dream_companies (
    user_id, name, logo_url, website_url, industry, company_size, location, founded_year, employee_count,
    remote_policy, flexibility_score, timezone_flexibility, python_usage, tech_stack, python_frameworks,
    salary_min, salary_max, salary_currency, salary_level, benefits, work_life_balance, learning_opportunities,
    career_growth, diversity_score, hiring_difficulty, average_interview_process, response_rate, status,
    priority, notes, glassdoor_rating, glassdoor_reviews_count, recent_funding_amount, recent_funding_date,
    is_actively_hiring, target_application_date
  ) VALUES 
  -- GitLab
  (user_id_to_use, 'GitLab', 'https://about.gitlab.com/images/press/logo/png/gitlab-logo-gray-rgb.png',
   'https://gitlab.com', 'DevOps/Software Development', 'large', 'Remote-first (San Francisco HQ)', 2011, 1300,
   'fully-remote', 9, ARRAY['PST', 'EST', 'GMT', 'CET', 'JST'], 'primary',
   ARRAY['Ruby', 'Python', 'Go', 'JavaScript', 'Vue.js', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'Git'],
   ARRAY['Django', 'Flask'], 120000, 180000, 'USD', 'senior',
   '{"healthInsurance": true, "dentalVision": true, "retirement401k": true, "stockOptions": true, "unlimitedPTO": true, "learningBudget": 2000, "homeOfficeStipend": 1500, "relocationAssistance": false, "visaSponsorship": true}'::jsonb,
   9, 9, 8, 9, 'moderate', 'Application → Technical Screen → System Design → Final Interview → Reference Check',
   75, 'targeting', 'high', 'All-remote company with transparent culture. Strong Python usage for infrastructure and automation.',
   4.4, 2100, null, null, true, '2024-02-15'),
   
  -- Stripe
  (user_id_to_use, 'Stripe', 'https://stripe.com/img/v3/home/social.png', 'https://stripe.com',
   'Fintech/Payments', 'large', 'San Francisco, CA (Remote-friendly)', 2010, 4000, 'hybrid', 7,
   ARRAY['PST', 'EST'], 'primary', ARRAY['Python', 'Ruby', 'JavaScript', 'Go', 'Java', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes'],
   ARRAY['Django', 'Flask', 'FastAPI'], 140000, 220000, 'USD', 'senior',
   '{"healthInsurance": true, "dentalVision": true, "retirement401k": true, "stockOptions": true, "unlimitedPTO": true, "learningBudget": 3000, "homeOfficeStipend": 1000, "relocationAssistance": true, "visaSponsorship": true}'::jsonb,
   8, 9, 9, 8, 'hard', 'Application → Phone Screen → Technical Interview → System Design → Onsite (Virtual) → Team Match',
   65, 'researching', 'high', 'Leading fintech company with heavy Python usage. Excellent compensation and growth opportunities.',
   4.1, 1800, 600000000, '2023-03-15', true, '2024-03-01'),
   
  -- Add more companies as needed...
  (user_id_to_use, 'Zapier', 'https://cdn.zapier.com/storage/photos/9ec65c79de8ae54080c98946c27e2119.png',
   'https://zapier.com', 'Automation/SaaS', 'mid', 'Remote-first (San Francisco HQ)', 2011, 400,
   'fully-remote', 9, ARRAY['PST', 'EST', 'GMT'], 'primary',
   ARRAY['Python', 'JavaScript', 'Django', 'React', 'PostgreSQL', 'Redis', 'Celery', 'Docker'],
   ARRAY['Django', 'Celery', 'Django REST Framework'], 110000, 170000, 'USD', 'senior',
   '{"healthInsurance": true, "dentalVision": true, "retirement401k": true, "stockOptions": true, "unlimitedPTO": true, "learningBudget": 2500, "homeOfficeStipend": 1500, "relocationAssistance": false, "visaSponsorship": false}'::jsonb,
   9, 8, 8, 7, 'moderate', 'Application → Phone Screen → Technical Interview → System Design → Cultural Fit',
   72, 'researching', 'high', 'Automation platform built primarily on Python/Django. Remote-first culture.',
   4.3, 450, null, null, true, '2024-03-15');
   
  GET DIAGNOSTICS companies_added = ROW_COUNT;
  
  RAISE NOTICE 'Successfully added % sample dream companies for user %', companies_added, user_id_to_use;
  RETURN companies_added;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_sample_dream_companies(UUID) TO authenticated;

-- Add a comment explaining how to use this function
COMMENT ON FUNCTION add_sample_dream_companies(UUID) IS 
'Adds sample dream companies data for a specific user. Call with add_sample_dream_companies() to add for current user, or add_sample_dream_companies(user_id) for a specific user.';

-- Example usage (commented out):
-- SELECT add_sample_dream_companies(); -- Adds sample data for current authenticated user
-- SELECT add_sample_dream_companies('user-uuid-here'); -- Adds sample data for specific user
