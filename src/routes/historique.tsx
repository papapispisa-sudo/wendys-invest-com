import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useTransactions } from "@/hooks/useAccount";
import { STATUS_LABELS, TX_LABELS, formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/historique")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Historique — Wendy's" },
      { name: "description", content: "Toutes vos opérations Wendy's : dépôts, retraits, gains et bonus." },
      { property: "og:title", content: "Historique — Wendy's" },
      { property: "og:description", content: "Consultez le détail de vos opérations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historique,
});

function Historique() {
  const { data: transactions } = useTransactions(true, 100);
  const navigate = useNavigate();

  return (
    <AppShell title="Historique">
      <button
        onClick={() => navigate({ to: "/parametres" })}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="card-soft divide-y divide-border">
        {(transactions ?? []).length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Aucune opération pour le moment.</p>
        )}
        {(transactions ?? []).map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3.5 text-sm">
            <div>
              <p className="font-semibold">{TX_LABELS[tx.kind] ?? tx.kind}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(tx.created_at).toLocaleString("fr-FR")}
                {tx.method ? ` · ${tx.method}` : ""}
                {tx.status !== "completed" ? ` · ${STATUS_LABELS[tx.status] ?? tx.status}` : ""}
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
    </AppShell>
  );
}
