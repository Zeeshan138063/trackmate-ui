import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Priority {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  important: boolean;
}

export function usePriorities() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPriorities();
    }
  }, [user]);

  const fetchPriorities = async () => {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching priorities:', error);
        toast.error('Failed to load priorities');
        return;
      }

      setPriorities(data || []);
    } catch (error) {
      console.error('Error fetching priorities:', error);
      toast.error('Failed to load priorities');
    } finally {
      setLoading(false);
    }
  };

  const addPriority = async (priorityData: Omit<Priority, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('priorities')
        .insert([
          {
            user_id: user.id,
            title: priorityData.title,
            description: priorityData.description,
            completed: priorityData.completed,
            important: priorityData.important,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding priority:', error);
        toast.error('Failed to add priority');
        return;
      }

      setPriorities(prev => [data, ...prev]);
      toast.success('Priority added successfully!');
    } catch (error) {
      console.error('Error adding priority:', error);
      toast.error('Failed to add priority');
    }
  };

  const updatePriority = async (id: string, updates: Partial<Omit<Priority, 'id'>>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('priorities')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating priority:', error);
        toast.error('Failed to update priority');
        return;
      }

      setPriorities(prev => prev.map(priority => 
        priority.id === id ? { ...priority, ...updates } : priority
      ));
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const deletePriority = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('priorities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting priority:', error);
        toast.error('Failed to delete priority');
        return;
      }

      setPriorities(prev => prev.filter(priority => priority.id !== id));
      toast.success('Priority deleted successfully!');
    } catch (error) {
      console.error('Error deleting priority:', error);
      toast.error('Failed to delete priority');
    }
  };

  return {
    priorities,
    loading,
    addPriority,
    updatePriority,
    deletePriority,
    refetch: fetchPriorities,
  };
}