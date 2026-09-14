import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  Check,
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  TrendingUp,
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
      {
        name: "description",
        content: "Tableau de bord administrateur Wendy's : utilisateurs, dépôts, retraits et produits.",
      },
      { property: "og:title", content: "Administration — Wendy's" },
      { property: "og:description", content: "Gestion de la plateforme Wendy's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const NAV = [
  { id: "resume", label: "Tableau de bord", icon: Gauge },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "tx", label: "Dépôts / Retraits", icon: Wallet },
  { id: "products", label: "Produits", icon: Box },
] as const;

type TabId = (typeof NAV)[number]["id"];

function AdminPage() {
  const navigate = useNavigate();
  const { userId, loading } = useSession();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const [tab, setTab] = useState<TabId>("resume");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !userId) navigate({ to: "/", replace: true });
  }, [loading, userId, navigate]);

  useEffect(() => {
    if (!checking && isAdmin === false && userId) navigate({ to: "/accueil", replace: true });
  }, [checking, isAdmin, userId, navigate]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (loading || checking || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const current = NAV.find((n) => n.id === tab);

  return (
    <div className="min-h-screen bg-muted/60">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-md font-display text-sm text-primary-foreground">
            W
          </div>
          <div>
            <p className="font-display text-base leading-none">Wendy's</p>
            <p className="text-[11px] opacity-70">Panneau admin</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wider opacity-60">Navigation</p>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === n.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </button>
            );
          })}
          <button
            onClick={() => navigate({ to: "/accueil" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
          >
            <TrendingUp className="h-4 w-4" /> Retour à l'application
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </nav>
      </aside>

      {open && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 shadow-sm">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg leading-none">{current?.label}</h1>
            <p className="text-[11px] text-muted-foreground">Administration / {current?.label}</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 lg:p-6">
          {tab === "resume" && <Overview />}
          {tab === "users" && <UsersTab />}
          {tab === "tx" && <TransactionsTab />}
          {tab === "products" && <ProductsTab />}
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "muted";
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-lg">{value}</p>
      </div>
    </div>
  );
}

function Overview() {
  const { data } = useAdminOverview();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Utilisateurs" value={String(data?.users_count ?? 0)} icon={Users} />
      <Stat label="Bénéfice net" value={formatFcfa(data?.profit)} icon={TrendingUp} />
      <Stat label="Total des dépôts" value={formatFcfa(data?.total_deposits)} icon={ArrowDownCircle} />
      <Stat label="Total des retraits" value={formatFcfa(data?.total_withdrawals)} icon={ArrowUpCircle} />
      <Stat label="Total investi" value={formatFcfa(data?.total_invested)} icon={Box} tone="muted" />
      <Stat label="Soldes des comptes" value={formatFcfa(data?.total_balance)} icon={Wallet} tone="muted" />
      <Stat
        label="Dépôts en attente"
        value={String(data?.pending_deposits ?? 0)}
        icon={ArrowDownCircle}
        tone="muted"
      />
      <Stat
        label="Retraits en attente"
        value={String(data?.pending_withdrawals ?? 0)}
        icon={ArrowUpCircle}
        tone="muted"
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="font-display text-sm">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
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
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Montant invalide");
      return;
    }
    setBusy(id);
    const { error } = await supabase.rpc("admin_add_funds", {
      p_user_id: id,
      p_amount: amount,
      p_note: "Ajustement administrateur",
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
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
    <Panel title="Gestion des utilisateurs">
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher un numéro ou un code d'invitation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Utilisateur</th>
              <th className="py-2 pr-3 font-medium">Pays</th>
              <th className="py-2 pr-3 font-medium">Code</th>
              <th className="py-2 pr-3 font-medium">Solde</th>
              <th className="py-2 pr-3 font-medium">Statut</th>
              <th className="py-2 pr-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b last:border-0 align-middle">
                <td className="py-3 pr-3">
                  <p className="font-semibold">
                    {u.phone} {u.is_admin && <span className="text-xs text-primary">(admin)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </td>
                <td className="py-3 pr-3">{u.country}</td>
                <td className="py-3 pr-3">{u.invite_code}</td>
                <td className="py-3 pr-3 font-display text-primary">{formatFcfa(u.balance)}</td>
                <td className="py-3 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      u.has_invested ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.has_invested ? "A investi" : "Sans produit"}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => addFunds(u.id)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Fonds
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === u.id}
                      onClick={() => resetPassword(u.id)}
                    >
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(users ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6" /> Aucun utilisateur
        </p>
      )}
    </Panel>
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "completed" ? "Opération validée" : "Opération refusée");
    queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  return (
    <Panel title="Dépôts et retraits">
      <div className="mb-4 flex gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              status === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Utilisateur</th>
              <th className="py-2 pr-3 font-medium">Opérateur</th>
              <th className="py-2 pr-3 font-medium">Montant</th>
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="py-3 pr-3 font-semibold">
                  {t.kind === "deposit" ? "Dépôt" : "Retrait"}
                </td>
                <td className="py-3 pr-3">{t.user_phone ?? "—"}</td>
                <td className="py-3 pr-3 text-xs text-muted-foreground">
                  {t.method ?? "—"} · {t.phone ?? "—"}
                </td>
                <td className="py-3 pr-3 font-display text-primary">{formatFcfa(t.amount)}</td>
                <td className="py-3 pr-3 text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="py-3 pr-3">
                  {t.status === "pending" ? (
                    <div className="flex gap-2">
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
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t.status === "completed" ? "Validé" : "Refusé"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(rows ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          <Wallet className="mx-auto mb-2 h-6 w-6" /> Aucune opération
        </p>
      )}
    </Panel>
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(active ? "Produit activé" : "Produit désactivé");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <Panel title="Catalogue des produits">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Produit</th>
              <th className="py-2 pr-3 font-medium">Prix</th>
              <th className="py-2 pr-3 font-medium">Revenu / jour</th>
              <th className="py-2 pr-3 font-medium">Durée</th>
              <th className="py-2 pr-3 font-medium">État</th>
              <th className="py-2 pr-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-3 pr-3 font-semibold">{p.name}</td>
                <td className="py-3 pr-3">{formatFcfa(p.price)}</td>
                <td className="py-3 pr-3">{formatFcfa(p.daily_return)}</td>
                <td className="py-3 pr-3">{p.duration_days} jours</td>
                <td className="py-3 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <Button size="sm" variant={p.active ? "outline" : "default"} onClick={() => toggle(p.id, !p.active)}>
                    {p.active ? "Désactiver" : "Activer"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
