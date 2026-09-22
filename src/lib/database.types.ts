export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          relationship_id: string
          start_date: string
          state: string
          version_id: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          relationship_id: string
          start_date?: string
          state?: string
          version_id: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          relationship_id?: string
          start_date?: string
          state?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          state: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          state?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          active: boolean
          equipment: string
          equipment_ar: string
          id: string
          instructions: string
          instructions_ar: string
          movement: string
          name: string
          name_ar: string
        }
        Insert: {
          active?: boolean
          equipment: string
          equipment_ar: string
          id: string
          instructions: string
          instructions_ar: string
          movement: string
          name: string
          name_ar: string
        }
        Update: {
          active?: boolean
          equipment?: string
          equipment_ar?: string
          id?: string
          instructions?: string
          instructions_ar?: string
          movement?: string
          name?: string
          name_ar?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_by: string | null
          assignment_id: string | null
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          intended_email: string
          request_id: string
          status: string
          token_hash: string
          version_id: string
        }
        Insert: {
          accepted_by?: string | null
          assignment_id?: string | null
          coach_id: string
          created_at?: string
          expires_at?: string
          id?: string
          intended_email: string
          request_id: string
          status?: string
          token_hash: string
          version_id: string
        }
        Update: {
          accepted_by?: string | null
          assignment_id?: string | null
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          intended_email?: string
          request_id?: string
          status?: string
          token_hash?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          coach_id: string
          id: string
          is_public: boolean
          plan_id: string
          prescription: Json
          published_at: string
          revision: number
          title: string
        }
        Insert: {
          coach_id: string
          id?: string
          is_public?: boolean
          plan_id: string
          prescription: Json
          published_at?: string
          revision: number
          title: string
        }
        Update: {
          coach_id?: string
          id?: string
          is_public?: boolean
          plan_id?: string
          prescription?: Json
          published_at?: string
          revision?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          archived: boolean
          coach_id: string
          created_at: string
          draft: Json
          draft_version: number
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          coach_id: string
          created_at?: string
          draft: Json
          draft_version?: number
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          coach_id?: string
          created_at?: string
          draft?: Json
          draft_version?: number
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          locale: string
          timezone: string
          units: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          locale?: string
          timezone?: string
          units?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          timezone?: string
          units?: string
        }
        Relationships: []
      }
      session_operations: {
        Row: {
          created_at: string
          operation_id: string
          request_hash: string
          result: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          operation_id: string
          request_hash: string
          result: Json
          session_id: string
        }
        Update: {
          created_at?: string
          operation_id?: string
          request_hash?: string
          result?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_operations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          assignment_id: string | null
          client_id: string
          coach_id: string | null
          coach_note: string
          completed_at: string | null
          day_id: string
          id: string
          local_date: string
          note: string
          occurrence_key: string
          prescription: Json
          reviewed_at: string | null
          started_at: string
          status: string
          title: string
          version: number
          version_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          client_id: string
          coach_id?: string | null
          coach_note?: string
          completed_at?: string | null
          day_id: string
          id: string
          local_date: string
          note?: string
          occurrence_key: string
          prescription: Json
          reviewed_at?: string | null
          started_at?: string
          status?: string
          title: string
          version?: number
          version_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          client_id?: string
          coach_id?: string | null
          coach_note?: string
          completed_at?: string | null
          day_id?: string
          id?: string
          local_date?: string
          note?: string
          occurrence_key?: string
          prescription?: Json
          reviewed_at?: string | null
          started_at?: string
          status?: string
          title?: string
          version?: number
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      set_entries: {
        Row: {
          completed: boolean
          exercise_key: string
          load: number
          reps: number
          session_id: string
          set_index: number
          unit: string
        }
        Insert: {
          completed?: boolean
          exercise_key: string
          load: number
          reps: number
          session_id: string
          set_index: number
          unit: string
        }
        Update: {
          completed?: boolean
          exercise_key?: string
          load?: number
          reps?: number
          session_id?: string
          set_index?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      assign_plan: {
        Args: { p_relationship_id: string; p_version_id: string }
        Returns: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          relationship_id: string
          start_date: string
          state: string
          version_id: string
        }
        SetofOptions: {
          from: "*"
          to: "assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invitation: {
        Args: {
          p_email: string
          p_request_id: string
          p_token: string
          p_version_id: string
        }
        Returns: {
          accepted_by: string | null
          assignment_id: string | null
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          intended_email: string
          request_id: string
          status: string
          token_hash: string
          version_id: string
        }
        SetofOptions: {
          from: "*"
          to: "invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_my_account: {
        Args: { p_confirmation: string }
        Returns: undefined
      }
      ensure_profile: {
        Args: { p_locale?: string; p_name?: string; p_timezone?: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          locale: string
          timezone: string
          units: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_invitation: { Args: { p_token: string }; Returns: Json }
      publish_plan: {
        Args: { p_expected_version: number; p_id: string }
        Returns: {
          coach_id: string
          id: string
          is_public: boolean
          plan_id: string
          prescription: Json
          published_at: string
          revision: number
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "plan_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_session: {
        Args: { p_id: string; p_note: string }
        Returns: {
          assignment_id: string | null
          client_id: string
          coach_id: string | null
          coach_note: string
          completed_at: string | null
          day_id: string
          id: string
          local_date: string
          note: string
          occurrence_key: string
          prescription: Json
          reviewed_at: string | null
          started_at: string
          status: string
          title: string
          version: number
          version_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_invitation: { Args: { p_id: string }; Returns: undefined }
      save_plan: {
        Args: {
          p_draft: Json
          p_expected_version?: number
          p_id: string
          p_title: string
        }
        Returns: {
          archived: boolean
          coach_id: string
          created_at: string
          draft: Json
          draft_version: number
          id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_session: {
        Args: {
          p_complete?: boolean
          p_entries: Json
          p_expected_version: number
          p_id: string
          p_note: string
          p_operation_id: string
        }
        Returns: Json
      }
      session_document: { Args: { p_id: string }; Returns: Json }
      start_session: {
        Args: {
          p_assignment_id?: string
          p_day_id: string
          p_id: string
          p_version_id: string
        }
        Returns: Json
      }
      update_profile: {
        Args: {
          p_locale: string
          p_name: string
          p_timezone: string
          p_units: string
        }
        Returns: {
          created_at: string
          display_name: string
          id: string
          locale: string
          timezone: string
          units: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_prescription: { Args: { p: Json }; Returns: undefined }
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

