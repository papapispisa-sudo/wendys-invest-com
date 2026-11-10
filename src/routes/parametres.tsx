import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, History, LogOut, Phone, ShieldCheck, Wallet, HandCoins, Users, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAccount";
import { useIsAdmin } from "@/hooks/useAdmin";
import { COUNTRIES, formatFcfa } from "@/lib/wendys";
import { useFinanceSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/parametres")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Paramètres — Wendy's" },
      { name: "description", content: "Vos informations de compte et règles de dépôt et retrait Wendy's." },
      { property: "og:title", content: "Paramètres — Wendy's" },
      { property: "og:description", content: "Gérez votre compte Wendy's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const { settings } = useFinanceSettings();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const country = COUNTRIES.find((c) => c.code === profile?.country);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <AppShell title="Paramètres">
      <section className="card-soft p-4">
        <div className="flex items-center gap-3">
          <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-full font-display text-lg text-primary-foreground">
            {profile?.invite_code?.slice(0, 2) ?? "W"}
          </div>
          <div>
            <p className="flex items-center gap-1 font-semibold">
              <Phone className="h-4 w-4 text-primary" /> {profile?.phone ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {country ? `${country.flag} ${country.name}` : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-muted p-3">
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className="font-display text-lg text-primary">{formatFcfa(profile?.balance)}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-xs text-muted-foreground">Total gagné</p>
            <p className="font-display text-lg text-primary">{formatFcfa(profile?.total_earned)}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-2">
        <Link to="/depot" className="card-soft flex items-center gap-3 p-4">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Effectuer un dépôt</span>
          <span className="text-xs text-muted-foreground">min. {formatFcfa(settings.min_deposit)}</span>
        </Link>
        <Link to="/retrait" className="card-soft flex items-center gap-3 p-4">
          <Clock className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Demander un retrait</span>
          <span className="text-xs text-muted-foreground">min. {formatFcfa(settings.min_withdrawal)}</span>
        </Link>
        <Link to="/historique" className="card-soft flex items-center gap-3 p-4">
          <History className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Historique complet</span>
        </Link>
        <Link to="/historique-fonds" className="card-soft flex items-center gap-3 p-4">
          <HandCoins className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Historique des fonds</span>
        </Link>
        <Link to="/historique-parrainages" className="card-soft flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Historique des parrainages</span>
        </Link>
        <Link to="/service-client" className="card-soft flex items-center gap-3 p-4">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Service client</span>
        </Link>
        {isAdmin && (
          <Link to="/admin" className="card-soft flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="flex-1 font-semibold">Espace administrateur</span>
          </Link>
        )}
      </section>

      <section className="card-soft mt-4 space-y-2 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Règles de la plateforme
        </p>
        <p>• Dépôt minimum : {formatFcfa(settings.min_deposit)}</p>
        <p>• Retrait minimum : {formatFcfa(settings.min_withdrawal)}, de {settings.withdrawal_start_hour}H à {settings.withdrawal_end_hour}H GMT</p>
        <p>• Le retrait est possible après l'achat d'un produit</p>
        <p>• Parrainage : {settings.referral_rate_1} % niveau 1, {settings.referral_rate_2} % niveau 2, {settings.referral_rate_3} % niveau 3</p>
      </section>

      <Button variant="outline" className="mt-4 h-11 w-full gap-2" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Se déconnecter
      </Button>
    </AppShell>
  );
}
