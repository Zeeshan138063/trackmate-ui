import type { RoleType, WarmthStage } from "@/utils/contact-next-action";

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
    invitation_note?: string;
    created_at?: string;
    // REQ-003. Absent until migration 20261126120000 is applied; read through contactDefaults().
    role_type?: RoleType | null;
    warmth_stage?: WarmthStage;
    warmth_stage_changed_at?: string;
    next_action_snoozed_until?: string | null;
    // REQ-009. Absent until migration 20261126140000 is applied.
    invitation_sent_at?: string | null;
    // Owned by the follow-up agent; 'do_not_contact' is the one do-not-contact flag in the product.
    relationship_stage?: 'active' | 'nurture' | 'dormant' | 'do_not_contact';
    next_touch_at?: string | null;
}

export interface JobContact {
    id: string;
    job_id: string;
    contact_id: string;
    interaction_type?: string;
    contact?: Contact; // joined data
}
