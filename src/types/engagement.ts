export type EngagementType = 'email' | 'call' | 'linkedin' | 'meeting' | 'other';
export type EngagementDirection = 'inbound' | 'outbound';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface Engagement {
    id: string;
    user_id: string;
    contact_id: string;
    job_id?: string;
    type: EngagementType;
    direction: EngagementDirection;
    date: string;
    notes?: string;
    sentiment: Sentiment;
    created_at: string;
}

export type FollowUpType = 'general_checkin' | 'birthday' | 'job_update' | 'health_check' | 'other';
export type FollowUpStatus = 'pending' | 'completed' | 'missed';

export interface FollowUp {
    id: string;
    user_id: string;
    contact_id: string;
    due_date: string;
    type: FollowUpType;
    status: FollowUpStatus;
    notes?: string;
    created_at: string;
}
