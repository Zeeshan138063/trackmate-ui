import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ApplicationGoal {
  id: string;
  weeklyGoal: number;
}

export function useApplicationGoals() {
  const [goal, setGoal] = useState<ApplicationGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoal = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('application_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching application goal:', error);
        toast.error('Failed to fetch application goal');
        return;
      }

      if (data) {
        setGoal({
          id: data.id,
          weeklyGoal: data.weekly_goal,
        });
      } else {
        // Create default goal if none exists
        await createGoal(1);
      }
    } catch (error) {
      console.error('Error fetching application goal:', error);
      toast.error('Failed to fetch application goal');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (weeklyGoal: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('application_goals')
        .insert([
          {
            user_id: user.id,
            weekly_goal: weeklyGoal,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating application goal:', error);
        toast.error('Failed to create application goal');
        return;
      }

      const newGoal: ApplicationGoal = {
        id: data.id,
        weeklyGoal: data.weekly_goal,
      };

      setGoal(newGoal);
      toast.success('Application goal created successfully!');
    } catch (error) {
      console.error('Error creating application goal:', error);
      toast.error('Failed to create application goal');
    }
  };

  const updateGoal = async (weeklyGoal: number) => {
    if (!user || !goal) return;

    try {
      const { data, error } = await supabase
        .from('application_goals')
        .update({ weekly_goal: weeklyGoal })
        .eq('id', goal.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating application goal:', error);
        toast.error('Failed to update application goal');
        return;
      }

      setGoal({
        id: data.id,
        weeklyGoal: data.weekly_goal,
      });

      toast.success('Application goal updated successfully!');
    } catch (error) {
      console.error('Error updating application goal:', error);
      toast.error('Failed to update application goal');
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [user]);

  return {
    goal,
    loading,
    updateGoal,
    createGoal,
  };
}
