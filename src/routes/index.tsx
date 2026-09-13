import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, phoneIdentity, normalizePhone } from "@/lib/wendys";
import { useSession } from "@/hooks/useAccount";
import logo from "@/assets/wendys-logo.jpg.asset.json";
import hero from "@/assets/wendys-hero.jpg.asset.json";

type Search = { ref?: string | undefined };

const FAQ = [
  {
    q: "Quel est le dépôt minimum ?",
    a: "Le dépôt minimum est de 2000 FCFA, via MTN, WAVE, Orange, MOOV, TMONEY ou YAS selon votre pays.",
  },
  {
    q: "Quand puis-je retirer mes gains ?",
    a: "Les retraits sont possibles de 11h à 18h GMT, après l'achat d'au moins un produit. Le retrait minimum est de 1000 FCFA.",
  },
  {
    q: "Comment fonctionnent les produits ?",
    a: "Chaque produit rapporte un revenu quotidien pendant 45 jours. Le premier produit coûte 2000 FCFA et rapporte 600 FCFA par jour.",
  },
  {
    q: "Comment fonctionne le parrainage ?",
    a: "Invitez vos amis avec votre code : vous gagnez 30 % au niveau 1, 3 % au niveau 2 et 2 % au niveau 3 sur leurs achats de produits.",
  },
  {
    q: "Quels bonus sont offerts ?",
    a: "Vous recevez 1000 FCFA à l'inscription et un bonus quotidien de 125 FCFA chaque jour de connexion.",
  },
];

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search => ({
    ref: typeof search['ref'] === "string" ? search['ref'] : undefined,
  }),
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: logo.url, fetchpriority: "high" },
      { rel: "preconnect", href: new URL(hero.url, "https://x.invalid").origin },
    ],
    meta: [

      { title: "Wendy's — Investissez et gagnez chaque jour" },
      {
        name: "description",
        content:
          "Wendy's : plateforme d'investissement en Afrique de l'Ouest. Dépôt dès 2000 FCFA, revenus quotidiens et parrainage sur 3 niveaux.",
      },
      { property: "og:title", content: "Wendy's — Investissez et gagnez chaque jour" },
      {
        property: "og:description",
        content: "Inscription en 1 minute avec votre numéro. Bonus d'inscription de 1000 FCFA.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { ref } = useSearch({ from: "/" });
  const { userId, loading } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [country, setCountry] = useState(COUNTRIES[0]!.code);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState(ref ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref) {
      setInvite(ref.toUpperCase());
      setMode("signup");
    }
  }, [ref]);

  useEffect(() => {
    if (!loading && userId) navigate({ to: "/accueil", replace: true });
  }, [loading, userId, navigate]);

  const dial = COUNTRIES.find((c) => c.code === country)?.dial ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normalizePhone(phone).length < 8) {
      toast.error("Entrez un numéro valide");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setBusy(true);
    const email = phoneIdentity(country, phone);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: `${dial} ${normalizePhone(phone)}`,
              country,
              invite_code: invite.trim().toUpperCase(),
            },
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Bonus de 1000 FCFA offert 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue !");
      }
      navigate({ to: "/accueil", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      toast.error(
        message.includes("already registered")
          ? "Ce numéro possède déjà un compte"
          : message.includes("Invalid login")
            ? "Numéro ou mot de passe incorrect"
            : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="brand-gradient px-6 pb-10 pt-12 text-center text-primary-foreground">
        <img
          src={logo.url}
          alt="Logo Wendy's"
          className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-lg"
        />
        <h1 className="mt-4 text-3xl">Wendy's Invest</h1>
        <p className="mt-1 text-sm opacity-90">
          Investissez dès 2000 FCFA et recevez vos revenus chaque jour.
        </p>
      </div>

      <img
        src={hero.url}
        alt="Restaurant Wendy's illuminé la nuit"
        className="h-44 w-full object-cover sm:h-56"
        loading="lazy"
      />

      <div className="mx-auto -mt-6 w-full max-w-md px-4">
        <div className="card-soft p-5">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 transition-colors ${
                  mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signup" ? "Inscription" : "Connexion"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="country">Pays</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Numéro</Label>
              <div className="flex items-center gap-2">
                <span className="flex h-11 items-center rounded-lg bg-muted px-3 text-sm font-semibold">
                  {dial}
                </span>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="01 02 03 04 05"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="invite">Code d'invitation</Label>
                <Input
                  id="invite"
                  placeholder="Optionnel"
                  value={invite}
                  onChange={(e) => setInvite(e.target.value.toUpperCase())}
                  className="h-11"
                />
                {ref && (
                  <p className="text-xs text-muted-foreground">Code rempli automatiquement ✅</p>
                )}
              </div>
            )}

            <Button type="submit" disabled={busy} className="h-12 w-full text-base font-bold">
              {busy ? "Patientez..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["1000 FCFA", "Bonus d'inscription"],
            ["125 FCFA", "Bonus quotidien"],
            ["30 %", "Parrainage niveau 1"],
          ].map(([big, small]) => (
            <div key={big} className="card-soft px-2 py-3">
              <p className="font-display text-base text-primary">{big}</p>
              <p className="text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>

        <section className="card-soft mt-4 p-5">
          <h2 className="font-display text-xl text-primary">Avant-propos</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Wendy's est une plateforme d'investissement pensée pour l'Afrique de l'Ouest. Notre
            mission est simple : permettre à chacun, quel que soit son budget, de faire fructifier
            son argent au quotidien. Avec un dépôt minimum de seulement 2000 FCFA et des paiements
            mobiles adaptés à votre pays (MTN, WAVE, Orange, MOOV, TMONEY, YAS), vous investissez en
            toute simplicité et suivez vos revenus jour après jour.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Rejoignez une communauté qui grandit chaque jour en Côte d'Ivoire, au Bénin, au Burkina
            Faso et au Togo. Ensemble, construisons votre avenir financier.
          </p>
        </section>

        <section className="mt-4 pb-10">
          <h2 className="mb-3 font-display text-xl text-primary">Questions fréquentes</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <details key={i} className="card-soft group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
