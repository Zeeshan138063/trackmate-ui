import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  weeklyDigest: boolean;
  profileVisibility: 'public' | 'limited' | 'private';
  timezone: string;
  language: string;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
          return;
        }
        toast.error('Failed to fetch settings');
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          jobAlerts: data.job_alerts,
          weeklyDigest: data.weekly_digest,
          profileVisibility: data.profile_visibility as 'public' | 'limited' | 'private',
          timezone: data.timezone,
          language: data.language,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            email_notifications: true,
            push_notifications: false,
            job_alerts: true,
            weekly_digest: true,
            profile_visibility: 'private',
            timezone: 'America/Los_Angeles',
            language: 'en',
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        toast.error('Failed to create settings');
        return;
      }

      setSettings({
        id: data.id,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        jobAlerts: data.job_alerts,
        weeklyDigest: data.weekly_digest,
        profileVisibility: data.profile_visibility as 'public' | 'limited' | 'private',
        timezone: data.timezone,
        language: data.language,
      });

      toast.success('Settings initialized successfully!');
    } catch (error) {
      console.error('Error creating settings:', error);
      toast.error('Failed to create settings');
    }
  };

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'id'>>) => {
    if (!user || !settings) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          email_notifications: updates.emailNotifications,
          push_notifications: updates.pushNotifications,
          job_alerts: updates.jobAlerts,
          weekly_digest: updates.weeklyDigest,
          profile_visibility: updates.profileVisibility,
          timezone: updates.timezone,
          language: updates.language,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
        return;
      }

      setSettings({
        id: data.id,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        jobAlerts: data.job_alerts,
        weeklyDigest: data.weekly_digest,
        profileVisibility: data.profile_visibility as 'public' | 'limited' | 'private',
        timezone: data.timezone,
        language: data.language,
      });

      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refetchSettings: fetchSettings,
  };
}
