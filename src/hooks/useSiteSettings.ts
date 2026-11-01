import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_FINANCE, type FinanceSettings } from "@/lib/finance";

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFinanceSettings() {
  const query = useSiteSettings();
  const settings: FinanceSettings = { ...DEFAULT_FINANCE, ...(query.data ?? {}) };
  return { ...query, settings };
}
