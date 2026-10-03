import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAccount";
import { COUNTRIES, MIN_WITHDRAWAL, formatFcfa, withdrawalWindowOpen } from "@/lib/wendys";

export const Route = createFileRoute("/retrait")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Retrait — Wendy's" },
      {
        name: "description",
        content: "Retirez vos gains Wendy's dès 1000 FCFA, de 10H à 17H GMT, par Mobile Money.",
      },
      { property: "og:title", content: "Retrait — Wendy's" },
      { property: "og:description", content: "Retrait rapide sur votre Mobile Money." },
    ],
  }),
  component: Retrait,
});

function Retrait() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const country = COUNTRIES.find((c) => c.code === profile?.country) ?? COUNTRIES[0]!;
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState(country.operators[0]!);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const open = withdrawalWindowOpen();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < MIN_WITHDRAWAL) {
      toast.error(`Le retrait minimum est de ${formatFcfa(MIN_WITHDRAWAL)}`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
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
    toast.success("Demande de retrait envoyée.");
    navigate({ to: "/accueil" });
  }

  return (
    <AppShell title="Retrait">
      <button
        onClick={() => navigate({ to: "/accueil" })}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="card-soft mb-3 flex items-center gap-3 p-4">
        <Clock className={`h-5 w-5 ${open ? "text-success" : "text-primary"}`} />
        <p className="text-sm">
          {open ? "Guichet ouvert" : "Guichet fermé"} — retraits de{" "}
          <span className="font-semibold">10H à 17H GMT</span>
        </p>
      </div>

      {!profile?.has_invested && (
        <div className="card-soft mb-3 p-4 text-sm text-muted-foreground">
          Vous devez acheter un produit avant de pouvoir retirer.
        </div>
      )}

      <form onSubmit={submit} className="card-soft space-y-4 p-5">
        <p className="text-sm text-muted-foreground">
          Solde disponible :{" "}
          <span className="font-semibold text-primary">{formatFcfa(profile?.balance)}</span>
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Montant (FCFA)</Label>
          <Input
            id="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Minimum {formatFcfa(MIN_WITHDRAWAL)}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Recevoir sur</Label>
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wphone">Numéro à créditer</Label>
          <Input
            id="wphone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={busy || !open || !profile?.has_invested}
          className="h-12 w-full font-bold"
        >
          {busy ? "Envoi..." : "Demander le retrait"}
        </Button>
      </form>
    </AppShell>
  );
}
