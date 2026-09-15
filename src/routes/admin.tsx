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
  Gift,
  KeyRound,
  Layers,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Ticket,
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
  useAdminBonusCodes,
  useAdminOverview,
  useAdminTransactions,
  useAdminUserInvestments,
  useAdminUserReferrals,
  useAdminUsers,
  useAdminWheelPrizes,
  useAllProducts,
  useIsAdmin,
  useProductTypes,
  useWheelSettings,
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
        content:
          "Tableau de bord administrateur Wendy's : utilisateurs, dépôts, retraits, produits, roue et codes bonus.",
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
  { id: "types", label: "Types de produits", icon: Layers },
  { id: "wheel", label: "Roue de la chance", icon: Gift },
  { id: "codes", label: "Codes bonus", icon: Ticket },
] as const;

type TabId = (typeof NAV)[number]["id"];

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

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
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent font-display text-sidebar-accent-foreground">
            W
          </div>
          <div>
            <p className="font-display leading-none">Wendy's</p>
            <p className="text-[11px] opacity-70">Administration</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((n) => (
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
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
          <button
            onClick={() => navigate({ to: "/accueil" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
          >
            <ArrowUpCircle className="h-4 w-4" /> Retour à l'application
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
          {tab === "types" && <TypesTab />}
          {tab === "wheel" && <WheelTab />}
          {tab === "codes" && <CodesTab />}
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

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-display text-sm">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="mt-8 w-full max-w-2xl rounded-lg border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-display text-sm">{title}</h3>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- Utilisateurs ------------------------------ */

type AdminUser = {
  id: string;
  phone: string;
  country: string;
  invite_code: string;
  balance: number;
  has_invested: boolean;
  is_admin: boolean;
  created_at: string;
};

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users } = useAdminUsers(search);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUser | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  async function adjust(id: string, sign: 1 | -1) {
    const raw = window.prompt(
      sign === 1 ? "Montant à créditer (FCFA) :" : "Montant à débiter (FCFA) :",
    );
    if (!raw) return;
    const amount = Number(raw.replace(/\s/g, "").replace(",", ".")) * sign;
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Montant invalide");
      return;
    }
    setBusy(id);
    const { error } = await supabase.rpc("admin_add_funds", {
      p_user_id: id,
      p_amount: amount,
      p_note: sign === 1 ? "Crédit administrateur" : "Débit administrateur",
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
        <table className="w-full min-w-[820px] text-sm">
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
            {((users ?? []) as AdminUser[]).map((u) => (
              <tr key={u.id} className="border-b align-middle last:border-0">
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
                    <Button size="sm" onClick={() => setDetail(u)}>
                      Détails
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => adjust(u.id, 1)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Créditer
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => adjust(u.id, -1)}>
                      Débiter
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

      {detail && <UserDetail user={detail} onClose={() => setDetail(null)} />}
    </Panel>
  );
}

function UserDetail({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { data: referrals } = useAdminUserReferrals(user.id);
  const { data: investments } = useAdminUserInvestments(user.id);
  const { data: products } = useAllProducts();
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-user-investments", user.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function grant() {
    if (!productId) return toast.error("Choisissez un produit");
    setBusy(true);
    const { error } = await supabase.rpc("admin_grant_investment", {
      p_user_id: user.id,
      p_product_id: productId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Produit ajouté au compte");
    refresh();
  }

  async function removeInvestment(id: string) {
    if (!window.confirm("Retirer ce produit du compte ?")) return;
    const { error } = await supabase.rpc("admin_remove_investment", { p_investment_id: id });
    if (error) return toast.error(error.message);
    toast.success("Produit retiré");
    refresh();
  }

  const levels = [1, 2, 3] as const;
  const refs = (referrals ?? []) as {
    id: string;
    phone: string;
    level: number;
    balance: number;
    has_invested: boolean;
    created_at: string;
  }[];

  return (
    <Modal title={`Compte ${user.phone}`} onClose={onClose}>
      <div className="space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className="font-display text-lg text-primary">{formatFcfa(user.balance)}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Code d'invitation</p>
            <p className="font-display text-lg">{user.invite_code}</p>
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">Filleuls ({refs.length})</h4>
          {levels.map((lvl) => {
            const list = refs.filter((r) => r.level === lvl);
            return (
              <div key={lvl} className="mb-2">
                <p className="text-xs uppercase text-muted-foreground">
                  Niveau {lvl} · {list.length}
                </p>
                <div className="divide-y rounded-md border">
                  {list.length === 0 && <p className="p-2 text-xs text-muted-foreground">Aucun filleul</p>}
                  {list.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2">
                      <span>{r.phone}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFcfa(r.balance)} · {r.has_invested ? "a investi" : "sans produit"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <h4 className="mb-2 font-semibold">Produits du compte</h4>
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              className={`${inputClass} max-w-xs`}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Choisir un produit à ajouter…</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatFcfa(p.price)}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={busy} onClick={grant}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <div className="divide-y rounded-md border">
            {((investments ?? []) as {
              id: string;
              product_name: string;
              price: number;
              daily_return: number;
              days_paid: number;
              duration_days: number;
              active: boolean;
            }[]).map((i) => (
              <div key={i.id} className="flex items-center justify-between p-2">
                <div>
                  <p className="font-semibold">{i.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFcfa(i.price)} · {formatFcfa(i.daily_return)}/jour · {i.days_paid}/
                    {i.duration_days} jours
                  </p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => removeInvestment(i.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {(investments ?? []).length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">Aucun produit</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------ Transactions ------------------------------ */

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
    const { error } = await supabase.rpc("admin_set_transaction_status", { p_id: id, p_status: next });
    setBusy(null);
    if (error) return toast.error(error.message);
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
                <td className="py-3 pr-3 font-semibold">{t.kind === "deposit" ? "Dépôt" : "Retrait"}</td>
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

/* --------------------------------- Produits -------------------------------- */

type ProductForm = {
  id: string | null;
  name: string;
  price: string;
  daily_return: string;
  duration_days: string;
  rank: string;
  category: string;
  description: string;
  image_url: string;
  active: boolean;
};

const EMPTY_PRODUCT: ProductForm = {
  id: null,
  name: "",
  price: "",
  daily_return: "",
  duration_days: "45",
  rank: "0",
  category: "produit",
  description: "",
  image_url: "",
  active: true,
};

function ProductsTab() {
  const { data: products } = useAllProducts();
  const { data: types } = useProductTypes();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.rpc("admin_set_product_active", {
      p_product_id: id,
      p_active: active,
    });
    if (error) return toast.error(error.message);
    toast.success(active ? "Produit activé" : "Produit désactivé");
    refresh();
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_upsert_product", {
      p_id: form.id,
      p_name: form.name,
      p_price: Number(form.price) || 0,
      p_daily_return: Number(form.daily_return) || 0,
      p_duration_days: Number(form.duration_days) || 1,
      p_rank: Number(form.rank) || 0,
      p_category: form.category,
      p_description: form.description || null,
      p_image_url: form.image_url || null,
      p_active: form.active,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Produit modifié" : "Produit créé");
    setForm(null);
    refresh();
  }

  async function del(id: string) {
    if (!window.confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.rpc("admin_delete_product", { p_id: id });
    if (error) return toast.error(error.message);
    toast.success("Produit supprimé");
    refresh();
  }

  return (
    <Panel
      title="Catalogue des produits"
      action={
        <Button size="sm" onClick={() => setForm({ ...EMPTY_PRODUCT })}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nouveau produit
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Produit</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Prix</th>
              <th className="py-2 pr-3 font-medium">Revenu / jour</th>
              <th className="py-2 pr-3 font-medium">Durée</th>
              <th className="py-2 pr-3 font-medium">État</th>
              <th className="py-2 pr-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {p.description ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3 text-xs">{p.category}</td>
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          name: p.name,
                          price: String(p.price),
                          daily_return: String(p.daily_return),
                          duration_days: String(p.duration_days),
                          rank: String(p.rank),
                          category: p.category ?? "produit",
                          description: p.description ?? "",
                          image_url: p.image_url ?? "",
                          active: p.active,
                        })
                      }
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Modifier
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(p.id, !p.active)}>
                      {p.active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => del(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? "Modifier le produit" : "Nouveau produit"} onClose={() => setForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Nom
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-sm">
              Type
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {(types ?? []).map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Prix (FCFA)
              <Input
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Revenu par jour (FCFA)
              <Input
                inputMode="numeric"
                value={form.daily_return}
                onChange={(e) => setForm({ ...form, daily_return: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Durée (jours)
              <Input
                inputMode="numeric"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Ordre d'affichage
              <Input
                inputMode="numeric"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Lien de l'image
              <Input
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Produit visible dans la boutique
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>
              Annuler
            </Button>
            <Button disabled={busy} onClick={save}>
              Enregistrer
            </Button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}

/* ----------------------------- Types de produits --------------------------- */

function TypesTab() {
  const { data: types } = useProductTypes();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["product-types"] });
  }

  async function add() {
    const s = (slug || label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!s || !label) return toast.error("Nom du type obligatoire");
    const { error } = await supabase.rpc("admin_upsert_product_type", {
      p_slug: s,
      p_label: label,
      p_sort_order: (types ?? []).length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Type enregistré");
    setLabel("");
    setSlug("");
    refresh();
  }

  async function del(s: string) {
    if (!window.confirm("Supprimer ce type ?")) return;
    const { error } = await supabase.rpc("admin_delete_product_type", { p_slug: s });
    if (error) return toast.error(error.message);
    toast.success("Type supprimé");
    refresh();
  }

  return (
    <Panel title="Types de produits (produits, staking, …)">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Nom affiché
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Staking VIP" />
        </label>
        <label className="text-sm">
          Identifiant (optionnel)
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="staking-vip" />
        </label>
        <Button onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>
      <div className="divide-y rounded-md border">
        {(types ?? []).map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.slug}</p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => del(t.slug)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- Roue de chance ---------------------------- */

function WheelTab() {
  const { data: prizes } = useAdminWheelPrizes();
  const { data: settings } = useWheelSettings();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [weight, setWeight] = useState("10");
  const [difficulty, setDifficulty] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [spins, setSpins] = useState<string>("");

  const diff = difficulty !== "" ? difficulty : String(settings?.difficulty ?? 3);
  const spinCost = cost !== "" ? cost : String(settings?.spin_cost ?? 0);
  const dailySpins = spins !== "" ? spins : String(settings?.daily_spins ?? 1);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-wheel-prizes"] });
    queryClient.invalidateQueries({ queryKey: ["wheel-settings"] });
    queryClient.invalidateQueries({ queryKey: ["wheel-status"] });
  }

  async function saveSettings(active?: boolean) {
    const { error } = await supabase.rpc("admin_update_wheel_settings", {
      p_difficulty: Number(diff) || 3,
      p_spin_cost: Number(spinCost) || 0,
      p_daily_spins: Number(dailySpins) || 0,
      p_active: active ?? settings?.active ?? true,
    });
    if (error) return toast.error(error.message);
    toast.success("Réglages enregistrés");
    refresh();
  }

  async function addPrize() {
    if (!label) return toast.error("Nom du lot obligatoire");
    const { error } = await supabase.rpc("admin_upsert_wheel_prize", {
      p_id: null,
      p_label: label,
      p_amount: Number(amount) || 0,
      p_weight: Number(weight) || 1,
      p_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Lot ajouté");
    setLabel("");
    setAmount("");
    refresh();
  }

  async function delPrize(id: string) {
    const { error } = await supabase.rpc("admin_delete_wheel_prize", { p_id: id });
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-4">
      <Panel title="Réglages de la roue">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm">
            Difficulté (1 = facile, 5 = très difficile)
            <select className={inputClass} value={diff} onChange={(e) => setDifficulty(e.target.value)}>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Coût d'un tour (FCFA)
            <Input inputMode="numeric" value={spinCost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <label className="text-sm">
            Tours par jour
            <Input inputMode="numeric" value={dailySpins} onChange={(e) => setSpins(e.target.value)} />
          </label>
          <div className="flex items-end gap-2">
            <Button onClick={() => saveSettings()}>Enregistrer</Button>
            <Button variant="outline" onClick={() => saveSettings(!(settings?.active ?? true))}>
              {settings?.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Lots de la roue">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            Nom du lot
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="500 FCFA" />
          </label>
          <label className="text-sm">
            Montant (FCFA)
            <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="text-sm">
            Chance (poids)
            <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          <Button onClick={addPrize}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
        <div className="divide-y rounded-md border">
          {((prizes ?? []) as { id: string; label: string; amount: number; weight: number; active: boolean }[]).map(
            (p) => (
              <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFcfa(p.amount)} · poids {p.weight} · {p.active ? "actif" : "inactif"}
                  </p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => delPrize(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          )}
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------- Codes bonus ------------------------------ */

function CodesTab() {
  const { data: codes } = useAdminBonusCodes();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expires, setExpires] = useState("");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-bonus-codes"] });
  }

  async function add() {
    if (!code || !amount) return toast.error("Code et montant obligatoires");
    const { error } = await supabase.rpc("admin_upsert_bonus_code", {
      p_id: null,
      p_code: code,
      p_amount: Number(amount) || 0,
      p_max_uses: Number(maxUses) || 1,
      p_expires_at: expires ? new Date(expires).toISOString() : null,
      p_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Code créé");
    setCode("");
    setAmount("");
    setExpires("");
    refresh();
  }

  async function del(id: string) {
    if (!window.confirm("Supprimer ce code ?")) return;
    const { error } = await supabase.rpc("admin_delete_bonus_code", { p_id: id });
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <Panel title="Codes bonus">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Code
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WENDY500" />
        </label>
        <label className="text-sm">
          Montant (FCFA)
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="text-sm">
          Utilisations max
          <Input inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </label>
        <label className="text-sm">
          Expire le (optionnel)
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </label>
        <Button onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Créer
        </Button>
      </div>

      <div className="divide-y rounded-md border">
        {((codes ?? []) as {
          id: string;
          code: string;
          amount: number;
          uses: number;
          max_uses: number;
          expires_at: string | null;
          active: boolean;
        }[]).map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-display">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {formatFcfa(c.amount)} · {c.uses}/{c.max_uses} utilisations
                {c.expires_at && ` · expire le ${new Date(c.expires_at).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => del(c.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {(codes ?? []).length === 0 && <p className="p-3 text-sm text-muted-foreground">Aucun code</p>}
      </div>
    </Panel>
  );
}
