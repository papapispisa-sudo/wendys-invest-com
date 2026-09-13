import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, History, LogOut, Phone, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useAccount";
import { COUNTRIES, MIN_DEPOSIT, MIN_WITHDRAWAL, formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/parametres")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Paramètres — Wendy's" },
      { name: "description", content: "Vos informations de compte et règles de dépôt et retrait Wendy's." },
      { property: "og:title", content: "Paramètres — Wendy's" },
      { property: "og:description", content: "Gérez votre compte Wendy's." },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const { data: profile } = useProfile();
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
          <span className="text-xs text-muted-foreground">min. {formatFcfa(MIN_DEPOSIT)}</span>
        </Link>
        <Link to="/retrait" className="card-soft flex items-center gap-3 p-4">
          <Clock className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Demander un retrait</span>
          <span className="text-xs text-muted-foreground">min. {formatFcfa(MIN_WITHDRAWAL)}</span>
        </Link>
        <Link to="/historique" className="card-soft flex items-center gap-3 p-4">
          <History className="h-5 w-5 text-primary" />
          <span className="flex-1 font-semibold">Historique complet</span>
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
        <p>• Dépôt minimum : {formatFcfa(MIN_DEPOSIT)}</p>
        <p>• Retrait minimum : {formatFcfa(MIN_WITHDRAWAL)}, de 11H à 18H GMT</p>
        <p>• Le retrait est possible après l'achat d'un produit</p>
        <p>• Parrainage : 30 % niveau 1, 3 % niveau 2, 2 % niveau 3</p>
      </section>

      <Button variant="outline" className="mt-4 h-11 w-full gap-2" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Se déconnecter
      </Button>
    </AppShell>
  );
}
