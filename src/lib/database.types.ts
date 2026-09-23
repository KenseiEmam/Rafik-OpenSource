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
      appointment_slots: {
        Row: {
          coach_id: string
          ends_at: string
          id: string
          local_start: string
          location: string
          series_id: string
          starts_at: string
          state: string
          timezone: string
          title: string
        }
        Insert: {
          coach_id: string
          ends_at: string
          id?: string
          local_start: string
          location: string
          series_id: string
          starts_at: string
          state?: string
          timezone: string
          title: string
        }
        Update: {
          coach_id?: string
          ends_at?: string
          id?: string
          local_start?: string
          location?: string
          series_id?: string
          starts_at?: string
          state?: string
          timezone?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          location: string
          note: string
          relationship_id: string
          revision: number
          slot_id: string
          starts_at: string
          state: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id: string
          location: string
          note?: string
          relationship_id: string
          revision?: number
          slot_id: string
          starts_at: string
          state?: string
          timezone: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          location?: string
          note?: string
          relationship_id?: string
          revision?: number
          slot_id?: string
          starts_at?: string
          state?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          relationship_id: string
          revision: number
          schedule_mode: string
          start_date: string
          state: string
          version_id: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          relationship_id: string
          revision?: number
          schedule_mode?: string
          start_date?: string
          state?: string
          version_id: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          relationship_id?: string
          revision?: number
          schedule_mode?: string
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
      business_accounts: {
        Row: {
          access_until: string
          client_limit: number
          id: string
          owner_id: string | null
          provider_sequence: number
          staff_limit: number
          state: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          access_until?: string
          client_limit?: number
          id: string
          owner_id?: string | null
          provider_sequence?: number
          staff_limit?: number
          state?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          access_until?: string
          client_limit?: number
          id?: string
          owner_id?: string | null
          provider_sequence?: number
          staff_limit?: number
          state?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      business_events: {
        Row: {
          account_id: string
          applied: boolean
          created_at: string
          id: string
          payload: Json
          sequence: number
        }
        Insert: {
          account_id: string
          applied: boolean
          created_at?: string
          id: string
          payload: Json
          sequence: number
        }
        Update: {
          account_id?: string
          applied?: boolean
          created_at?: string
          id?: string
          payload?: Json
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_context: {
        Row: {
          constraints: string
          goals: string
          id: string
          notes: string
          revision: number
          updated_at: string
        }
        Insert: {
          constraints?: string
          goals?: string
          id: string
          notes?: string
          revision?: number
          updated_at?: string
        }
        Update: {
          constraints?: string
          goals?: string
          id?: string
          notes?: string
          revision?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_context_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "coach_clients"
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
      coaching_forms: {
        Row: {
          coach_id: string
          fields: Json
          id: string
          kind: string
          revision: number
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          fields: Json
          id: string
          kind: string
          revision?: number
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          fields?: Json
          id?: string
          kind?: string
          revision?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_forms_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_requests: {
        Row: {
          answers: Json
          cancelled: boolean
          due_date: string
          feedback: string
          fields: Json
          form_id: string | null
          form_revision: number
          id: string
          kind: string
          relationship_id: string
          reviewed_at: string | null
          revision: number
          series_id: string
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          cancelled?: boolean
          due_date: string
          feedback?: string
          fields: Json
          form_id?: string | null
          form_revision: number
          id?: string
          kind: string
          relationship_id: string
          reviewed_at?: string | null
          revision?: number
          series_id: string
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          cancelled?: boolean
          due_date?: string
          feedback?: string
          fields?: Json
          form_id?: string | null
          form_revision?: number
          id?: string
          kind?: string
          relationship_id?: string
          reviewed_at?: string | null
          revision?: number
          series_id?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_requests_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coaching_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_requests_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          id: string
          last_sequence: number
          relationship_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_sequence?: number
          relationship_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_sequence?: number
          relationship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
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
          kind: string
          media_url: string
          movement: string
          name: string
          name_ar: string
          owner_id: string | null
          revision: number
        }
        Insert: {
          active?: boolean
          equipment: string
          equipment_ar: string
          id: string
          instructions: string
          instructions_ar: string
          kind?: string
          media_url?: string
          movement: string
          name: string
          name_ar: string
          owner_id?: string | null
          revision?: number
        }
        Update: {
          active?: boolean
          equipment?: string
          equipment_ar?: string
          id?: string
          instructions?: string
          instructions_ar?: string
          kind?: string
          media_url?: string
          movement?: string
          name?: string
          name_ar?: string
          owner_id?: string | null
          revision?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      meal_entries: {
        Row: {
          basis: number
          client_id: string
          created_at: string
          food_id: string | null
          id: string
          logged_on: string
          meal: string
          name: string
          note: string
          nutrients: Json
          quantity: number
          relationship_id: string | null
          revision: number
          source: string
          unit: string
        }
        Insert: {
          basis: number
          client_id: string
          created_at?: string
          food_id?: string | null
          id: string
          logged_on: string
          meal: string
          name: string
          note?: string
          nutrients: Json
          quantity: number
          relationship_id?: string | null
          revision?: number
          source: string
          unit: string
        }
        Update: {
          basis?: number
          client_id?: string
          created_at?: string
          food_id?: string | null
          id?: string
          logged_on?: string
          meal?: string
          name?: string
          note?: string
          nutrients?: Json
          quantity?: number
          relationship_id?: string | null
          revision?: number
          source?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "saved_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          client_id: string
          id: string
          measured_on: string
          metric: string
          relationship_id: string | null
          revision: number
          unit: string
          value: number
        }
        Insert: {
          client_id: string
          id: string
          measured_on: string
          metric: string
          relationship_id?: string | null
          revision?: number
          unit: string
          value: number
        }
        Update: {
          client_id?: string
          id?: string
          measured_on?: string
          metric?: string
          relationship_id?: string | null
          revision?: number
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          relationship_id: string
          request_id: string | null
          resource_id: string | null
          sender_id: string
          sequence: number
          session_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id: string
          relationship_id: string
          request_id?: string | null
          resource_id?: string | null
          sender_id: string
          sequence?: never
          session_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          relationship_id?: string
          request_id?: string | null
          resource_id?: string | null
          sender_id?: string
          sequence?: never
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "coaching_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_guidance: {
        Row: {
          created_at: string
          effective_on: string
          guidance: string
          id: string
          relationship_id: string
          revision: number
          targets: Json
        }
        Insert: {
          created_at?: string
          effective_on: string
          guidance: string
          id: string
          relationship_id: string
          revision: number
          targets: Json
        }
        Update: {
          created_at?: string
          effective_on?: string
          guidance?: string
          id?: string
          relationship_id?: string
          revision?: number
          targets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_guidance_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
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
          team_template_id: string | null
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
          team_template_id?: string | null
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
          team_template_id?: string | null
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
          {
            foreignKeyName: "plans_team_template_id_fkey"
            columns: ["team_template_id"]
            isOneToOne: false
            referencedRelation: "team_plans"
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
      resource_shares: {
        Row: {
          created_at: string
          id: string
          relationship_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_id: string
          resource_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_shares_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          bytes: number
          created_at: string
          filename: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          revision: number
          state: string
          title: string
        }
        Insert: {
          bytes: number
          created_at?: string
          filename: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          revision?: number
          state?: string
          title: string
        }
        Update: {
          bytes?: number
          created_at?: string
          filename?: string
          id?: string
          media_type?: string
          object_path?: string
          owner_id?: string
          revision?: number
          state?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      runtime_settings: {
        Row: {
          id: boolean
          local_simulation: boolean
        }
        Insert: {
          id?: boolean
          local_simulation?: boolean
        }
        Update: {
          id?: boolean
          local_simulation?: boolean
        }
        Relationships: []
      }
      saved_foods: {
        Row: {
          archived: boolean
          basis: number
          id: string
          name: string
          nutrients: Json
          owner_id: string
          revision: number
          source: string
          unit: string
        }
        Insert: {
          archived?: boolean
          basis: number
          id: string
          name: string
          nutrients: Json
          owner_id: string
          revision?: number
          source: string
          unit: string
        }
        Update: {
          archived?: boolean
          basis?: number
          id?: string
          name?: string
          nutrients?: Json
          owner_id?: string
          revision?: number
          source?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_foods_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_exceptions: {
        Row: {
          assignment_id: string
          day_id: string
          id: string
          scheduled_date: string
          state: string
          target_date: string
        }
        Insert: {
          assignment_id: string
          day_id: string
          id?: string
          scheduled_date: string
          state: string
          target_date: string
        }
        Update: {
          assignment_id?: string
          day_id?: string
          id?: string
          scheduled_date?: string
          state?: string
          target_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
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
          effort: number | null
          exercise_id: string | null
          exercise_key: string
          load: number
          metres: number | null
          reps: number
          seconds: number | null
          session_id: string
          set_index: number
          unit: string
        }
        Insert: {
          completed?: boolean
          effort?: number | null
          exercise_id?: string | null
          exercise_key: string
          load: number
          metres?: number | null
          reps: number
          seconds?: number | null
          session_id: string
          set_index: number
          unit: string
        }
        Update: {
          completed?: boolean
          effort?: number | null
          exercise_id?: string | null
          exercise_key?: string
          load?: number
          metres?: number | null
          reps?: number
          seconds?: number | null
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
      support_cases: {
        Row: {
          created_at: string
          detail: string
          id: string
          reply: string
          reporter_id: string
          revision: number
          state: string
          subject: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail: string
          id: string
          reply?: string
          reporter_id: string
          revision?: number
          state?: string
          subject: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          reply?: string
          reporter_id?: string
          revision?: number
          state?: string
          subject?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          subject_id: string | null
          team_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          team_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assignments: {
        Row: {
          actor_id: string | null
          client_ids: string[]
          created_at: string
          group_id: string
          id: string
          version_id: string | null
        }
        Insert: {
          actor_id?: string | null
          client_ids: string[]
          created_at?: string
          group_id: string
          id: string
          version_id?: string | null
        }
        Update: {
          actor_id?: string | null
          client_ids?: string[]
          created_at?: string
          group_id?: string
          id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_assignments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_clients: {
        Row: {
          client_id: string
          coach_id: string | null
          created_at: string
          id: string
          last_accept: boolean | null
          last_response_revision: number | null
          pending_coach_id: string | null
          relationship_id: string
          revision: number
          state: string
          team_id: string
        }
        Insert: {
          client_id: string
          coach_id?: string | null
          created_at?: string
          id: string
          last_accept?: boolean | null
          last_response_revision?: number | null
          pending_coach_id?: string | null
          relationship_id: string
          revision?: number
          state?: string
          team_id: string
        }
        Update: {
          client_id?: string
          coach_id?: string | null
          created_at?: string
          id?: string
          last_accept?: boolean | null
          last_response_revision?: number | null
          pending_coach_id?: string | null
          relationship_id?: string
          revision?: number
          state?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_clients_pending_coach_id_fkey"
            columns: ["pending_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_clients_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_clients_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_group_members: {
        Row: {
          client_id: string
          group_id: string
          id: string
        }
        Insert: {
          client_id: string
          group_id: string
          id?: string
        }
        Update: {
          client_id?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_group_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "team_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      team_groups: {
        Row: {
          archived: boolean
          id: string
          name: string
          revision: number
          team_id: string
        }
        Insert: {
          archived?: boolean
          id: string
          name: string
          revision?: number
          team_id: string
        }
        Update: {
          archived?: boolean
          id?: string
          name?: string
          revision?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_groups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_by: string | null
          email: string
          expires_at: string
          id: string
          role: string
          state: string
          team_id: string
          token_hash: string
        }
        Insert: {
          accepted_by?: string | null
          email: string
          expires_at?: string
          id: string
          role: string
          state?: string
          team_id: string
          token_hash: string
        }
        Update: {
          accepted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: string
          state?: string
          team_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          role: string
          state: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          state?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          state?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_plans: {
        Row: {
          archived: boolean
          contributor_id: string | null
          created_at: string
          id: string
          prescription: Json
          source_id: string | null
          team_id: string
          title: string
        }
        Insert: {
          archived?: boolean
          contributor_id?: string | null
          created_at?: string
          id: string
          prescription: Json
          source_id?: string | null
          team_id: string
          title: string
        }
        Update: {
          archived?: boolean
          contributor_id?: string | null
          created_at?: string
          id?: string
          prescription?: Json
          source_id?: string | null
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_plans_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_plans_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_resource_shares: {
        Row: {
          id: string
          resource_id: string
          team_id: string
        }
        Insert: {
          id?: string
          resource_id: string
          team_id: string
        }
        Update: {
          id?: string
          resource_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_resource_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_resource_shares_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          owner_id: string | null
          revision: number
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id: string
          name: string
          owner_id?: string | null
          revision?: number
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          revision?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      accept_team_invitation: { Args: { p_token: string }; Returns: string }
      account_deletion_ready: { Args: never; Returns: undefined }
      apply_business_event: {
        Args: {
          p_account: string
          p_id: string
          p_payload: Json
          p_sequence: number
        }
        Returns: {
          access_until: string
          client_limit: number
          id: string
          owner_id: string | null
          provider_sequence: number
          staff_limit: number
          state: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      archive_food: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      archive_team_group: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      assign_coaching_form: {
        Args: {
          p_count: number
          p_due: string
          p_form: string
          p_interval: number
          p_relationship: string
          p_revision: number
          p_series: string
        }
        Returns: {
          answers: Json
          cancelled: boolean
          due_date: string
          feedback: string
          fields: Json
          form_id: string | null
          form_revision: number
          id: string
          kind: string
          relationship_id: string
          reviewed_at: string | null
          revision: number
          series_id: string
          submitted_at: string | null
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "coaching_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      assign_plan: {
        Args: { p_relationship_id: string; p_version_id: string }
        Returns: {
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          relationship_id: string
          revision: number
          schedule_mode: string
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
      assign_team_group: {
        Args: {
          p_clients: string[]
          p_group: string
          p_id: string
          p_version: string
        }
        Returns: {
          actor_id: string | null
          client_ids: string[]
          created_at: string
          group_id: string
          id: string
          version_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "team_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assignment_schedule: {
        Args: { p_from: string; p_id: string; p_to: string }
        Returns: Json
      }
      availability_preview: {
        Args: {
          p_count: number
          p_every: number
          p_local: string
          p_minutes: number
          p_zone: string
        }
        Returns: Json
      }
      book_appointment: {
        Args: { p_id: string; p_relationship: string; p_slot: string }
        Returns: {
          created_at: string
          ends_at: string
          id: string
          location: string
          note: string
          relationship_id: string
          revision: number
          slot_id: string
          starts_at: string
          state: string
          timezone: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_access: { Args: { p_account: string }; Returns: boolean }
      can_read_resource: { Args: { p_id: string }; Returns: boolean }
      can_upload_resource: { Args: { p_path: string }; Returns: boolean }
      cancel_coaching_request: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      change_appointment: {
        Args: {
          p_action: string
          p_id: string
          p_note?: string
          p_revision: number
          p_slot?: string
        }
        Returns: {
          created_at: string
          ends_at: string
          id: string
          location: string
          note: string
          relationship_id: string
          revision: number
          slot_id: string
          starts_at: string
          state: string
          timezone: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_scheduled_day: {
        Args: {
          p_date: string
          p_day_id: string
          p_id: string
          p_state: string
          p_target: string
        }
        Returns: undefined
      }
      change_team_member: {
        Args: { p_action: string; p_team: string; p_user: string }
        Returns: undefined
      }
      close_team: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      close_team_client: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      configure_assignment: {
        Args: {
          p_end: string
          p_id: string
          p_mode: string
          p_revision: number
          p_start: string
          p_version_id: string
        }
        Returns: {
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          relationship_id: string
          revision: number
          schedule_mode: string
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
      conversation_inbox: { Args: never; Returns: Json }
      copy_snapshot_plan: {
        Args: {
          p_id: string
          p_owner: string
          p_snapshot: Json
          p_template?: string
          p_title: string
        }
        Returns: {
          archived: boolean
          coach_id: string
          created_at: string
          draft: Json
          draft_version: number
          id: string
          team_template_id: string | null
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
      create_support_case: {
        Args: {
          p_detail: string
          p_id: string
          p_subject: string
          p_team: string
        }
        Returns: {
          created_at: string
          detail: string
          id: string
          reply: string
          reporter_id: string
          revision: number
          state: string
          subject: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_team: {
        Args: { p_id: string; p_name: string }
        Returns: {
          archived: boolean
          created_at: string
          id: string
          name: string
          owner_id: string | null
          revision: number
        }
        SetofOptions: {
          from: "*"
          to: "teams"
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
      finish_resource: {
        Args: { p_id: string }
        Returns: {
          bytes: number
          created_at: string
          filename: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          revision: number
          state: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "resources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_invitation: { Args: { p_token: string }; Returns: Json }
      import_team_plan: {
        Args: { p_id: string; p_template: string }
        Returns: {
          archived: boolean
          coach_id: string
          created_at: string
          draft: Json
          draft_version: number
          id: string
          team_template_id: string | null
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
      invite_team_member: {
        Args: {
          p_email: string
          p_id: string
          p_role: string
          p_team: string
          p_token: string
        }
        Returns: {
          accepted_by: string | null
          email: string
          expires_at: string
          id: string
          role: string
          state: string
          team_id: string
          token_hash: string
        }
        SetofOptions: {
          from: "*"
          to: "team_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_conversation_read: {
        Args: { p_relationship: string; p_sequence: number }
        Returns: undefined
      }
      my_resource_teams: { Args: never; Returns: Json }
      my_team_enrollments: { Args: never; Returns: Json }
      open_business_account: {
        Args: { p_id: string; p_team?: string }
        Returns: {
          access_until: string
          client_limit: number
          id: string
          owner_id: string | null
          provider_sequence: number
          staff_limit: number
          state: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      operator_support_reply: {
        Args: { p_id: string; p_reply: string; p_revision: number }
        Returns: {
          created_at: string
          detail: string
          id: string
          reply: string
          reporter_id: string
          revision: number
          state: string
          subject: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      performed_exercise: { Args: { p: Json; p_choice: string }; Returns: Json }
      previous_performance: {
        Args: { p_before: string; p_exercises: string[] }
        Returns: Json
      }
      propose_team_client: {
        Args: { p_id: string; p_relationship: string; p_team: string }
        Returns: {
          client_id: string
          coach_id: string | null
          created_at: string
          id: string
          last_accept: boolean | null
          last_response_revision: number | null
          pending_coach_id: string | null
          relationship_id: string
          revision: number
          state: string
          team_id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_availability: {
        Args: {
          p_count: number
          p_every: number
          p_local: string
          p_location: string
          p_minutes: number
          p_series: string
          p_title: string
          p_zone: string
        }
        Returns: {
          coach_id: string
          ends_at: string
          id: string
          local_start: string
          location: string
          series_id: string
          starts_at: string
          state: string
          timezone: string
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "appointment_slots"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      register_resource: {
        Args: {
          p_bytes: number
          p_filename: string
          p_id: string
          p_title: string
          p_type: string
        }
        Returns: {
          bytes: number
          created_at: string
          filename: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          revision: number
          state: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "resources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_meal: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      remove_measurement: {
        Args: { p_id: string; p_revision: number }
        Returns: undefined
      }
      remove_resource_record: { Args: { p_id: string }; Returns: undefined }
      remove_team_plan: { Args: { p_id: string }; Returns: undefined }
      rename_team: {
        Args: { p_id: string; p_name: string; p_revision: number }
        Returns: {
          archived: boolean
          created_at: string
          id: string
          name: string
          owner_id: string | null
          revision: number
        }
        SetofOptions: {
          from: "*"
          to: "teams"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_team_handoff: {
        Args: { p_coach: string; p_id: string; p_revision: number }
        Returns: {
          client_id: string
          coach_id: string | null
          created_at: string
          id: string
          last_accept: boolean | null
          last_response_revision: number | null
          pending_coach_id: string | null
          relationship_id: string
          revision: number
          state: string
          team_id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_team_growth: {
        Args: { p_action: string; p_team: string }
        Returns: undefined
      }
      respond_team_client: {
        Args: { p_accept: boolean; p_id: string; p_revision: number }
        Returns: {
          client_id: string
          coach_id: string | null
          created_at: string
          id: string
          last_accept: boolean | null
          last_response_revision: number | null
          pending_coach_id: string | null
          relationship_id: string
          revision: number
          state: string
          team_id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retire_resource: {
        Args: { p_id: string; p_revision: number }
        Returns: {
          bytes: number
          created_at: string
          filename: string
          id: string
          media_type: string
          object_path: string
          owner_id: string
          revision: number
          state: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "resources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_coaching_response: {
        Args: { p_feedback: string; p_id: string; p_revision: number }
        Returns: {
          answers: Json
          cancelled: boolean
          due_date: string
          feedback: string
          fields: Json
          form_id: string | null
          form_revision: number
          id: string
          kind: string
          relationship_id: string
          reviewed_at: string | null
          revision: number
          series_id: string
          submitted_at: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_requests"
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
      revoke_team_invitation: { Args: { p_id: string }; Returns: undefined }
      save_client_context: {
        Args: {
          p_constraints: string
          p_goals: string
          p_id: string
          p_notes: string
          p_revision: number
        }
        Returns: {
          constraints: string
          goals: string
          id: string
          notes: string
          revision: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "client_context"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_coaching_form: {
        Args: {
          p_fields: Json
          p_id: string
          p_kind: string
          p_revision: number
          p_title: string
        }
        Returns: {
          coach_id: string
          fields: Json
          id: string
          kind: string
          revision: number
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_forms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_coaching_response: {
        Args: {
          p_answers: Json
          p_id: string
          p_revision: number
          p_submit: boolean
        }
        Returns: {
          answers: Json
          cancelled: boolean
          due_date: string
          feedback: string
          fields: Json
          form_id: string | null
          form_revision: number
          id: string
          kind: string
          relationship_id: string
          reviewed_at: string | null
          revision: number
          series_id: string
          submitted_at: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_exercise: {
        Args: { p_data: Json; p_id: string; p_revision: number }
        Returns: {
          active: boolean
          equipment: string
          equipment_ar: string
          id: string
          instructions: string
          instructions_ar: string
          kind: string
          media_url: string
          movement: string
          name: string
          name_ar: string
          owner_id: string | null
          revision: number
        }
        SetofOptions: {
          from: "*"
          to: "exercises"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_food: {
        Args: {
          p_basis: number
          p_id: string
          p_name: string
          p_nutrients: Json
          p_revision: number
          p_source: string
          p_unit: string
        }
        Returns: {
          archived: boolean
          basis: number
          id: string
          name: string
          nutrients: Json
          owner_id: string
          revision: number
          source: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "saved_foods"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_meal: {
        Args: {
          p_data: Json
          p_date: string
          p_id: string
          p_meal: string
          p_relationship: string
          p_revision: number
        }
        Returns: {
          basis: number
          client_id: string
          created_at: string
          food_id: string | null
          id: string
          logged_on: string
          meal: string
          name: string
          note: string
          nutrients: Json
          quantity: number
          relationship_id: string | null
          revision: number
          source: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "meal_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_measurement: {
        Args: {
          p_date: string
          p_id: string
          p_metric: string
          p_relationship: string
          p_revision: number
          p_unit: string
          p_value: number
        }
        Returns: {
          client_id: string
          id: string
          measured_on: string
          metric: string
          relationship_id: string | null
          revision: number
          unit: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "measurements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_nutrition_guidance: {
        Args: {
          p_effective: string
          p_guidance: string
          p_id: string
          p_relationship: string
          p_revision: number
          p_targets: Json
        }
        Returns: {
          created_at: string
          effective_on: string
          guidance: string
          id: string
          relationship_id: string
          revision: number
          targets: Json
        }
        SetofOptions: {
          from: "*"
          to: "nutrition_guidance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
          team_template_id: string | null
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
      save_team_group: {
        Args: {
          p_id: string
          p_name: string
          p_revision: number
          p_team: string
        }
        Returns: {
          archived: boolean
          id: string
          name: string
          revision: number
          team_id: string
        }
        SetofOptions: {
          from: "*"
          to: "team_groups"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_message: {
        Args: {
          p_body: string
          p_id: string
          p_relationship: string
          p_request?: string
          p_resource?: string
          p_session?: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          relationship_id: string
          request_id: string | null
          resource_id: string | null
          sender_id: string
          sequence: number
          session_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      session_document: { Args: { p_id: string }; Returns: Json }
      set_client_state: {
        Args: { p_id: string; p_state: string }
        Returns: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          state: string
        }
        SetofOptions: {
          from: "*"
          to: "coach_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_exercise_active: {
        Args: { p_active: boolean; p_id: string }
        Returns: undefined
      }
      set_team_group_client: {
        Args: { p_client: string; p_group: string; p_included: boolean }
        Returns: undefined
      }
      share_resource: {
        Args: { p_id: string; p_relationship: string; p_shared: boolean }
        Returns: undefined
      }
      share_team_plan: {
        Args: { p_id: string; p_team: string; p_version: string }
        Returns: {
          archived: boolean
          contributor_id: string | null
          created_at: string
          id: string
          prescription: Json
          source_id: string | null
          team_id: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "team_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      share_team_resource: {
        Args: { p_resource: string; p_shared: boolean; p_team: string }
        Returns: undefined
      }
      simulate_business_event: {
        Args: {
          p_account: string
          p_id: string
          p_payload: Json
          p_sequence: number
        }
        Returns: {
          access_until: string
          client_limit: number
          id: string
          owner_id: string | null
          provider_sequence: number
          staff_limit: number
          state: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      snapshot_prescription: { Args: { p: Json }; Returns: Json }
      start_session: {
        Args: {
          p_assignment_id?: string
          p_day_id: string
          p_id: string
          p_scheduled_date?: string
          p_version_id: string
        }
        Returns: Json
      }
      team_invitation: { Args: { p_token: string }; Returns: Json }
      team_log: {
        Args: { p_action: string; p_subject?: string; p_team: string }
        Returns: undefined
      }
      team_role: { Args: { p_team: string }; Returns: string }
      team_workspace: { Args: { p_team: string }; Returns: Json }
      training_progress: {
        Args: { p_from: string; p_relationship: string; p_to: string }
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
      update_support_case: {
        Args: {
          p_id: string
          p_reply?: string
          p_revision: number
          p_state: string
        }
        Returns: {
          created_at: string
          detail: string
          id: string
          reply: string
          reporter_id: string
          revision: number
          state: string
          subject: string
          team_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_coaching_fields: { Args: { p: Json }; Returns: undefined }
      validate_nutrients: { Args: { p: Json }; Returns: undefined }
      validate_prescription: { Args: { p: Json }; Returns: undefined }
      withdraw_availability: { Args: { p_id: string }; Returns: undefined }
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

