import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, JobContact } from '@/types/contact';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setContacts(data || []);
        } catch (error: any) {
            console.error('Error fetching contacts:', error);
            toast({
                variant: "destructive",
                title: "Error fetching contacts",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    const addContact = async (contact: Omit<Contact, 'id' | 'user_id' | 'created_at'>) => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .insert([{ ...contact, user_id: user?.id } as any])
                .select()
                .single();

            if (error) throw error;
            setContacts(prev => [...prev, data]);
            toast({
                title: "Contact added",
                description: `${data.name} has been added to your contacts.`,
            });
            return data;
        } catch (error: any) {
            console.error('Error adding contact:', error);
            toast({
                variant: "destructive",
                title: "Error adding contact",
                description: error.message,
            });
            return null;
        }
    };

    const updateContact = async (id: string, updates: Partial<Contact>) => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setContacts(prev => prev.map(c => c.id === id ? data : c));
            toast({
                title: "Contact updated",
                description: "Contact details have been saved.",
            });
            return data;
        } catch (error: any) {
            console.error('Error updating contact:', error);
            toast({
                variant: "destructive",
                title: "Error updating contact",
                description: error.message,
            });
            return null;
        }
    };

    const deleteContact = async (id: string) => {
        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setContacts(prev => prev.filter(c => c.id !== id));
            toast({
                title: "Contact deleted",
                description: "The contact has been removed.",
            });
            return true;
        } catch (error: any) {
            console.error('Error deleting contact:', error);
            toast({
                variant: "destructive",
                title: "Error deleting contact",
                description: error.message,
            });
            return false;
        }
    };

    // Job specific operations
    const fetchJobContacts = async (jobId: string): Promise<JobContact[]> => {
        try {
            const { data, error } = await (supabase
                .from('job_contacts' as any)
                .select('*, contact:contacts(*)')
                .eq('job_id', jobId) as any);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error fetching job contacts:', error);
            return [];
        }
    };

    const linkContactToJob = async (jobId: string, contactId: string, interactionType?: string) => {
        try {
            const { data, error } = await (supabase
                .from('job_contacts' as any)
                .insert({ job_id: jobId, contact_id: contactId, interaction_type: interactionType })
                .select('*, contact:contacts(*)')
                .single() as any);

            if (error) throw error;
            return data;
        } catch (error: any) {
            // Ignore duplicate key error silently if necessary, or let user know
            if (error.code === '23505') { // unique violation
                toast({
                    title: "Already linked",
                    description: "This contact is already linked to this job.",
                });
                return null;
            }
            console.error('Error linking contact:', error);
            toast({
                variant: "destructive",
                title: "Error linking contact",
                description: error.message,
            });
            return null;
        }
    };

    const removeContactFromJob = async (jobId: string, contactId: string) => {
        try {
            const { error } = await supabase
                .from('job_contacts' as any)
                .delete()
                .match({ job_id: jobId, contact_id: contactId });

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Error removing job contact", error);
            toast({
                variant: "destructive",
                title: "Error removing contact from job",
                description: error.message
            });
            return false;
        }
    }

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    return {
        contacts,
        loading,
        addContact,
        updateContact,
        deleteContact,
        fetchJobContacts,
        linkContactToJob,
        removeContactFromJob,
        refreshContacts: fetchContacts
    };
}
