import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Gift, TrendingUp, Wallet, History, HandCoins, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { WelcomePopup } from "@/components/WelcomePopup";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useInvestments, useProfile, useTransactions } from "@/hooks/useAccount";
import { DAILY_BONUS, TX_LABELS, STATUS_LABELS, formatFcfa } from "@/lib/wendys";
import facadeCity from "@/assets/wendys-facade-city.jpg.asset.json";
import facadeSign from "@/assets/wendys-facade-sign.jpg.asset.json";

export const Route = createFileRoute("/accueil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon compte — Wendy's Invest" },
      { name: "description", content: "Solde, revenus quotidiens et bonus de votre compte Wendy's." },
      { property: "og:title", content: "Mon compte — Wendy's Invest" },
      { property: "og:description", content: "Suivez votre solde et vos revenus quotidiens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const { data: profile } = useProfile();
  const { data: investments } = useInvestments();
  const { data: transactions } = useTransactions(true, 8);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const bonusClaimed = profile?.last_bonus_date === today;
  const dailyIncome = (investments ?? [])
    .filter((i) => i.active)
    .reduce((sum, i) => sum + Number(i.daily_return), 0);

  async function claimBonus() {
    setBusy(true);
    const { error } = await supabase.rpc("claim_daily_bonus");
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Bonus de ${formatFcfa(DAILY_BONUS)} ajouté !`);
    queryClient.invalidateQueries();
  }

  return (
    <AppShell title="Tableau de bord">
      <WelcomePopup />
      <section className="brand-gradient rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-card)]">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80">
          <Wallet className="h-4 w-4" /> Solde disponible
        </p>
        <p className="mt-1 font-display text-4xl">{formatFcfa(profile?.balance)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Link
            to="/depot"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-foreground/15 py-2.5 font-semibold backdrop-blur"
          >
            <ArrowDownToLine className="h-4 w-4" /> Dépôt
          </Link>
          <Link
            to="/retrait"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-foreground/15 py-2.5 font-semibold backdrop-blur"
          >
            <ArrowUpFromLine className="h-4 w-4" /> Retrait
          </Link>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2" aria-label="Photos Wendy's">
        <img src={facadeCity.url} alt="Façade Wendy's en ville" loading="lazy" decoding="async" width={735} height={489} className="aspect-[4/3] w-full rounded-lg object-cover" />
        <img src={facadeSign.url} alt="Restaurant et enseigne Wendy's" loading="lazy" decoding="async" width={735} height={551} className="aspect-[4/3] w-full rounded-lg object-cover" />
      </section>

      <p className="mt-4 text-center font-handwritten text-4xl text-primary">Bienvenue chez Wendy's</p>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">Revenu par jour</p>
          <p className="font-display text-xl text-primary">{formatFcfa(dailyIncome)}</p>
        </div>
        <div className="card-soft p-4">
          <p className="text-xs text-muted-foreground">Total gagné</p>
          <p className="font-display text-xl text-primary">{formatFcfa(profile?.total_earned)}</p>
        </div>
      </section>

      <section className="card-soft mt-4 flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Bonus quotidien</p>
          <p className="text-xs text-muted-foreground">{formatFcfa(DAILY_BONUS)} chaque jour</p>
        </div>
        <Button size="sm" disabled={busy || bonusClaimed} onClick={claimBonus}>
          {bonusClaimed ? "Reçu" : "Réclamer"}
        </Button>
      </section>

      <Link to="/roue" className="card-soft mt-3 flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Roue de la chance & codes bonus</p>
          <p className="text-xs text-muted-foreground">Tentez votre chance chaque jour</p>
        </div>
        <span className="text-sm font-semibold text-primary">Jouer</span>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/historique-fonds" className="flex items-center gap-2 border-b border-border py-3 text-sm font-semibold text-primary"><HandCoins className="h-5 w-5 shrink-0" /> Historique des fonds</Link>
        <Link to="/historique-parrainages" className="flex items-center gap-2 border-b border-border py-3 text-sm font-semibold text-primary"><Users className="h-5 w-5 shrink-0" /> Parrainages</Link>
        <Link to="/mes-produits" className="col-span-2 flex items-center gap-2 border-b border-border py-3 text-sm font-semibold text-primary"><TrendingUp className="h-5 w-5 shrink-0" /> Mes produits achetés</Link>
      </div>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" /> Mes produits actifs
        </h2>
        {(investments ?? []).length === 0 ? (
          <div className="card-soft p-4 text-sm text-muted-foreground">
            Aucun produit acheté.{" "}
            <Link to="/produits" className="font-semibold text-primary">
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {(investments ?? []).map((inv) => (
              <div key={inv.id} className="card-soft flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">
                    {(inv.products as { name?: string } | null)?.name ?? "Produit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.days_paid}/{inv.duration_days} jours · {formatFcfa(inv.daily_return)}/jour
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    inv.active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {inv.active ? "Actif" : "Terminé"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" /> Dernières opérations
        </h2>
        <div className="card-soft divide-y divide-border">
          {(transactions ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucune opération.</p>
          )}
          {(transactions ?? []).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3.5 text-sm">
              <div>
                <p className="font-semibold">{TX_LABELS[tx.kind] ?? tx.kind}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString("fr-FR")}
                  {tx.status !== "completed" && ` · ${STATUS_LABELS[tx.status] ?? tx.status}`}
                </p>
              </div>
              <span
                className={
                  tx.kind === "withdrawal" || tx.kind === "purchase"
                    ? "font-semibold text-muted-foreground"
                    : "font-semibold text-success"
                }
              >
                {tx.kind === "withdrawal" || tx.kind === "purchase" ? "-" : "+"}
                {formatFcfa(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
