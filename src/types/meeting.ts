export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Meeting {
    id: string;
    user_id: string;
    job_id: string | null;
    contact_id: string | null;
    title: string;
    description: string | null;
    scheduled_at: string;
    duration_minutes: number;
    location_platform: string | null;
    meeting_link: string | null;
    calendly_link: string | null;
    status: MeetingStatus;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface MeetingInsert {
    user_id: string;
    job_id?: string | null;
    contact_id?: string | null;
    title: string;
    description?: string | null;
    scheduled_at: string;
    duration_minutes?: number;
    location_platform?: string | null;
    meeting_link?: string | null;
    calendly_link?: string | null;
    status?: MeetingStatus;
    metadata?: any;
}

export interface AvailabilityPreference {
    id: string;
    user_id: string;
    day_of_week: number; // 0-6
    start_time: string; // HH:mm:ss
    end_time: string; // HH:mm:ss
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CalendarAccount {
    id: string;
    user_id: string;
    provider: 'google' | 'outlook';
    account_email?: string;
    access_token: string;
    refresh_token?: string;
    expires_at: string;
    is_primary: boolean;
    sync_enabled: boolean;
    settings?: {
        selected_calendars?: string[];
    };
    created_at: string;
    updated_at: string;
}

export interface CalendarAccountInsert {
    user_id: string;
    provider: 'google' | 'outlook';
    account_email?: string;
    access_token: string;
    refresh_token?: string;
    expires_at: string;
    is_primary?: boolean;
    sync_enabled?: boolean;
    settings?: any;
}
