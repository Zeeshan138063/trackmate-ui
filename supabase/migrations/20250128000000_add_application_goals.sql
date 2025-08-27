-- Create application_goals table for storing user application goals
CREATE TABLE public.application_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_goal INTEGER NOT NULL DEFAULT 1 CHECK (weekly_goal >= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.application_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own application goals" 
ON public.application_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own application goals" 
ON public.application_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own application goals" 
ON public.application_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own application goals" 
ON public.application_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_application_goals_updated_at
  BEFORE UPDATE ON public.application_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for user_id for better performance
CREATE INDEX idx_application_goals_user_id ON public.application_goals(user_id);
