import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) return false;
      return data === true;
    },
  });
}

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: ["admin-overview"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? null;
    },
  });
}

export function useAdminUsers(search: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-users", search],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_users", { p_search: search });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminTransactions(status: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-transactions", status],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_transactions", { p_status: status });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllProducts(enabled = true) {
  return useQuery({
    queryKey: ["admin-products"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("rank");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProductTypes() {
  return useQuery({
    queryKey: ["product-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_types")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminUserReferrals(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-referrals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_referrals", { p_user_id: userId! });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminUserInvestments(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-investments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_investments", { p_user_id: userId! });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminWheelPrizes(enabled = true) {
  return useQuery({
    queryKey: ["admin-wheel-prizes"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_wheel_prizes");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWheelSettings() {
  return useQuery({
    queryKey: ["wheel-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wheel_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminBonusCodes(enabled = true) {
  return useQuery({
    queryKey: ["admin-bonus-codes"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_bonus_codes");
      if (error) throw error;
      return data ?? [];
    },
  });
}
