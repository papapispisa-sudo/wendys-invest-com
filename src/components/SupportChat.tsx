import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function SupportChat({ userId, asAdmin = false }: { userId: string; asAdmin?: boolean }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { data = [] } = useQuery({
    queryKey: ["support", userId],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages").select("*").eq("user_id", userId)
        .order("created_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [data.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (body.length > 2000) { toast.error("Message trop long (2000 caractères max)"); return; }
    setBusy(true);
    const { error } = await supabase.from("support_messages").insert({ user_id: userId, from_admin: asAdmin, body });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["support", userId] });
    qc.invalidateQueries({ queryKey: ["admin-support"] });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[55vh] min-h-[200px] space-y-2 overflow-y-auto rounded-xl border bg-muted/40 p-3">
        {data.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {asAdmin ? "Aucun message." : "Écrivez votre demande ou question, notre équipe vous répondra ici."}
          </p>
        )}
        {data.map((m) => {
          const mine = m.from_admin === asAdmin;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                <p className="text-[10px] font-semibold opacity-70">{m.from_admin ? "Service client" : asAdmin ? "Utilisateur" : "Vous"}</p>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
          placeholder={asAdmin ? "Votre réponse..." : "Votre message..."}
          className="flex-1 rounded-xl border bg-background p-2 text-sm" />
        <Button onClick={send} disabled={busy || !text.trim()} className="h-auto" aria-label="Envoyer">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AdminSupportTab() {
  const [sel, setSel] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-support"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_support_threads");
      if (error) throw error;
      return [...(data ?? [])].sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at));
    },
  });
  const current = data.find((t) => t.user_id === sel);
  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="space-y-2 rounded-xl border bg-card p-3">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Aucune conversation.</p>}
        {data.map((t) => (
          <button key={t.user_id} onClick={() => setSel(t.user_id)}
            className={`w-full rounded-lg border p-2 text-left text-sm ${sel === t.user_id ? "border-primary bg-accent" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t.phone ?? "—"}</span>
              {!t.last_from_admin && <span className="rounded-full bg-primary px-2 text-[10px] text-primary-foreground">À répondre</span>}
            </div>
            <p className="truncate text-xs text-muted-foreground">{t.last_body}</p>
          </button>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-3">
        {sel ? (
          <>
            <p className="mb-2 font-bold">Conversation avec {current?.phone ?? "—"}</p>
            <SupportChat key={sel} userId={sel} asAdmin />
          </>
        ) : <p className="text-sm text-muted-foreground">Sélectionnez une conversation.</p>}
      </div>
    </div>
  );
}
