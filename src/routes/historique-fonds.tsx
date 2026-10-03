import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HandCoins } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useTransactions } from "@/hooks/useAccount";
import { STATUS_LABELS, TX_LABELS, formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/historique-fonds")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Historique des fonds — Wendy's" },
    { name: "description", content: "Consultez vos dépôts et retraits Wendy's." },
    { property: "og:title", content: "Historique des fonds — Wendy's" },
    { property: "og:description", content: "Vos dépôts et retraits, avec leur statut." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: HistoriqueFonds,
});

function HistoriqueFonds() {
  const { data, isPending, isError } = useTransactions(true, 100);
  const rows = (data ?? []).filter((tx) => tx.kind === "deposit" || tx.kind === "withdrawal");
  return <AppShell title="Historique des fonds">
    <Link to="/parametres" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
    <h1 className="mb-3 flex items-center gap-2 text-xl"><HandCoins className="h-6 w-6 text-primary" /> Historique des fonds</h1>
    {isPending ? <p className="text-sm text-muted-foreground">Chargement…</p> : isError ? <p className="text-sm text-destructive">Impossible de charger l’historique.</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Aucun dépôt ou retrait pour le moment.</p> :
      <div className="divide-y divide-border border-y border-border">{rows.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-3 py-4 text-sm">
        <div><p className="font-semibold">{TX_LABELS[tx.kind]}</p><p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString("fr-FR")} · {STATUS_LABELS[tx.status] ?? tx.status}{tx.method ? ` · ${tx.method}` : ""}</p></div>
        <span className={`shrink-0 font-semibold ${tx.kind === "withdrawal" ? "text-muted-foreground" : "text-success"}`}>{tx.kind === "withdrawal" ? "−" : "+"}{formatFcfa(tx.amount)}</span>
      </div>)}</div>}
  </AppShell>;
}