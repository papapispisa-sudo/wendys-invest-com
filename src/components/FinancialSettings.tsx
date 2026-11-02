import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinanceSettings } from "@/hooks/useSiteSettings";
import { DEFAULT_FINANCE, financeSchema, type FinanceSettings } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";

const fields: [keyof FinanceSettings, string][] = [
  ["min_deposit", "Dépôt minimum (FCFA)"], ["min_withdrawal", "Retrait minimum (FCFA)"],
  ["withdrawal_start_hour", "Ouverture des retraits (heure GMT)"], ["withdrawal_end_hour", "Fermeture des retraits (heure GMT)"],
  ["signup_bonus", "Bonus d'inscription (FCFA)"], ["daily_bonus", "Bonus quotidien (FCFA)"],
  ["referral_rate_1", "Commission niveau 1 (%)"], ["referral_rate_2", "Commission niveau 2 (%)"], ["referral_rate_3", "Commission niveau 3 (%)"],
];

export function FinancialSettings() {
  const { data, isError } = useFinanceSettings();
  const [form, setForm] = useState<Record<keyof FinanceSettings, string>>(() => Object.fromEntries(fields.map(([key]) => [key, String(DEFAULT_FINANCE[key])])) as Record<keyof FinanceSettings, string>);
  const [busy, setBusy] = useState(false);
  const initialized = useRef(false);
  const qc = useQueryClient();
  useEffect(() => {
    if (data && !initialized.current) {
      setForm(Object.fromEntries(fields.map(([key]) => [key, String(data[key])])) as Record<keyof FinanceSettings, string>);
      initialized.current = true;
    }
  }, [data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (fields.some(([key]) => form[key].trim() === "")) { toast.error("Remplissez tous les montants et horaires."); return; }
    const result = financeSchema.safeParse(Object.fromEntries(fields.map(([key]) => [key, Number(form[key])])));
    if (!result.success) { toast.error(result.error.issues[0]?.message ?? "Valeurs invalides"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_update_financial_settings", { p_settings: result.data });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["site_settings"] });
      toast.success("Réglages financiers appliqués");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-4 border-t border-border pt-5">
    <h3 className="font-bold">Réglages financiers</h3>
    <p className="text-sm text-muted-foreground">Les nouveaux montants s'appliquent aux prochaines opérations. Les gains déjà versés restent inchangés.</p>
    <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input type="number" step={key.startsWith("referral") ? "0.01" : "1"} min="0" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </label>)}</div>
    {isError && <p className="text-sm text-destructive">Réglages indisponibles. Réessayez avant d'enregistrer.</p>}
    <Button disabled={busy || !data || isError} type="submit" className="w-full">{busy ? "Enregistrement..." : "Appliquer les réglages financiers"}</Button>
  </form>;
}