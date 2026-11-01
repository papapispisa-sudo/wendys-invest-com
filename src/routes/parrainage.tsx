import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Share2, Users, History } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProfile, useReferralStats, useReferralDetails } from "@/hooks/useAccount";
import { formatFcfa, countryByCode } from "@/lib/wendys";
import { useFinanceSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/parrainage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Parrainage — Wendy's" },
      {
        name: "description",
        content: "Suivez vos filleuls Wendy's, leurs investissements et vos commissions sur trois niveaux.",
      },
      { property: "og:title", content: "Parrainage — Wendy's" },
      { property: "og:description", content: "Invitez vos amis et gagnez sur 3 niveaux." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Parrainage,
});

function Parrainage() {
  const { settings } = useFinanceSettings();
  const { data: referrals, isPending, isError, refetch } = useReferralDetails();
  const { data: profile } = useProfile();
  const { data: stats } = useReferralStats();

  const link =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/?ref=${profile.invite_code}`
      : "";

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié !");
    } catch {
      toast.error("Copie impossible");
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Wendy's Invest", url: link });
    } else {
      copy(link);
    }
  }

  return (
    <AppShell title="Parrainage">
      <section className="brand-gradient rounded-2xl p-5 text-primary-foreground">
        <p className="text-xs uppercase opacity-80">Gains de parrainage</p>
        <p className="mt-1 font-display text-3xl">{formatFcfa(profile?.referral_earned)}</p>
        <p className="mt-2 text-xs opacity-90">
          Les commissions sont versées automatiquement dès qu'un filleul achète un produit.
        </p>
      </section>

      <section className="card-soft mt-4 p-4">
        <p className="text-xs text-muted-foreground">Mon code d'invitation</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-display text-2xl tracking-widest text-primary">
            {profile?.invite_code ?? "—"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => copy(profile?.invite_code ?? "")}
            className="gap-1"
          >
            <Copy className="h-4 w-4" /> Copier
          </Button>
        </div>
        <div className="mt-3 rounded-lg bg-muted p-2 text-xs break-all text-muted-foreground">
          {link}
        </div>
        <Button className="mt-3 h-11 w-full gap-2 font-bold" onClick={share}>
          <Share2 className="h-4 w-4" /> Partager mon lien
        </Button>
      </section>

      <section className="mt-4 space-y-3">
        {[
          { level: "Niveau 1", rate: `${settings.referral_rate_1} %`, count: stats?.level1 ?? 0 },
          { level: "Niveau 2", rate: `${settings.referral_rate_2} %`, count: stats?.level2 ?? 0 },
          { level: "Niveau 3", rate: `${settings.referral_rate_3} %`, count: stats?.level3 ?? 0 },
        ].map((row) => (
          <div key={row.level} className="card-soft flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{row.level}</p>
              <p className="text-xs text-muted-foreground">Commission {row.rate}</p>
            </div>
            <p className="font-display text-xl text-primary">{row.count}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 space-y-3">
        <h2 className="font-bold">Mes filleuls</h2>
        {isPending && <p className="text-sm text-muted-foreground">Chargement des filleuls...</p>}
        {isError && <div className="text-sm text-destructive">Impossible de charger les filleuls. <Button variant="outline" size="sm" onClick={() => refetch()}>Réessayer</Button></div>}
        {!isPending && !isError && !referrals?.length && <p className="text-sm text-muted-foreground">Aucun filleul pour le moment.</p>}
        {referrals?.map((r) => {
          const country = countryByCode(r.country);
          return <article key={r.user_id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{r.phone || "Numéro indisponible"}</p><span className="text-xs text-primary">Niveau {r.level}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">{country?.flag} {country?.name ?? r.country}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Total investi</dt><dd className="font-semibold">{formatFcfa(r.total_invested)}</dd></div>
              <div><dt className="text-muted-foreground">Retraits cumulés validés</dt><dd className="font-semibold">{formatFcfa(r.total_withdrawn)}</dd></div>
            </dl>
          </article>;
        })}
      </section>
      <Link to="/historique-parrainages" className="card-soft mt-4 flex items-center gap-3 p-4 font-semibold text-primary">
        <History className="h-5 w-5" /> Historique des parrainages
      </Link>
    </AppShell>
  );
}
