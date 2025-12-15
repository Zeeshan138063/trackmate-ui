import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FollowUp } from '@/types/engagement';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useFollowUps(contactId?: string) {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch follow-ups for a specific contact OR all pending if contactId is undefined
    const fetchFollowUps = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            let query = supabase
                .from('follow_ups' as any)
                .select('*')
                .order('due_date', { ascending: true });

            if (contactId) {
                query = query.eq('contact_id', contactId);
            } else {
                // Global view: show pending/missed only
                query = query.neq('status', 'completed');
            }

            const { data, error } = await query;

            if (error) throw error;
            setFollowUps(data as FollowUp[]);
        } catch (error: any) {
            console.error('Error fetching follow-ups:', error);
            toast({
                variant: "destructive",
                title: "Error fetching reminders",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [user, contactId, toast]);

    const addFollowUp = async (followUp: Omit<FollowUp, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from('follow_ups' as any)
                .insert([{ ...followUp, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setFollowUps(prev => {
                const newDevice = [...prev, data as FollowUp];
                return newDevice.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
            });
            toast({
                title: "Reminder Set",
                description: "We'll remind you to follow up.",
            });
            return data;
        } catch (error: any) {
            console.error('Error adding follow-up:', error);
            toast({
                variant: "destructive",
                title: "Error setting reminder",
                description: error.message,
            });
            return null;
        }
    };

    const updateStatus = async (id: string, status: 'pending' | 'completed' | 'missed') => {
        try {
            const { data, error } = await supabase
                .from('follow_ups' as any)
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setFollowUps(prev =>
                contactId
                    ? prev.map(f => f.id === id ? data as FollowUp : f) // Update in place for contact view
                    : prev.filter(f => f.id !== id) // Remove from list if completed in global view
            );

            if (status === 'completed') {
                toast({ title: "Marked as done!" });
            }
            return data;
        } catch (error: any) {
            console.error('Error updating follow-up:', error);
            return null;
        }
    };

    const deleteFollowUp = async (id: string) => {
        try {
            const { error } = await supabase
                .from('follow_ups' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setFollowUps(prev => prev.filter(f => f.id !== id));
            return true;
        } catch (error: any) {
            console.error('Error deleting follow-up:', error);
            return false;
        }
    };

    return {
        followUps,
        loading,
        fetchFollowUps,
        addFollowUp,
        updateStatus,
        deleteFollowUp
    };
}
