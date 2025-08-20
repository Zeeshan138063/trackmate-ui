-- Create career_goals table
CREATE TABLE public.career_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_title TEXT NOT NULL,
  target_date TEXT NOT NULL,
  salary_min INTEGER NOT NULL DEFAULT 0,
  salary_max INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for career_goals
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for career_goals
CREATE POLICY "Users can view their own career goals"
ON public.career_goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career goals"
ON public.career_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career goals"
ON public.career_goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career goals"
ON public.career_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Create priorities table
CREATE TABLE public.priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  important BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for priorities
ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for priorities
CREATE POLICY "Users can view their own priorities"
ON public.priorities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own priorities"
ON public.priorities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own priorities"
ON public.priorities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own priorities"
ON public.priorities
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_career_goals_updated_at
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priorities_updated_at
  BEFORE UPDATE ON public.priorities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();