import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useProfile } from "@/hooks/useAccount";
import { formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/produits")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Produits d'investissement — Wendy's" },
      {
        name: "description",
        content: "10 produits Wendy's de 2000 à 500 000 FCFA avec revenu quotidien pendant 45 jours.",
      },
      { property: "og:title", content: "Produits d'investissement — Wendy's" },
      { property: "og:description", content: "Choisissez votre produit et gagnez chaque jour." },
    ],
  }),
  component: Produits,
});

function Produits() {
  const { data: products } = useProducts();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  async function buy(id: string, name: string) {
    setPending(id);
    const { error } = await supabase.rpc("purchase_product", { p_product_id: id });
    setPending(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} acheté ! Vos revenus démarrent aujourd'hui.`);
    queryClient.invalidateQueries();
  }

  return (
    <AppShell title="Produits">
      <p className="mb-3 text-sm text-muted-foreground">
        Solde : <span className="font-semibold text-primary">{formatFcfa(profile?.balance)}</span>
      </p>

      <div className="space-y-3">
        {(products ?? []).map((p) => {
          const total = Number(p.daily_return) * p.duration_days;
          return (
            <article key={p.id} className="card-soft overflow-hidden">
              <div className="brand-gradient flex items-center justify-between px-4 py-2.5 text-primary-foreground">
                <p className="font-display text-lg">{p.name}</p>
                <p className="text-sm font-semibold">{formatFcfa(p.price)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">Par jour</p>
                  <p className="font-display text-base text-primary">{formatFcfa(p.daily_return)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Durée</p>
                  <p className="font-display text-base text-primary">{p.duration_days} j</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-display text-base text-primary">{formatFcfa(total)}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Button
                  className="h-11 w-full font-bold"
                  disabled={pending === p.id}
                  onClick={() => buy(p.id, p.name)}
                >
                  {pending === p.id ? "Achat..." : "Acheter"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
