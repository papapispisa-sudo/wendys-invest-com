import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, Ticket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa } from "@/lib/wendys";

export const Route = createFileRoute("/roue")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Roue de la chance et codes bonus — Wendy's" },
      { name: "description", content: "Tournez la roue Wendy's et utilisez vos codes bonus pour gagner des FCFA." },
      { property: "og:title", content: "Roue de la chance — Wendy's" },
      { property: "og:description", content: "Tentez votre chance chaque jour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouePage,
});

function RouePage() {
  const queryClient = useQueryClient();
  const { data: prizes } = useQuery({
    queryKey: ["wheel-prizes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wheel_prizes").select("*").order("amount");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: status } = useQuery({
    queryKey: ["wheel-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("wheel_status");
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    },
  });
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const list = prizes ?? [];
  const slice = list.length ? 360 / list.length : 360;

  async function spin() {
    setSpinning(true);
    const { data, error } = await supabase.rpc("spin_wheel");
    if (error) {
      setSpinning(false);
      return toast.error(error.message);
    }
    const won = Array.isArray(data) ? data[0] : data;
    const idx = Math.max(0, list.findIndex((p) => p.id === won?.prize_id));
    const target = 360 * 6 + (360 - (idx * slice + slice / 2));
    setRotation((r) => r - (r % 360) + target);
    setTimeout(() => {
      setSpinning(false);
      if (Number(won?.amount) > 0) toast.success(`Bravo ! Vous gagnez ${formatFcfa(won?.amount)}`);
      else toast(`Pas de chance cette fois : ${won?.label ?? "Rien"}`);
      queryClient.invalidateQueries();
    }, 4200);
  }

  async function redeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_bonus_code", { p_code: code });
    setRedeeming(false);
    if (error) return toast.error(error.message);
    toast.success(`Code accepté : ${formatFcfa(data as number)} ajoutés`);
    setCode("");
    queryClient.invalidateQueries();
  }

  const colors = ["var(--primary)", "var(--primary-dark)", "var(--accent)", "var(--secondary)"];
  const gradient = list
    .map((_, i) => `${colors[i % colors.length]} ${i * slice}deg ${(i + 1) * slice}deg`)
    .join(", ");

  return (
    <AppShell title="Roue & codes bonus">
      <section className="card-soft p-4 text-center">
        <h1 className="mb-1 flex items-center justify-center gap-2 font-display text-xl">
          <Gift className="h-5 w-5 text-primary" /> Roue de la chance
        </h1>
        <p className="mb-4 text-xs text-muted-foreground">
          {status?.spins_left ?? 0} tour(s) restant(s) aujourd'hui
          {Number(status?.spin_cost) > 0 && ` · ${formatFcfa(status?.spin_cost)} par tour`}
        </p>
        <div className="relative mx-auto h-64 w-64">
          <div className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-foreground" />
          <div
            className="h-full w-full rounded-full border-4 border-card shadow-[var(--shadow-card)]"
            style={{
              background: list.length ? `conic-gradient(${gradient})` : "var(--muted)",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)",
            }}
          >
            {list.map((p, i) => (
              <span
                key={p.id}
                className="absolute left-1/2 top-1/2 origin-left text-[10px] font-bold text-primary-foreground"
                style={{ transform: `rotate(${i * slice + slice / 2 - 90}deg) translateX(40px)` }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
        <Button
          className="mt-5 h-11 w-full font-bold"
          disabled={spinning || !status?.active || (status?.spins_left ?? 0) <= 0}
          onClick={spin}
        >
          {spinning ? "La roue tourne…" : !status?.active ? "Roue indisponible" : "Tourner la roue"}
        </Button>
      </section>

      <section className="card-soft mt-4 p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
          <Ticket className="h-5 w-5 text-primary" /> Code bonus
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Entrez votre code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button disabled={redeeming} onClick={redeem}>
            Valider
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
