import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Engagement } from '@/types/engagement';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useEngagements(contactId?: string) {
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchEngagements = useCallback(async () => {
        if (!user || !contactId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('engagements' as any)
                .select('*')
                .eq('contact_id', contactId)
                .order('date', { ascending: false });

            if (error) throw error;
            setEngagements(data as Engagement[]);
        } catch (error: any) {
            console.error('Error fetching engagements:', error);
            toast({
                variant: "destructive",
                title: "Error fetching interactions",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [user, contactId, toast]);

    const addEngagement = async (engagement: Omit<Engagement, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from('engagements' as any)
                .insert([{ ...engagement, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setEngagements(prev => [data as Engagement, ...prev]);
            toast({
                title: "Interaction Logged",
                description: "Your interaction has been saved.",
            });
            return data;
        } catch (error: any) {
            console.error('Error adding engagement:', error);
            toast({
                variant: "destructive",
                title: "Error saving interaction",
                description: error.message,
            });
            return null;
        }
    };

    const deleteEngagement = async (id: string) => {
        try {
            const { error } = await supabase
                .from('engagements' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setEngagements(prev => prev.filter(e => e.id !== id));
            return true;
        } catch (error: any) {
            console.error('Error deleting engagement:', error);
            toast({
                variant: "destructive",
                title: "Error deleting interaction",
                description: error.message,
            });
            return false;
        }
    };

    return {
        engagements,
        loading,
        fetchEngagements,
        addEngagement,
        deleteEngagement
    };
}
