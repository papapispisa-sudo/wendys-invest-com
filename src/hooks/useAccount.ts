import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  phone: string;
  country: string;
  invite_code: string;
  referred_by: string | null;
  balance: number;
  total_earned: number;
  referral_earned: number;
  has_invested: boolean;
  last_bonus_date: string | null;
  created_at: string;
};

export function useSession() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return { userId, loading: userId === undefined };
}

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ["profile"],
    enabled,
    queryFn: async () => {
      await supabase.rpc("sync_earnings");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("rank");
      if (error) throw error;
      return data;
    },
  });
}

export function useInvestments(enabled = true) {
  return useQuery({
    queryKey: ["investments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, products(name, rank)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTransactions(enabled = true, limit = 30) {
  return useQuery({
    queryKey: ["transactions", limit],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useReferralStats(enabled = true) {
  return useQuery({
    queryKey: ["referral-stats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("referral_stats");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? { level1: 0, level2: 0, level3: 0 }) as {
        level1: number;
        level2: number;
        level3: number;
      };
    },
  });
}
