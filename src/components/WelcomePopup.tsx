import { useEffect, useState } from "react";
import { Send, Headphones, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Remplacez ces liens par vos vrais liens
export const TELEGRAM_CHANNEL_URL = "https://t.me/wendys_invest";
export const SUPPORT_URL = "https://t.me/wendys_support";
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/wendys";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(true), []);

  const links = [
    { href: TELEGRAM_CHANNEL_URL, label: "Canal Telegram", icon: Send },
    { href: SUPPORT_URL, label: "Service client", icon: Headphones },
    { href: WHATSAPP_CHANNEL_URL, label: "Chaîne WhatsApp", icon: MessageCircle },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Bienvenue chez Wendy's 🍔</DialogTitle>
          <DialogDescription>
            Achetez un produit et recevez vos revenus chaque jour. Invitez vos amis et gagnez jusqu'à 30 % de commission.
            Rejoignez nos canaux pour ne rien manquer des nouveautés et bonus.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-bold text-primary-foreground"
            >
              <Icon className="h-4 w-4" /> {label}
            </a>
          ))}
          <button onClick={() => setOpen(false)} className="mt-1 text-sm text-muted-foreground">
            Fermer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
