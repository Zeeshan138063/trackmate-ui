import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import type { 
  Contact, 
  ContactInsert, 
  ContactInteraction, 
  ContactInteractionInsert,
  ContactWithRelations,
  ContactStats,
  ContactFilters
} from "@/types/contact";

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContacts = async (filters?: ContactFilters) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      // Apply filters supported by the full schema
      if (filters?.contact_type && filters.contact_type !== 'all') {
        query = query.eq('contact_type', filters.contact_type);
      }
      
      if (filters?.relationship_strength && filters.relationship_strength !== 'all') {
        query = query.eq('relationship_strength', filters.relationship_strength);
      }
      
      if (filters?.company) {
        query = query.ilike('company', `%${filters.company}%`);
      }
      
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform the data to match our TypeScript interface
      const transformedContacts: Contact[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email || undefined,
        phone: item.phone || undefined,
        title: item.title,
        company: item.company,
        department: item.department || undefined,
        contact_type: item.contact_type,
        seniority_level: item.seniority_level || undefined,
        linkedin_url: item.linkedin_url || undefined,
        twitter_url: item.twitter_url || undefined,
        github_url: item.github_url || undefined,
        personal_website: item.personal_website || undefined,
        how_we_met: item.how_we_met || undefined,
        relationship_strength: item.relationship_strength,
        last_contact_date: item.last_contact_date || undefined,
        next_follow_up_date: item.next_follow_up_date || undefined,
        communication_frequency: item.communication_frequency || undefined,
        notes: item.notes || undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setContacts(transformedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (newContact: Omit<Contact, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          first_name: newContact.first_name,
          last_name: newContact.last_name,
          email: newContact.email,
          phone: newContact.phone,
          title: newContact.title,
          company: newContact.company,
          department: newContact.department,
          dream_company_id: newContact.dream_company_id,
          contact_type: newContact.contact_type,
          seniority_level: newContact.seniority_level,
          linkedin_url: newContact.linkedin_url,
          twitter_url: newContact.twitter_url,
          github_url: newContact.github_url,
          personal_website: newContact.personal_website,
          how_we_met: newContact.how_we_met,
          relationship_strength: newContact.relationship_strength,
          last_contact_date: newContact.last_contact_date,
          next_follow_up_date: newContact.next_follow_up_date,
          communication_frequency: newContact.communication_frequency,
          notes: newContact.notes,
          tags: newContact.tags,
        })
        .select()
        .single();
      if (error) throw error;

      const transformedContact: Contact = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        email: data.email || undefined,
        phone: data.phone || undefined,
        department: data.department || undefined,
        seniority_level: data.seniority_level || undefined,
        linkedin_url: data.linkedin_url || undefined,
        twitter_url: data.twitter_url || undefined,
        github_url: data.github_url || undefined,
        personal_website: data.personal_website || undefined,
        how_we_met: data.how_we_met || undefined,
        last_contact_date: data.last_contact_date || undefined,
        next_follow_up_date: data.next_follow_up_date || undefined,
        communication_frequency: data.communication_frequency || undefined,
        notes: data.notes || undefined,
      };

      setContacts(prev => [transformedContact, ...prev]);
      
      toast({
        title: "Success",
        description: `Contact ${newContact.first_name} ${newContact.last_name} added successfully`,
      });

      return transformedContact;
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (updatedContact: Contact) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: updatedContact.first_name,
          last_name: updatedContact.last_name,
          email: updatedContact.email,
          phone: updatedContact.phone,
          title: updatedContact.title,
          company: updatedContact.company,
          department: updatedContact.department,
          contact_type: updatedContact.contact_type,
          seniority_level: updatedContact.seniority_level,
          linkedin_url: updatedContact.linkedin_url,
          twitter_url: updatedContact.twitter_url,
          github_url: updatedContact.github_url,
          personal_website: updatedContact.personal_website,
          how_we_met: updatedContact.how_we_met,
          relationship_strength: updatedContact.relationship_strength,
          last_contact_date: updatedContact.last_contact_date,
          next_follow_up_date: updatedContact.next_follow_up_date,
          communication_frequency: updatedContact.communication_frequency,
          notes: updatedContact.notes,
          tags: updatedContact.tags,
        })
        .eq("id", updatedContact.id)
        .eq("user_id", user.id);
      if (error) throw error;

      setContacts(prev =>
        prev.map(contact =>
          contact.id === updatedContact.id ? updatedContact : contact
        )
      );

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const getContactWithDetails = async (contactId: string): Promise<ContactWithRelations | null> => {
    if (!user) return null;

    try {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("user_id", user.id)
        .single();

      if (contactError) throw contactError;

      // Fetch interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId)
        .eq("user_id", user.id)
        .order("interaction_date", { ascending: false });

      if (interactionsError) throw interactionsError;

      // Fetch job links
      const { data: jobLinks, error: jobLinksError } = await supabase
        .from("contact_job_links")
        .select(`
          *,
          jobs (
            id,
            position,
            company,
            status
          )
        `)
        .eq("contact_id", contactId);

      if (jobLinksError) throw jobLinksError;

      const transformedContact: ContactWithRelations = {
        ...contact,
        tags: Array.isArray(contact.tags) ? contact.tags : [],
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        department: contact.department || undefined,
        seniority_level: contact.seniority_level || undefined,
        linkedin_url: contact.linkedin_url || undefined,
        twitter_url: contact.twitter_url || undefined,
        github_url: contact.github_url || undefined,
        personal_website: contact.personal_website || undefined,
        how_we_met: contact.how_we_met || undefined,
        last_contact_date: contact.last_contact_date || undefined,
        next_follow_up_date: contact.next_follow_up_date || undefined,
        communication_frequency: contact.communication_frequency || undefined,
        notes: contact.notes || undefined,
        interactions: interactions || [],
        job_links: jobLinks || [],
      };

      return transformedContact;
    } catch (error) {
      console.error("Error fetching contact details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contact details",
        variant: "destructive",
      });
      return null;
    }
  };

  const addInteraction = async (interaction: Omit<ContactInteraction, "id" | "user_id" | "created_at">) => {
    if (!user) return;

    try {
      const insertData: ContactInteractionInsert = {
        ...interaction,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("contact_interactions")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update last contact date on the contact
      await supabase
        .from("contacts")
        .update({ last_contact_date: interaction.interaction_date })
        .eq("id", interaction.contact_id)
        .eq("user_id", user.id);

      toast({
        title: "Success",
        description: "Interaction logged successfully",
      });

      return data;
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast({
        title: "Error",
        description: "Failed to log interaction",
        variant: "destructive",
      });
    }
  };

  const getContactStats = async (): Promise<ContactStats | null> => {
    if (!user) return null;

    try {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("contact_type, relationship_strength, last_contact_date, next_follow_up_date")
        .eq("user_id", user.id);

      if (error) throw error;

      const stats: ContactStats = {
        total_contacts: contacts.length,
        by_type: {
          recruiter: 0,
          hiring_manager: 0,
          employee: 0,
          referral: 0,
          networking: 0,
          other: 0,
        },
        by_strength: {
          cold: 0,
          warm: 0,
          strong: 0,
          advocate: 0,
        },
        recent_interactions: 0,
        pending_follow_ups: 0,
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const today = new Date().toISOString().split('T')[0];

      contacts.forEach(contact => {
        stats.by_type[contact.contact_type]++;
        stats.by_strength[contact.relationship_strength]++;
        
        if (contact.last_contact_date && new Date(contact.last_contact_date) >= oneWeekAgo) {
          stats.recent_interactions++;
        }
        
        if (contact.next_follow_up_date && contact.next_follow_up_date <= today) {
          stats.pending_follow_ups++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      return null;
    }
  };

  const linkContactToJob = async (contactId: string, jobId: string, relationshipType: ContactJobLink['relationship_type'], isPrimary: boolean = false) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contact_job_links")
        .insert({
          contact_id: contactId,
          job_id: jobId,
          relationship_type: relationshipType,
          is_primary_contact: isPrimary,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact linked to job successfully",
      });
    } catch (error) {
      console.error("Error linking contact to job:", error);
      toast({
        title: "Error",
        description: "Failed to link contact to job",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const createContact = async (contactData: ContactInsert): Promise<boolean> => {
    // Clean up empty strings and convert them to null/undefined for database
    const cleanedData = {
      ...contactData,
      email: contactData.email && contactData.email.trim() !== '' ? contactData.email : null,
      phone: contactData.phone && contactData.phone.trim() !== '' ? contactData.phone : null,
      department: contactData.department && contactData.department.trim() !== '' ? contactData.department : null,
      linkedin_url: contactData.linkedin_url && contactData.linkedin_url.trim() !== '' ? contactData.linkedin_url : null,
      twitter_url: contactData.twitter_url && contactData.twitter_url.trim() !== '' ? contactData.twitter_url : null,
      github_url: contactData.github_url && contactData.github_url.trim() !== '' ? contactData.github_url : null,
      personal_website: contactData.personal_website && contactData.personal_website.trim() !== '' ? contactData.personal_website : null,
      last_contact_date: contactData.last_contact_date && contactData.last_contact_date.trim() !== '' ? contactData.last_contact_date : null,
      next_follow_up_date: contactData.next_follow_up_date && contactData.next_follow_up_date.trim() !== '' ? contactData.next_follow_up_date : null,
      notes: contactData.notes && contactData.notes.trim() !== '' ? contactData.notes : null,
      // Preserve dream_company_id - don't clean it
      dream_company_id: contactData.dream_company_id,
    };
    

    return addContact(cleanedData);
  };

  return {
    contacts,
    loading,
    addContact,
    createContact,
    updateContact,
    deleteContact,
    getContactWithDetails,
    addInteraction,
    getContactStats,
    linkContactToJob,
    refetch: fetchContacts,
  };
};
