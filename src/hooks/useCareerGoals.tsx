import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CareerGoal {
  id: string;
  targetTitle: string;
  targetDate: string;
  salaryMin: number;
  salaryMax: number;
}

export function useCareerGoals() {
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('career_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching career goals:', error);
        toast.error('Failed to load career goals');
        return;
      }

      const formattedGoals = data.map(goal => ({
        id: goal.id,
        targetTitle: goal.target_title,
        targetDate: goal.target_date,
        salaryMin: goal.salary_min,
        salaryMax: goal.salary_max,
      }));

      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching career goals:', error);
      toast.error('Failed to load career goals');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goalData: Omit<CareerGoal, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('career_goals')
        .insert([
          {
            user_id: user.id,
            target_title: goalData.targetTitle,
            target_date: goalData.targetDate,
            salary_min: goalData.salaryMin,
            salary_max: goalData.salaryMax,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding career goal:', error);
        toast.error('Failed to add career goal');
        return;
      }

      const newGoal: CareerGoal = {
        id: data.id,
        targetTitle: data.target_title,
        targetDate: data.target_date,
        salaryMin: data.salary_min,
        salaryMax: data.salary_max,
      };

      setGoals(prev => [newGoal, ...prev]);
      toast.success('Career goal added successfully!');
    } catch (error) {
      console.error('Error adding career goal:', error);
      toast.error('Failed to add career goal');
    }
  };

  const updateGoal = async (id: string, updates: Partial<Omit<CareerGoal, 'id'>>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.targetTitle !== undefined) updateData.target_title = updates.targetTitle;
      if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;
      if (updates.salaryMin !== undefined) updateData.salary_min = updates.salaryMin;
      if (updates.salaryMax !== undefined) updateData.salary_max = updates.salaryMax;

      const { error } = await supabase
        .from('career_goals')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating career goal:', error);
        toast.error('Failed to update career goal');
        return;
      }

      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...updates } : goal
      ));
      toast.success('Career goal updated successfully!');
    } catch (error) {
      console.error('Error updating career goal:', error);
      toast.error('Failed to update career goal');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('career_goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting career goal:', error);
        toast.error('Failed to delete career goal');
        return;
      }

      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast.success('Career goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting career goal:', error);
      toast.error('Failed to delete career goal');
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}