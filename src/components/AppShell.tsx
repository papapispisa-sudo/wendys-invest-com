import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Package, Users, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/hooks/useAccount";
import logo from "@/assets/wendys-logo.jpg.asset.json";

const NAV = [
  { to: "/accueil", label: "Accueil", icon: Home },
  { to: "/produits", label: "Produits", icon: Package },
  { to: "/parrainage", label: "Parrainage", icon: Users },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { userId, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !userId) navigate({ to: "/", replace: true });
  }, [loading, userId, navigate]);

  if (loading || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="brand-gradient sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-primary-foreground shadow-md">
        <img src={logo.url} alt="Logo Wendy's" className="h-9 w-9 rounded-full object-cover" />
        <div>
          <p className="font-display text-lg leading-none">Wendy's</p>
          <p className="text-xs opacity-80">{title}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md justify-around border-t border-border bg-card px-2 py-2 shadow-[var(--shadow-float)]">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${
                active ? "bg-accent text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
