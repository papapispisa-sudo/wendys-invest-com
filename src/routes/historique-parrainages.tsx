import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useTransactionsByKind } from "@/hooks/useAccount";
import { formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/historique-parrainages")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Historique des parrainages — Wendy's" },
    { name: "description", content: "Consultez vos commissions de parrainage Wendy's." },
    { property: "og:title", content: "Historique des parrainages — Wendy's" },
    { property: "og:description", content: "Vos commissions sur trois niveaux de parrainage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: HistoriqueParrainages,
});

function HistoriqueParrainages() {
  const { data, isPending, isError } = useTransactionsByKind("referral");
  const rows = data ?? [];
  return <AppShell title="Historique des parrainages">
    <Link to="/parrainage" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
    <h1 className="mb-3 flex items-center gap-2 text-xl"><Users className="h-6 w-6 text-primary" /> Historique des parrainages</h1>
    {isPending ? <p className="text-sm text-muted-foreground">Chargement…</p> : isError ? <p className="text-sm text-destructive">Impossible de charger l’historique.</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Aucune commission de parrainage pour le moment.</p> :
      <div className="divide-y divide-border border-y border-border">{rows.map((tx) => <div key={tx.id} className="flex items-center justify-between gap-3 py-4 text-sm">
        <div><p className="font-semibold">{tx.note || "Commission de parrainage"}</p><p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString("fr-FR")}</p></div>
        <span className="shrink-0 font-semibold text-success">+{formatFcfa(tx.amount)}</span>
      </div>)}</div>}
  </AppShell>;
}