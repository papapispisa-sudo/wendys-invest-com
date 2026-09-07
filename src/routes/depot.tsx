import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAccount";
import { COUNTRIES, MIN_DEPOSIT, formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/depot")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dépôt Mobile Money — Wendy's" },
      { name: "description", content: "Rechargez votre compte Wendy's dès 2000 FCFA par Mobile Money." },
      { property: "og:title", content: "Dépôt Mobile Money — Wendy's" },
      { property: "og:description", content: "MTN, WAVE, Orange, MOOV, TMONEY et YAS acceptés." },
    ],
  }),
  component: Depot,
});

function Depot() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const country = COUNTRIES.find((c) => c.code === profile?.country) ?? COUNTRIES[0]!;
  const [amount, setAmount] = useState("2000");
  const [method, setMethod] = useState(country.operators[0]!);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < MIN_DEPOSIT) {
      toast.error(`Le dépôt minimum est de ${formatFcfa(MIN_DEPOSIT)}`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("create_deposit", {
      p_amount: value,
      p_method: method,
      p_phone: phone,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries();
    toast.success("Demande de dépôt enregistrée. Suivez les instructions de paiement.");
    navigate({ to: "/accueil" });
  }

  return (
    <AppShell title="Dépôt">
      <button
        onClick={() => navigate({ to: "/accueil" })}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <form onSubmit={submit} className="card-soft space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Montant (FCFA)</Label>
          <Input
            id="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Minimum {formatFcfa(MIN_DEPOSIT)}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Moyen de paiement</Label>
          <div className="grid grid-cols-3 gap-2">
            {country.operators.map((op) => (
              <button
                type="button"
                key={op}
                onClick={() => setMethod(op)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  method === op
                    ? "border-primary bg-accent text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {country.flag} {country.name}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dphone">Numéro à débiter</Label>
          <Input
            id="dphone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Le paiement automatique par Mobile Money sera activé dès que votre compte marchand sera
            relié. En attendant, votre demande est enregistrée et validée après réception.
          </p>
        </div>

        <Button type="submit" disabled={busy} className="h-12 w-full font-bold">
          {busy ? "Envoi..." : "Valider le dépôt"}
        </Button>
      </form>
    </AppShell>
  );
}
