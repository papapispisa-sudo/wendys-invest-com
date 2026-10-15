import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useProfile, useInvestments } from "@/hooks/useAccount";
import { formatFcfa } from "@/lib/wendys";
import store1 from "@/assets/wendys-store-1.jpg.asset.json";
import store2 from "@/assets/wendys-store-2.jpg.asset.json";
import store3 from "@/assets/wendys-store-3.jpg.asset.json";
import store4 from "@/assets/wendys-store-4.jpg.asset.json";
import store5 from "@/assets/wendys-store-5.jpg.asset.json";
import store6 from "@/assets/wendys-store-6.jpg.asset.json";

const PRODUCT_IMAGES = [store1.url, store2.url, store3.url, store4.url, store5.url, store6.url];

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Produits,
});

function Produits() {
  const { data: products } = useProducts();
  const { data: profile } = useProfile();
  const { data: investments } = useInvestments();
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Solde : <span className="font-semibold text-primary">{formatFcfa(profile?.balance)}</span>
        </p>
        <Link
          to="/mes-produits"
          className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <TrendingUp className="h-4 w-4" /> Mes produits achetés
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Chaque produit peut être acheté 2 fois maximum.
      </p>

      <div className="space-y-4">
        {(products ?? []).map((p, i) => {
          const total = Number(p.daily_return) * p.duration_days;
          const bought = (investments ?? []).filter((inv) => inv.product_id === p.id).length;
          const maxed = bought >= 2;
          return (
            <article key={p.id} className="card-soft overflow-hidden">
              <img
                src={p.image_url || PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]}
                alt={p.name}
                width={800}
                height={800}
                decoding="async"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg">{p.name}</p>
                  {bought > 0 && (
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                      Acheté {bought}/2
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-accent/60 p-2">
                    <p className="text-muted-foreground">Prix</p>
                    <p className="font-display text-sm text-primary">{formatFcfa(p.price)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/60 p-2">
                    <p className="text-muted-foreground">Revenu / jour</p>
                    <p className="font-display text-sm text-primary">{formatFcfa(p.daily_return)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/60 p-2">
                    <p className="text-muted-foreground">Durée</p>
                    <p className="font-display text-sm text-primary">{p.duration_days} j</p>
                  </div>
                  <div className="rounded-lg bg-accent/60 p-2">
                    <p className="text-muted-foreground">Fin de cycle</p>
                    <p className="font-display text-sm text-primary">{formatFcfa(total)}</p>
                  </div>
                </div>
                <Button
                  className="mt-3 h-11 w-full font-bold"
                  disabled={pending === p.id || maxed}
                  onClick={() => buy(p.id, p.name)}
                >
                  {maxed
                    ? "Maximum 2 achats atteint"
                    : pending === p.id
                      ? "Achat..."
                      : "Acheter"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
