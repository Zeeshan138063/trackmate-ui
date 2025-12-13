export interface Contact {
    id: string;
    user_id: string;
    name: string; // Changed from first_name/last_name
    email?: string;
    phone?: string;
    company?: string;
    position?: string; // Changed from role
    relationship?: string; // Existing DB field
    address?: string;
    country?: string;
    linkedin_url?: string;
    notes?: string;
    created_at?: string;
}

export interface JobContact {
    id: string;
    job_id: string;
    contact_id: string;
    interaction_type?: string;
    contact?: Contact; // joined data
}
