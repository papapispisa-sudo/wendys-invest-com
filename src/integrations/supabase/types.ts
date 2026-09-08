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
      products: {
        Row: {
          active: boolean
          created_at: string
          daily_return: number
          duration_days: number
          id: string
          name: string
          price: number
          rank: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          daily_return: number
          duration_days?: number
          id?: string
          name: string
          price: number
          rank: number
        }
        Update: {
          active?: boolean
          created_at?: string
          daily_return?: number
          duration_days?: number
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_funds: {
        Args: { p_amount: number; p_note?: string; p_user_id: string }
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
      sync_earnings: { Args: never; Returns: undefined }
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
