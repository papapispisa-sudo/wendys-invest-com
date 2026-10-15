import { useEffect, useState } from "react";
import { Send, Headphones, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function WelcomePopup() {
  const { data } = useSiteSettings();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (data?.popup_enabled) setOpen(true);
  }, [data?.popup_enabled]);

  if (!data) return null;
  const links = [
    { href: data.telegram_url, label: "Canal Telegram", icon: Send },
    { href: data.support_url, label: "Service client", icon: Headphones },
    { href: data.whatsapp_url, label: "Chaîne WhatsApp", icon: MessageCircle },
  ].filter((l) => l.href);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">{data.popup_title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">{data.popup_message}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-bold text-primary-foreground">
              <Icon className="h-4 w-4" /> {label}
            </a>
          ))}
          <button onClick={() => setOpen(false)} className="mt-1 text-sm text-muted-foreground">Fermer</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementBar() {
  const { data } = useSiteSettings();
  if (!data?.announcement) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-xl bg-accent px-3 py-2 text-sm font-medium text-primary">
      📢 {data.announcement}
    </div>
  );
}
