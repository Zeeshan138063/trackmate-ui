-- Create interview_feedback table for tracking interview experiences
CREATE TABLE public.interview_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  interview_date DATE NOT NULL,
  interview_time TIME,
  interview_type TEXT NOT NULL, -- 'phone', 'video', 'in-person', 'technical', 'behavioral'
  interview_round TEXT NOT NULL, -- '1st round', '2nd round', 'final', etc.
  interview_format TEXT NOT NULL, -- '1-on-1', 'panel', 'group'
  duration_minutes INTEGER,
  location_platform TEXT, -- 'Zoom', 'Teams', 'Office address', etc.
  interviewers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, title, email}
  questions_answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {question, answer, notes}
  technical_assessment BOOLEAN DEFAULT false,
  salary_discussed BOOLEAN DEFAULT false,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  feedback_notes TEXT,
  outcome TEXT, -- 'pending', 'next_round', 'rejected', 'offer_received'
  next_steps TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own interview feedback" 
ON public.interview_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview feedback" 
ON public.interview_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview feedback" 
ON public.interview_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview feedback" 
ON public.interview_feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON public.interview_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();