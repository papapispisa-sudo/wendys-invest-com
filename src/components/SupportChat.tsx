import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TOPICS = [
  "Problème de dépôt",
  "Problème de retrait",
  "Achat de produit",
  "Revenus journaliers",
  "Parrainage / commissions",
  "Code bonus",
  "Mon compte",
  "Autre question",
];

function SupportImage({ path }: { path: string }) {
  const { data: url } = useQuery({
    queryKey: ["support-img", path],
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("support").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  });
  if (!url) return <div className="h-32 w-40 animate-pulse rounded-lg bg-muted" />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Image jointe" className="mb-1 max-h-60 rounded-lg object-cover" />
    </a>
  );
}

export function SupportChat({ userId, asAdmin = false }: { userId: string; asAdmin?: boolean }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const preview = file ? URL.createObjectURL(file) : null;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
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
    if (!body && !file) return;
    if (body.length > 2000) { toast.error("Message trop long (2000 caractères max)"); return; }
    setBusy(true);
    let image_path: string | null = null;
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      image_path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("support").upload(image_path, file, { contentType: file.type });
      if (up.error) { setBusy(false); toast.error("Envoi de l'image impossible : " + up.error.message); return; }
    }
    const { error } = await supabase.from("support_messages").insert({ user_id: userId, from_admin: asAdmin, body, image_path });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setText(""); setFile(null);
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
                {m.image_path && <SupportImage path={m.image_path} />}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                <p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {!asAdmin && (
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Objet de votre demande</p>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <button key={t} type="button" onClick={() => setText((v) => `[${t}] ` + v.replace(/^\[[^\]]*\]\s*/, ""))}
                className="rounded-full border bg-card px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {preview && (
        <div className="relative w-fit">
          <img src={preview} alt="Aperçu" className="h-24 rounded-lg object-cover" />
          <button type="button" onClick={() => setFile(null)} aria-label="Retirer l'image"
            className="absolute -right-2 -top-2 rounded-full bg-primary p-1 text-primary-foreground"><X className="h-3 w-3" /></button>
        </div>
      )}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          if (!f.type.startsWith("image/")) { toast.error("Seules les images sont acceptées"); return; }
          if (f.size > 5 * 1024 * 1024) { toast.error("Image trop lourde (5 Mo max)"); return; }
          setFile(f);
        }} />
        <Button type="button" variant="outline" className="h-auto" aria-label="Joindre une image" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </Button>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
          placeholder={asAdmin ? "Votre réponse..." : "Votre message..."}
          className="flex-1 rounded-xl border bg-background p-2 text-sm" />
        <Button onClick={send} disabled={busy || (!text.trim() && !file)} className="h-auto" aria-label="Envoyer">
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
            <p className="truncate text-xs text-muted-foreground">{t.last_body || "📷 Image"}</p>
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
