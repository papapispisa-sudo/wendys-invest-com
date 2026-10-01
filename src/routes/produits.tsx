import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useProfile } from "@/hooks/useAccount";
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
        {(products ?? []).map((p, i) => {
          const total = Number(p.daily_return) * p.duration_days;
          return (
            <article key={p.id} className="card-soft overflow-hidden">
              <div className="brand-gradient flex items-center justify-between px-4 py-2.5 text-primary-foreground">
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.image_url || PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]}
                    alt=""
                    width={36}
                    height={36}
                    decoding="async"
                    className="h-9 w-9 rounded-full border-2 border-white/70 object-cover"
                    loading="lazy"
                  />

                  <p className="font-display text-lg">{p.name}</p>
                </div>
                <p className="text-sm font-semibold">{formatFcfa(p.price)}</p>
              </div>
              {p.description && (
                <p className="px-4 pt-3 text-xs text-muted-foreground">{p.description}</p>
              )}
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
