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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bonus_code_uses: {
        Row: {
          code_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_code_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "bonus_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_codes: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number
          uses: number
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Relationships: []
      }
      investments: {
        Row: {
          active: boolean
          created_at: string
          daily_return: number
          days_paid: number
          duration_days: number
          id: string
          last_payout: string
          price: number
          product_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          daily_return: number
          days_paid?: number
          duration_days: number
          id?: string
          last_payout?: string
          price: number
          product_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          daily_return?: number
          days_paid?: number
          duration_days?: number
          id?: string
          last_payout?: string
          price?: number
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          daily_return: number
          description: string | null
          duration_days: number
          id: string
          image_url: string | null
          name: string
          price: number
          rank: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          daily_return: number
          description?: string | null
          duration_days?: number
          id?: string
          image_url?: string | null
          name: string
          price: number
          rank: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          daily_return?: number
          description?: string | null
          duration_days?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          rank?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          country: string
          created_at: string
          has_invested: boolean
          id: string
          invite_code: string
          last_bonus_date: string | null
          phone: string
          referral_earned: number
          referred_by: string | null
          total_earned: number
        }
        Insert: {
          balance?: number
          country: string
          created_at?: string
          has_invested?: boolean
          id: string
          invite_code: string
          last_bonus_date?: string | null
          phone: string
          referral_earned?: number
          referred_by?: string | null
          total_earned?: number
        }
        Update: {
          balance?: number
          country?: string
          created_at?: string
          has_invested?: boolean
          id?: string
          invite_code?: string
          last_bonus_date?: string | null
          phone?: string
          referral_earned?: number
          referred_by?: string | null
          total_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          announcement: string
          daily_bonus: number
          id: boolean
          min_deposit: number
          min_withdrawal: number
          payment_url: string
          popup_enabled: boolean
          popup_message: string
          popup_title: string
          referral_rate_1: number
          referral_rate_2: number
          referral_rate_3: number
          signup_bonus: number
          support_url: string
          telegram_url: string
          updated_at: string
          whatsapp_url: string
          withdrawal_end_hour: number
          withdrawal_start_hour: number
        }
        Insert: {
          announcement?: string
          daily_bonus?: number
          id?: boolean
          min_deposit?: number
          min_withdrawal?: number
          payment_url?: string
          popup_enabled?: boolean
          popup_message?: string
          popup_title?: string
          referral_rate_1?: number
          referral_rate_2?: number
          referral_rate_3?: number
          signup_bonus?: number
          support_url?: string
          telegram_url?: string
          updated_at?: string
          whatsapp_url?: string
          withdrawal_end_hour?: number
          withdrawal_start_hour?: number
        }
        Update: {
          announcement?: string
          daily_bonus?: number
          id?: boolean
          min_deposit?: number
          min_withdrawal?: number
          payment_url?: string
          popup_enabled?: boolean
          popup_message?: string
          popup_title?: string
          referral_rate_1?: number
          referral_rate_2?: number
          referral_rate_3?: number
          signup_bonus?: number
          support_url?: string
          telegram_url?: string
          updated_at?: string
          whatsapp_url?: string
          withdrawal_end_hour?: number
          withdrawal_start_hour?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          method: string | null
          note: string | null
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          method?: string | null
          note?: string | null
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          method?: string | null
          note?: string | null
          phone?: string | null
          status?: string
          user_id?: string
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
      wheel_prizes: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          id: string
          label: string
          weight: number
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          id?: string
          label: string
          weight?: number
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          id?: string
          label?: string
          weight?: number
        }
        Relationships: []
      }
      wheel_settings: {
        Row: {
          active: boolean
          daily_spins: number
          difficulty: number
          id: boolean
          spin_cost: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          daily_spins?: number
          difficulty?: number
          id?: boolean
          spin_cost?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          daily_spins?: number
          difficulty?: number
          id?: boolean
          spin_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      wheel_spins: {
        Row: {
          amount: number
          created_at: string
          id: string
          prize_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          prize_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          prize_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_spins_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "wheel_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_funds: {
        Args: { p_amount: number; p_note?: string; p_user_id: string }
        Returns: undefined
      }
      admin_bonus_codes: {
        Args: never
        Returns: {
          active: boolean
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number
          uses: number
        }[]
        SetofOptions: {
          from: "*"
          to: "bonus_codes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_delete_bonus_code: { Args: { p_id: string }; Returns: undefined }
      admin_delete_product: { Args: { p_id: string }; Returns: undefined }
      admin_delete_product_type: {
        Args: { p_slug: string }
        Returns: undefined
      }
      admin_delete_wheel_prize: { Args: { p_id: string }; Returns: undefined }
      admin_grant_investment: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_overview: {
        Args: never
        Returns: {
          pending_deposits: number
          pending_withdrawals: number
          profit: number
          total_balance: number
          total_deposits: number
          total_invested: number
          total_withdrawals: number
          users_count: number
        }[]
      }
      admin_remove_investment: {
        Args: { p_investment_id: string }
        Returns: undefined
      }
      admin_set_product_active: {
        Args: { p_active: boolean; p_product_id: string }
        Returns: undefined
      }
      admin_set_transaction_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_transactions: {
        Args: { p_status?: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          kind: string
          method: string
          note: string
          phone: string
          status: string
          user_id: string
          user_phone: string
        }[]
      }
      admin_update_financial_settings: {
        Args: { p_settings: Json }
        Returns: undefined
      }
      admin_update_site_settings: {
        Args: {
          p_announcement: string
          p_payment_url: string
          p_popup_enabled: boolean
          p_popup_message: string
          p_popup_title: string
          p_support_url: string
          p_telegram_url: string
          p_whatsapp_url: string
        }
        Returns: undefined
      }
      admin_update_wheel_settings: {
        Args: {
          p_active: boolean
          p_daily_spins: number
          p_difficulty: number
          p_spin_cost: number
        }
        Returns: undefined
      }
      admin_upsert_bonus_code: {
        Args: {
          p_active: boolean
          p_amount: number
          p_code: string
          p_expires_at: string
          p_id: string
          p_max_uses: number
        }
        Returns: undefined
      }
      admin_upsert_product: {
        Args: {
          p_active: boolean
          p_category: string
          p_daily_return: number
          p_description: string
          p_duration_days: number
          p_id: string
          p_image_url: string
          p_name: string
          p_price: number
          p_rank: number
        }
        Returns: string
      }
      admin_upsert_product_type: {
        Args: { p_label: string; p_slug: string; p_sort_order: number }
        Returns: undefined
      }
      admin_upsert_wheel_prize: {
        Args: {
          p_active: boolean
          p_amount: number
          p_id: string
          p_label: string
          p_weight: number
        }
        Returns: undefined
      }
      admin_user_investments: {
        Args: { p_user_id: string }
        Returns: {
          active: boolean
          created_at: string
          daily_return: number
          days_paid: number
          duration_days: number
          id: string
          price: number
          product_name: string
        }[]
      }
      admin_user_referrals: {
        Args: { p_user_id: string }
        Returns: {
          balance: number
          created_at: string
          has_invested: boolean
          id: string
          level: number
          phone: string
        }[]
      }
      admin_users: {
        Args: { p_search?: string }
        Returns: {
          balance: number
          country: string
          created_at: string
          has_invested: boolean
          id: string
          invite_code: string
          is_admin: boolean
          phone: string
          referral_earned: number
          total_earned: number
        }[]
      }
      admin_wheel_prizes: {
        Args: never
        Returns: {
          active: boolean
          amount: number
          created_at: string
          id: string
          label: string
          weight: number
        }[]
        SetofOptions: {
          from: "*"
          to: "wheel_prizes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_daily_bonus: { Args: never; Returns: undefined }
      create_deposit: {
        Args: { p_amount: number; p_method: string; p_phone: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      purchase_product: { Args: { p_product_id: string }; Returns: undefined }
      redeem_bonus_code: { Args: { p_code: string }; Returns: number }
      referral_details: {
        Args: never
        Returns: {
          country: string
          level: number
          phone: string
          total_invested: number
          total_withdrawn: number
          user_id: string
        }[]
      }
      referral_stats: {
        Args: never
        Returns: {
          level1: number
          level2: number
          level3: number
        }[]
      }
      request_withdrawal: {
        Args: { p_amount: number; p_method: string; p_phone: string }
        Returns: undefined
      }
      spin_wheel: {
        Args: never
        Returns: {
          amount: number
          label: string
          prize_id: string
        }[]
      }
      sync_earnings: { Args: never; Returns: undefined }
      wheel_status: {
        Args: never
        Returns: {
          active: boolean
          daily_spins: number
          spin_cost: number
          spins_left: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
