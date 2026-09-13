import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  KeyRound,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAccount";
import {
  useAdminOverview,
  useAdminTransactions,
  useAdminUsers,
  useAllProducts,
  useIsAdmin,
} from "@/hooks/useAdmin";
import { adminDeleteUser, adminResetPassword } from "@/lib/admin.functions";
import { formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — Wendy's" },
      { name: "description", content: "Espace d'administration Wendy's : utilisateurs, dépôts, retraits et produits." },
      { property: "og:title", content: "Administration — Wendy's" },
      { property: "og:description", content: "Gestion de la plateforme Wendy's." },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "resume", label: "Résumé" },
  { id: "users", label: "Utilisateurs" },
  { id: "tx", label: "Dépôts / Retraits" },
  { id: "products", label: "Produits" },
] as const;

function AdminPage() {
  const navigate = useNavigate();
  const { userId, loading } = useSession();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("resume");

  useEffect(() => {
    if (!loading && !userId) navigate({ to: "/", replace: true });
  }, [loading, userId, navigate]);

  useEffect(() => {
    if (!checking && isAdmin === false && userId) navigate({ to: "/accueil", replace: true });
  }, [checking, isAdmin, userId, navigate]);

  if (loading || checking || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="brand-gradient sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-primary-foreground shadow-md">
        <button onClick={() => navigate({ to: "/parametres" })} aria-label="Retour">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-display text-lg leading-none">Administration</p>
          <p className="text-xs opacity-80">Wendy's</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resume" && <Overview />}
        {tab === "users" && <UsersTab />}
        {tab === "tx" && <TransactionsTab />}
        {tab === "products" && <ProductsTab />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl text-primary">{value}</p>
    </div>
  );
}

function Overview() {
  const { data } = useAdminOverview();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Utilisateurs" value={String(data?.users_count ?? 0)} />
      <Stat label="Bénéfice net" value={formatFcfa(data?.profit)} />
      <Stat label="Total des dépôts" value={formatFcfa(data?.total_deposits)} />
      <Stat label="Total des retraits" value={formatFcfa(data?.total_withdrawals)} />
      <Stat label="Total investi" value={formatFcfa(data?.total_invested)} />
      <Stat label="Soldes des comptes" value={formatFcfa(data?.total_balance)} />
      <Stat label="Dépôts en attente" value={String(data?.pending_deposits ?? 0)} />
      <Stat label="Retraits en attente" value={String(data?.pending_withdrawals ?? 0)} />
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users } = useAdminUsers(search);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  async function addFunds(id: string) {
    const raw = window.prompt("Montant à ajouter (FCFA). Utilisez un nombre négatif pour retirer :");
    if (!raw) return;
    const amount = Number(raw.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amount) || amount === 0) return toast.error("Montant invalide");
    setBusy(id);
    const { error } = await supabase.rpc("admin_add_funds", {
      p_user_id: id,
      p_amount: amount,
      p_note: "Ajustement administrateur",
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Solde mis à jour");
    refresh();
  }

  async function resetPassword(id: string) {
    const pwd = window.prompt("Nouveau mot de passe (6 caractères minimum) :");
    if (!pwd) return;
    setBusy(id);
    try {
      await adminResetPassword({ data: { userId: id, password: pwd } });
      toast.success("Mot de passe réinitialisé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    }
    setBusy(null);
  }

  async function remove(id: string, phone: string) {
    if (!window.confirm(`Supprimer définitivement le compte ${phone} ?`)) return;
    setBusy(id);
    try {
      await adminDeleteUser({ data: { userId: id } });
      toast.success("Compte supprimé");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    }
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher un numéro ou un code d'invitation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {(users ?? []).map((u) => (
        <div key={u.id} className="card-soft p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                {u.phone} {u.is_admin && <span className="text-xs text-primary">(admin)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {u.country} · code {u.invite_code} ·{" "}
                {new Date(u.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-primary">{formatFcfa(u.balance)}</p>
              <p className="text-[11px] text-muted-foreground">
                {u.has_invested ? "A investi" : "Sans produit"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => addFunds(u.id)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Fonds
            </Button>
            <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => resetPassword(u.id)}>
              <KeyRound className="mr-1 h-3.5 w-3.5" /> Mot de passe
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy === u.id}
              onClick={() => remove(u.id, u.phone)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
            </Button>
          </div>
        </div>
      ))}
      {(users ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6" /> Aucun utilisateur
        </p>
      )}
    </div>
  );
}

const STATUS_TABS = [
  { id: "pending", label: "En attente" },
  { id: "completed", label: "Validés" },
  { id: "failed", label: "Refusés" },
] as const;

function TransactionsTab() {
  const [status, setStatus] = useState<string>("pending");
  const { data: rows } = useAdminTransactions(status);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, next: "completed" | "failed") {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_transaction_status", {
      p_id: id,
      p_status: next,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(next === "completed" ? "Opération validée" : "Opération refusée");
    queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === s.id ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(rows ?? []).map((t) => (
        <div key={t.id} className="card-soft p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">
                {t.kind === "deposit" ? "Dépôt" : "Retrait"} · {t.user_phone ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.method ?? "—"} · {t.phone ?? "—"} ·{" "}
                {new Date(t.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            <p className="font-display text-primary">{formatFcfa(t.amount)}</p>
          </div>
          {t.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" disabled={busy === t.id} onClick={() => decide(t.id, "completed")}>
                <Check className="mr-1 h-3.5 w-3.5" /> Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === t.id}
                onClick={() => decide(t.id, "failed")}
              >
                <X className="mr-1 h-3.5 w-3.5" /> Refuser
              </Button>
            </div>
          )}
        </div>
      ))}
      {(rows ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          <Wallet className="mx-auto mb-2 h-6 w-6" /> Aucune opération
        </p>
      )}
    </div>
  );
}

function ProductsTab() {
  const { data: products } = useAllProducts();
  const queryClient = useQueryClient();

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.rpc("admin_set_product_active", {
      p_product_id: id,
      p_active: active,
    });
    if (error) return toast.error(error.message);
    toast.success(active ? "Produit activé" : "Produit désactivé");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="space-y-3">
      {(products ?? []).map((p) => (
        <div key={p.id} className="card-soft flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFcfa(p.price)} · {formatFcfa(p.daily_return)}/jour · {p.duration_days} jours
            </p>
          </div>
          <Button
            size="sm"
            variant={p.active ? "outline" : "default"}
            onClick={() => toggle(p.id, !p.active)}
          >
            {p.active ? "Désactiver" : "Activer"}
          </Button>
        </div>
      ))}
    </div>
  );
}
