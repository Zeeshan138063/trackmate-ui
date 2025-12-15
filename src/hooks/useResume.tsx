import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MasterProfile, initialMasterProfile } from "@/types/resume";

export function useResume() {
    const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchMasterProfile = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Try to find an existing Master Profile
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .eq('title', 'Master Profile')
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Parse the JSON content
                // We need to cast it carefully or merge with initial structure to ensure new fields are present
                const content = data.content as unknown as MasterProfile;
                setMasterProfile({ ...initialMasterProfile, ...content });
                setResumeId(data.id);
            } else {
                // Create a new Master Profile if it doesn't exist
                const { data: newResume, error: createError } = await supabase
                    .from('resumes')
                    .insert({
                        user_id: user.id,
                        title: 'Master Profile',
                        template: 'standard',
                        content: initialMasterProfile as any // Supabase expects Json type
                    })
                    .select()
                    .single();

                if (createError) throw createError;

                setMasterProfile(initialMasterProfile);
                setResumeId(newResume.id);
            }

        } catch (error: any) {
            console.error('Error fetching master profile:', error);
            toast({
                title: "Error loading profile",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    const saveMasterProfile = useCallback(async (profile: MasterProfile) => {
        if (!user || !resumeId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('resumes')
                .update({
                    content: profile as any,
                    updated_at: new Date().toISOString()
                })
                .eq('id', resumeId);

            if (error) throw error;

            setMasterProfile(profile);
            // Optional: don't toast on every auto-save, maybe returns success status
            return true;

        } catch (error: any) {
            console.error('Error saving master profile:', error);
            // toast({
            //     title: "Error saving profile",
            //     description: error.message,
            //     variant: "destructive",
            // });
            // Don't toast on auto-save error to avoid spamming, just log it
            return false;
        } finally {
            setSaving(false);
        }
    }, [user, resumeId]);

    useEffect(() => {
        if (user) {
            fetchMasterProfile();
        }
    }, [user, fetchMasterProfile]);

    return {
        masterProfile,
        loading,
        saving,
        saveMasterProfile,
        refetch: fetchMasterProfile,
        resumeId
    };
}
