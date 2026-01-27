export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      dream_companies: {
        Row: {
          careers_page_url: string | null
          name: string
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          location: string | null
          notes: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          target_roles: string[] | null
          updated_at: string
          user_id: string
          website_url: string | null
          logo_url: string | null
          founded_year: number | null
          employee_count: number | null
          remote_policy: string | null
          flexibility_score: number | null
          timezone_flexibility: string[] | null
          python_usage: string | null
          tech_stack: string[] | null
          python_frameworks: string[] | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          salary_level: string | null
          benefits: Json | null
          work_life_balance: number | null
          learning_opportunities: number | null
          career_growth: number | null
          diversity_score: number | null
          hiring_difficulty: string | null
          average_interview_process: string | null
          response_rate: number | null
          glassdoor_rating: number | null
          glassdoor_reviews_count: number | null
          recent_funding_amount: number | null
          recent_funding_date: string | null
          is_actively_hiring: boolean | null
          date_added: string | null
          target_application_date: string | null
          last_researched: string | null
          offers_remote: boolean | null
          offers_relocation: boolean | null
          offers_visa_sponsorship: boolean | null
          offers_referral: boolean | null
          keywords: string[] | null
          job_board_url: string | null
        }
        Insert: {
          careers_page_url?: string | null
          name: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          target_roles?: string[] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          logo_url?: string | null
          founded_year?: number | null
          employee_count?: number | null
          remote_policy?: string | null
          flexibility_score?: number | null
          timezone_flexibility?: string[] | null
          python_usage?: string | null
          tech_stack?: string[] | null
          python_frameworks?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_level?: string | null
          benefits?: Json | null
          work_life_balance?: number | null
          learning_opportunities?: number | null
          career_growth?: number | null
          diversity_score?: number | null
          hiring_difficulty?: string | null
          average_interview_process?: string | null
          response_rate?: number | null
          glassdoor_rating?: number | null
          glassdoor_reviews_count?: number | null
          recent_funding_amount?: number | null
          recent_funding_date?: string | null
          is_actively_hiring?: boolean | null
          date_added?: string | null
          target_application_date?: string | null
          last_researched?: string | null
        }
        Update: {
          careers_page_url?: string | null
          name?: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          target_roles?: string[] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          logo_url?: string | null
          founded_year?: number | null
          employee_count?: number | null
          remote_policy?: string | null
          flexibility_score?: number | null
          timezone_flexibility?: string[] | null
          python_usage?: string | null
          tech_stack?: string[] | null
          python_frameworks?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_level?: string | null
          benefits?: Json | null
          work_life_balance?: number | null
          learning_opportunities?: number | null
          career_growth?: number | null
          diversity_score?: number | null
          hiring_difficulty?: string | null
          average_interview_process?: string | null
          response_rate?: number | null
          glassdoor_rating?: number | null
          glassdoor_reviews_count?: number | null
          recent_funding_amount?: number | null
          recent_funding_date?: string | null
          is_actively_hiring?: boolean | null
          date_added?: string | null
          target_application_date?: string | null
          last_researched?: string | null
        }
        Relationships: []
      }
      dream_company_reminders: {
        Row: {
          completed: boolean | null
          created_at: string
          dream_company_id: string
          due_date: string
          frequency: string | null
          id: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          dream_company_id: string
          due_date: string
          frequency?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          dream_company_id?: string
          due_date?: string
          frequency?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dream_company_reminders_dream_company_id_fkey"
            columns: ["dream_company_id"]
            isOneToOne: false
            referencedRelation: "dream_companies"
            referencedColumns: ["id"]
          }
        ]
      }
      career_goals: {
        Row: {
          created_at: string
          id: string
          salary_max: number
          salary_min: number
          target_date: string
          target_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salary_max?: number
          salary_min?: number
          target_date: string
          target_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salary_max?: number
          salary_min?: number
          target_date?: string
          target_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          dream_company_id: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          dream_company_id?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          dream_company_id?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_dream_company_id_fkey"
            columns: ["dream_company_id"]
            isOneToOne: false
            referencedRelation: "dream_companies"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_feedback: {
        Row: {
          company: string
          created_at: string
          duration_minutes: number | null
          feedback_notes: string | null
          follow_up_date: string | null
          id: string
          interview_date: string
          interview_format: string
          interview_round: string
          interview_time: string | null
          interview_type: string
          interviewers: Json
          job_id: string | null
          location_platform: string | null
          next_steps: string | null
          outcome: string | null
          overall_rating: number | null
          position: string
          questions_answers: Json
          salary_discussed: boolean | null
          technical_assessment: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          duration_minutes?: number | null
          feedback_notes?: string | null
          follow_up_date?: string | null
          id?: string
          interview_date: string
          interview_format: string
          interview_round: string
          interview_time?: string | null
          interview_type: string
          interviewers?: Json
          job_id?: string | null
          location_platform?: string | null
          next_steps?: string | null
          outcome?: string | null
          overall_rating?: number | null
          position: string
          questions_answers?: Json
          salary_discussed?: boolean | null
          technical_assessment?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          duration_minutes?: number | null
          feedback_notes?: string | null
          follow_up_date?: string | null
          id?: string
          interview_date?: string
          interview_format?: string
          interview_round?: string
          interview_time?: string | null
          interview_type?: string
          interviewers?: Json
          job_id?: string | null
          location_platform?: string | null
          next_steps?: string | null
          outcome?: string | null
          overall_rating?: number | null
          position?: string
          questions_answers?: Json
          salary_discussed?: boolean | null
          technical_assessment?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_practices: {
        Row: {
          answer: string | null
          category: string
          created_at: string
          difficulty: string
          id: string
          is_favorite: boolean
          practice_count: number
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          category: string
          created_at?: string
          difficulty: string
          id?: string
          is_favorite?: boolean
          practice_count?: number
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_favorite?: boolean
          practice_count?: number
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          created_at: string
          date_applied: string | null
          date_posted: string | null
          date_saved: string
          deadline: string | null
          description: string | null
          excitement: number
          follow_up: string | null
          id: string
          job_url: string | null
          location: string | null
          max_salary: number | null
          min_salary: number | null
          notes: string | null
          position: string
          requirements: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          date_applied?: string | null
          date_posted?: string | null
          date_saved?: string
          deadline?: string | null
          description?: string | null
          excitement?: number
          follow_up?: string | null
          id?: string
          job_url?: string | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          notes?: string | null
          position: string
          requirements?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          date_applied?: string | null
          date_posted?: string | null
          date_saved?: string
          deadline?: string | null
          description?: string | null
          excitement?: number
          follow_up?: string | null
          id?: string
          job_url?: string | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          notes?: string | null
          position?: string
          requirements?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      priorities: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          important: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          important?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          important?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          template?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_styles: {
        Row: {
          assessment_type: string
          completed_at: string
          created_at: string
          id: string
          results: Json
          user_id: string
        }
        Insert: {
          assessment_type: string
          completed_at?: string
          created_at?: string
          id?: string
          results?: Json
          user_id: string
        }
        Update: {
          assessment_type?: string
          completed_at?: string
          created_at?: string
          id?: string
          results?: Json
          user_id?: string
        }
        Relationships: []
      }
      profile_growth_settings: {
        Row: {
          content_pillars: Json | null
          created_at: string
          linkedin_keys: Json | null
          posting_frequency: string | null
          primary_domains: Json | null
          secondary_domains: Json | null
          tone_voice: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_pillars?: Json | null
          created_at?: string
          linkedin_keys?: Json | null
          posting_frequency?: string | null
          primary_domains?: Json | null
          secondary_domains?: Json | null
          tone_voice?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_pillars?: Json | null
          created_at?: string
          linkedin_keys?: Json | null
          posting_frequency?: string | null
          primary_domains?: Json | null
          secondary_domains?: Json | null
          tone_voice?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_tokens: {
        Row: {
          created_at: string
          id: string
          provider: string
          access_token: string
          refresh_token: string | null
          expires_at: string
          metadata: Json | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          access_token: string
          refresh_token?: string | null
          expires_at: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string
          metadata?: Json | null
          updated_at?: string
          valid_until?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
