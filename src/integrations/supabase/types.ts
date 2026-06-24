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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          module: Database["public"]["Enums"]["admin_module"]
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          module: Database["public"]["Enums"]["admin_module"]
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          module?: Database["public"]["Enums"]["admin_module"]
          target?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          level: Database["public"]["Enums"]["admin_permission_level"]
          module: Database["public"]["Enums"]["admin_module"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          level: Database["public"]["Enums"]["admin_permission_level"]
          module: Database["public"]["Enums"]["admin_module"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          level?: Database["public"]["Enums"]["admin_permission_level"]
          module?: Database["public"]["Enums"]["admin_module"]
          user_id?: string
        }
        Relationships: []
      }
      case_messages: {
        Row: {
          body: string
          case_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          budget_ngn: number | null
          category: string
          client_id: string
          created_at: string
          description: string
          id: string
          is_pro_bono: boolean
          jurisdiction: string | null
          lawyer_id: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_ngn?: number | null
          category: string
          client_id: string
          created_at?: string
          description: string
          id?: string
          is_pro_bono?: boolean
          jurisdiction?: string | null
          lawyer_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_ngn?: number | null
          category?: string
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          is_pro_bono?: boolean
          jurisdiction?: string | null
          lawyer_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lawyer_profiles: {
        Row: {
          accepts_pro_bono: boolean
          bio: string | null
          category: Database["public"]["Enums"]["lawyer_category"]
          court_name: string | null
          created_at: string
          hourly_rate_ngn: number | null
          id: string
          judge_tenure_years: number | null
          nba_roll_number: string | null
          rating_avg: number
          rating_count: number
          san_conferment_year: number | null
          specialties: string[]
          stamp_registration_no: string | null
          updated_at: string
          verified: boolean
          years_experience: number
        }
        Insert: {
          accepts_pro_bono?: boolean
          bio?: string | null
          category?: Database["public"]["Enums"]["lawyer_category"]
          court_name?: string | null
          created_at?: string
          hourly_rate_ngn?: number | null
          id: string
          judge_tenure_years?: number | null
          nba_roll_number?: string | null
          rating_avg?: number
          rating_count?: number
          san_conferment_year?: number | null
          specialties?: string[]
          stamp_registration_no?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number
        }
        Update: {
          accepts_pro_bono?: boolean
          bio?: string | null
          category?: Database["public"]["Enums"]["lawyer_category"]
          court_name?: string | null
          created_at?: string
          hourly_rate_ngn?: number | null
          id?: string
          judge_tenure_years?: number | null
          nba_roll_number?: string | null
          rating_avg?: number
          rating_count?: number
          san_conferment_year?: number | null
          specialties?: string[]
          stamp_registration_no?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number
        }
        Relationships: []
      }
      message_flags: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "case_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          organization: string | null
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          organization?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lawyer_directory: {
        Row: {
          accepts_pro_bono: boolean | null
          avatar_url: string | null
          bio: string | null
          category: Database["public"]["Enums"]["lawyer_category"] | null
          full_name: string | null
          hourly_rate_ngn: number | null
          id: string | null
          rating_avg: number | null
          rating_count: number | null
          specialties: string[] | null
          state: string | null
          verified: boolean | null
          years_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_run_sql: { Args: { _sql: string }; Returns: Json }
      has_admin_module: {
        Args: {
          _level: Database["public"]["Enums"]["admin_permission_level"]
          _module: Database["public"]["Enums"]["admin_module"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_case_participant: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details: Json
          _module: Database["public"]["Enums"]["admin_module"]
          _target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "client_individual" | "client_corporate" | "lawyer"
      admin_module:
        | "users"
        | "lawyers"
        | "cases"
        | "messages"
        | "flags"
        | "logs"
        | "sql"
      admin_permission_level: "view" | "edit"
      app_role: "admin" | "lawyer" | "client" | "super_admin"
      case_status:
        | "open"
        | "claimed"
        | "in_progress"
        | "completed"
        | "cancelled"
      lawyer_category:
        | "regular_advocate"
        | "san"
        | "retired_judge"
        | "notary_public"
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
    Enums: {
      account_type: ["client_individual", "client_corporate", "lawyer"],
      admin_module: [
        "users",
        "lawyers",
        "cases",
        "messages",
        "flags",
        "logs",
        "sql",
      ],
      admin_permission_level: ["view", "edit"],
      app_role: ["admin", "lawyer", "client", "super_admin"],
      case_status: ["open", "claimed", "in_progress", "completed", "cancelled"],
      lawyer_category: [
        "regular_advocate",
        "san",
        "retired_judge",
        "notary_public",
      ],
    },
  },
} as const
