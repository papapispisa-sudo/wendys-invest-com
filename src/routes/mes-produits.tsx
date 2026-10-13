import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useInvestments, useSession } from "@/hooks/useAccount";
import { formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/mes-produits")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes produits achetés — Wendy's" },
      { name: "description", content: "Retrouvez tous les produits Wendy's que vous avez achetés et leurs revenus." },
      { property: "og:title", content: "Mes produits achetés — Wendy's" },
      { property: "og:description", content: "Suivi de vos produits et revenus quotidiens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MesProduits,
});

function MesProduits() {
  const { data: session } = useSession();
  const { data: list, isLoading } = useInvestments(!!session);
  return (
    <AppShell title="Mes produits">
      <h1 className="mb-3 flex items-center gap-2 font-display text-xl">
        <Package className="h-5 w-5 text-primary" /> Produits achetés
      </h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (list ?? []).length === 0 ? (
        <div className="card-soft p-4 text-sm text-muted-foreground">Vous n'avez encore acheté aucun produit.</div>
      ) : (
        <div className="space-y-3">
          {(list ?? []).map((i) => {
            const pct = Math.min(100, Math.round((i.days_paid / i.duration_days) * 100));
            const name = (i.products as { name?: string } | null)?.name ?? "Produit";
            return (
              <div key={i.id} className="card-soft p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{name}</span>
                  <span className={`text-xs font-semibold ${i.active ? "text-success" : "text-muted-foreground"}`}>
                    {i.active ? "En cours" : "Terminé"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Prix</p><p className="font-bold">{formatFcfa(i.price)}</p></div>
                  <div><p className="text-muted-foreground">Par jour</p><p className="font-bold text-primary">{formatFcfa(i.daily_return)}</p></div>
                  <div><p className="text-muted-foreground">Gagné</p><p className="font-bold">{formatFcfa(i.daily_return * i.days_paid)}</p></div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Jour {i.days_paid}/{i.duration_days} · acheté le {new Date(i.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
