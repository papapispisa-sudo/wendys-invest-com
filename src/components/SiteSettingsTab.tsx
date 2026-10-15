import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SiteSettingsTab() {
  const { data } = useSiteSettings();
  const qc = useQueryClient();
  const [f, setF] = useState({
    telegram_url: "", support_url: "", whatsapp_url: "",
    popup_enabled: true, popup_title: "", popup_message: "",
    announcement: "", payment_url: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setF({
      telegram_url: data.telegram_url, support_url: data.support_url, whatsapp_url: data.whatsapp_url,
      popup_enabled: data.popup_enabled, popup_title: data.popup_title, popup_message: data.popup_message,
      announcement: data.announcement, payment_url: data.payment_url,
    });
  }, [data]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_site_settings", {
      p_telegram_url: f.telegram_url.trim(), p_support_url: f.support_url.trim(), p_whatsapp_url: f.whatsapp_url.trim(),
      p_popup_enabled: f.popup_enabled, p_popup_title: f.popup_title, p_popup_message: f.popup_message,
      p_announcement: f.announcement, p_payment_url: f.payment_url.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Paramètres enregistrés");
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  };

  const field = (key: keyof typeof f, label: string, placeholder = "") => (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input value={f[key] as string} placeholder={placeholder} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
    </label>
  );

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5">
      <section className="space-y-3">
        <h3 className="font-bold">Liens de contact</h3>
        {field("telegram_url", "Canal / groupe Telegram", "https://t.me/...")}
        {field("support_url", "Service client", "https://t.me/... ou https://wa.me/225...")}
        {field("whatsapp_url", "Chaîne WhatsApp", "https://whatsapp.com/channel/...")}
      </section>
      <section className="space-y-3">
        <h3 className="font-bold">Message d'accueil (pop-up)</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.popup_enabled} onChange={(e) => setF({ ...f, popup_enabled: e.target.checked })} />
          Afficher le message à chaque visite de l'accueil
        </label>
        {field("popup_title", "Titre")}
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Message</span>
          <textarea rows={4} className="w-full rounded-md border bg-background p-2" value={f.popup_message}
            onChange={(e) => setF({ ...f, popup_message: e.target.value })} />
        </label>
      </section>
      <section className="space-y-3">
        <h3 className="font-bold">Bandeau d'annonce</h3>
        <p className="text-xs text-muted-foreground">Texte défilant en haut de l'accueil des utilisateurs. Laissez vide pour le masquer.</p>
        {field("announcement", "Annonce", "Ex : Nouveau produit disponible !")}
      </section>
      <section className="space-y-3">
        <h3 className="font-bold">Paiement</h3>
        {field("payment_url", "Lien de paiement des dépôts", "https://monniz.com/p/...")}
      </section>
      <Button onClick={save} disabled={busy} className="w-full">{busy ? "Enregistrement..." : "Enregistrer"}</Button>
    </div>
  );
}
