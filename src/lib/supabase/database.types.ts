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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          reason: string | null
          target_id: string | null
          target_label: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_email: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          reason?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          reason?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_invites: {
        Row: {
          campaign: string
          clicked_at: string | null
          created_at: string
          interested_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign?: string
          clicked_at?: string | null
          created_at?: string
          interested_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign?: string
          clicked_at?: string | null
          created_at?: string
          interested_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consent_events: {
        Row: {
          channel: string
          created_at: string
          granted: boolean
          id: number
          ip: unknown
          purpose: string
          text_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          granted: boolean
          id?: never
          ip?: unknown
          purpose: string
          text_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          granted?: boolean
          id?: never
          ip?: unknown
          purpose?: string
          text_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_items: {
        Row: {
          created_at: string
          list_id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          list_id: string
          listing_id: string
        }
        Update: {
          created_at?: string
          list_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "favorite_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      insight_dismissals: {
        Row: {
          dismissed_at: string
          insight_key: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          insight_key: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          insight_key?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_contacts: {
        Row: {
          contact_email: string | null
          listing_id: string
          street_address: string | null
          whatsapp_number: string | null
        }
        Insert: {
          contact_email?: string | null
          listing_id: string
          street_address?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          contact_email?: string | null
          listing_id?: string
          street_address?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_contacts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_events: {
        Row: {
          created_at: string
          day: string
          id: number
          kind: string
          listing_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: never
          kind: string
          listing_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: never
          kind?: string
          listing_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_imports: {
        Row: {
          extras: Json
          imported_at: string
          listing_id: string
          source_id: string
          source_slug: string | null
          source_status: string
          source_url: string
          updated_at: string
          wp_status: string
        }
        Insert: {
          extras?: Json
          imported_at?: string
          listing_id: string
          source_id: string
          source_slug?: string | null
          source_status: string
          source_url: string
          updated_at?: string
          wp_status: string
        }
        Update: {
          extras?: Json
          imported_at?: string
          listing_id?: string
          source_id?: string
          source_slug?: string | null
          source_status?: string
          source_url?: string
          updated_at?: string
          wp_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_imports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          listing_id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          listing_id: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_removals: {
        Row: {
          city: string
          comment: string | null
          contacts: number
          id: string
          listing_id: string
          owner_id: string | null
          published_at: string | null
          reason: string
          removed_at: string
          rented_via_subleasy: string | null
          space_type: string
          state: string
          status: string
          title: string
          views: number
        }
        Insert: {
          city: string
          comment?: string | null
          contacts?: number
          id?: string
          listing_id: string
          owner_id?: string | null
          published_at?: string | null
          reason: string
          removed_at?: string
          rented_via_subleasy?: string | null
          space_type: string
          state: string
          status: string
          title: string
          views?: number
        }
        Update: {
          city?: string
          comment?: string | null
          contacts?: number
          id?: string
          listing_id?: string
          owner_id?: string | null
          published_at?: string | null
          reason?: string
          removed_at?: string
          rented_via_subleasy?: string | null
          space_type?: string
          state?: string
          status?: string
          title?: string
          views?: number
        }
        Relationships: []
      }
      listings: {
        Row: {
          amenities: string[]
          billing_type: string
          city: string
          confirmation_interval_days: number
          consecutive_confirmations: number
          created_at: string
          description: string | null
          email_contact: boolean
          embedding: string | null
          expires_at: string | null
          highlights: string[]
          id: string
          last_confirmed_at: string
          latitude: number | null
          longitude: number | null
          min_rental_period: string | null
          neighborhood: string
          offers: string[]
          owner_id: string
          photo_sizes: Json
          photos: string[]
          price: number
          published_at: string | null
          review_note: string | null
          rules: string[]
          shifts_available: Json
          short_summary: string | null
          show_exact_location: boolean
          slug: string
          space_type: string
          space_type_other: string | null
          state: string
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
          whatsapp_contact: boolean
          zip_code: string | null
        }
        Insert: {
          amenities?: string[]
          billing_type?: string
          city: string
          confirmation_interval_days?: number
          consecutive_confirmations?: number
          created_at?: string
          description?: string | null
          email_contact?: boolean
          embedding?: string | null
          expires_at?: string | null
          highlights?: string[]
          id?: string
          last_confirmed_at?: string
          latitude?: number | null
          longitude?: number | null
          min_rental_period?: string | null
          neighborhood: string
          offers?: string[]
          owner_id: string
          photo_sizes?: Json
          photos?: string[]
          price: number
          published_at?: string | null
          review_note?: string | null
          rules?: string[]
          shifts_available?: Json
          short_summary?: string | null
          show_exact_location?: boolean
          slug: string
          space_type: string
          space_type_other?: string | null
          state: string
          status?: string
          submitted_at?: string | null
          title: string
          updated_at?: string
          whatsapp_contact?: boolean
          zip_code?: string | null
        }
        Update: {
          amenities?: string[]
          billing_type?: string
          city?: string
          confirmation_interval_days?: number
          consecutive_confirmations?: number
          created_at?: string
          description?: string | null
          email_contact?: boolean
          embedding?: string | null
          expires_at?: string | null
          highlights?: string[]
          id?: string
          last_confirmed_at?: string
          latitude?: number | null
          longitude?: number | null
          min_rental_period?: string | null
          neighborhood?: string
          offers?: string[]
          owner_id?: string
          photo_sizes?: Json
          photos?: string[]
          price?: number
          published_at?: string | null
          review_note?: string | null
          rules?: string[]
          shifts_available?: Json
          short_summary?: string | null
          show_exact_location?: boolean
          slug?: string
          space_type?: string
          space_type_other?: string | null
          state?: string
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          whatsapp_contact?: boolean
          zip_code?: string | null
        }
        Relationships: []
      }
      login_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prospect_claims: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          handled_at: string | null
          id: string
          prospect_id: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          handled_at?: string | null
          id?: string
          prospect_id: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          handled_at?: string | null
          id?: string
          prospect_id?: string
        }
        Relationships: []
      }
      prospect_events: {
        Row: {
          created_at: string
          detail: Json
          id: number
          kind: string
          prospect_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: number
          kind: string
          prospect_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: number
          kind?: string
          prospect_id?: string
        }
        Relationships: []
      }
      prospect_previews: {
        Row: {
          amenities: string[]
          city: string
          created_at: string
          description: string | null
          expires_at: string
          first_viewed_at: string | null
          generated_by: string
          last_viewed_at: string | null
          neighborhood: string
          prospect_id: string
          revoked_at: string | null
          short_summary: string | null
          space_type: string
          state: string
          title: string
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          amenities?: string[]
          city: string
          created_at?: string
          description?: string | null
          expires_at: string
          first_viewed_at?: string | null
          generated_by?: string
          last_viewed_at?: string | null
          neighborhood: string
          prospect_id: string
          revoked_at?: string | null
          short_summary?: string | null
          space_type: string
          state: string
          title: string
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          amenities?: string[]
          city?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          first_viewed_at?: string | null
          generated_by?: string
          last_viewed_at?: string | null
          neighborhood?: string
          prospect_id?: string
          revoked_at?: string | null
          short_summary?: string | null
          space_type?: string
          state?: string
          title?: string
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      prospects: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          last_contact_at: string | null
          link_note: string | null
          message_model: string | null
          name: string
          notes: string | null
          phone: string | null
          place_id: string | null
          priority: number | null
          recipient: string | null
          source: string | null
          specialty: string | null
          status: string
          touches: number
          treatment: string | null
          updated_at: string
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          link_note?: string | null
          message_model?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          priority?: number | null
          recipient?: string | null
          source?: string | null
          specialty?: string | null
          status?: string
          touches?: number
          treatment?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          link_note?: string | null
          message_model?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          priority?: number | null
          recipient?: string | null
          source?: string | null
          specialty?: string | null
          status?: string
          touches?: number
          treatment?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          identity_verified_at: string | null
          marketing_opt_in: boolean
          marketing_opt_in_at: string | null
          notify_expiration: boolean
          notify_listing_updates: boolean
          notify_messages: boolean
          public_id: string
          roles: string[]
          show_whatsapp: boolean
          show_whatsapp_at: string | null
          terms_accepted_at: string
          terms_version: string
          trusted_devices_reset_at: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          identity_verified_at?: string | null
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          notify_expiration?: boolean
          notify_listing_updates?: boolean
          notify_messages?: boolean
          public_id?: string
          roles?: string[]
          show_whatsapp?: boolean
          show_whatsapp_at?: string | null
          terms_accepted_at: string
          terms_version: string
          trusted_devices_reset_at?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          identity_verified_at?: string | null
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          notify_expiration?: boolean
          notify_listing_updates?: boolean
          notify_messages?: boolean
          public_id?: string
          roles?: string[]
          show_whatsapp?: boolean
          show_whatsapp_at?: string | null
          terms_accepted_at?: string
          terms_version?: string
          trusted_devices_reset_at?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_owner_contact_pattern: {
        Args: { p_owner: string; p_since: string }
        Returns: {
          dow: number
          hour: number
          total: number
        }[]
      }
      admin_owner_daily_metrics: {
        Args: { p_owner: string; p_since: string }
        Returns: {
          day: string
          kind: string
          listing_id: string
          total: number
        }[]
      }
      admin_owner_listing_favorites: {
        Args: { p_owner: string; p_since?: string }
        Returns: {
          listing_id: string
          since_count: number
          total: number
        }[]
      }
      auth_user_id_by_email: { Args: { p_email: string }; Returns: string }
      delete_own_account: { Args: never; Returns: undefined }
      get_listing_whatsapp: {
        Args: { p_listing_id: string; p_visitor_id: string }
        Returns: string
      }
      get_profile_whatsapp: { Args: { p_public_id: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      listing_host: {
        Args: { p_listing_id: string }
        Returns: {
          active_listings: number
          avatar_path: string
          identity_verified_at: string
          member_since: string
          public_id: string
          public_name: string
        }[]
      }
      listing_owner: {
        Args: { p_listing_id: string }
        Returns: {
          display_name: string
          email: string
          whatsapp_number: string
        }[]
      }
      owner_contact_pattern: {
        Args: { p_since: string }
        Returns: {
          dow: number
          hour: number
          total: number
        }[]
      }
      owner_daily_metrics: {
        Args: { p_since: string }
        Returns: {
          day: string
          kind: string
          listing_id: string
          total: number
        }[]
      }
      owner_listing_favorites: {
        Args: { p_since?: string }
        Returns: {
          listing_id: string
          since_count: number
          total: number
        }[]
      }
      public_name: { Args: { p_name: string }; Returns: string }
      public_profile: {
        Args: { p_public_id: string }
        Returns: {
          active_listings: number
          avatar_path: string
          bio: string
          cities: string[]
          identity_verified_at: string
          member_since: string
          public_id: string
          public_name: string
          roles: string[]
          show_whatsapp: boolean
        }[]
      }
      public_profile_listings: {
        Args: { p_public_id: string }
        Returns: {
          billing_type: string
          city: string
          neighborhood: string
          photo_sizes: Json
          photos: string[]
          price: number
          slug: string
          space_type: string
          title: string
        }[]
      }
      record_listing_view: {
        Args: { p_listing_id: string; p_visitor_id: string }
        Returns: undefined
      }
      renew_listing: { Args: { p_listing_id: string }; Returns: string }
      submit_listing_inquiry: {
        Args: {
          p_email: string
          p_listing_id: string
          p_message: string
          p_name: string
          p_phone: string
          p_visitor_id: string
        }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
