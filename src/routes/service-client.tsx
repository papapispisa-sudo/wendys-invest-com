import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SupportChat } from "@/components/SupportChat";
import { useSession } from "@/hooks/useAccount";

export const Route = createFileRoute("/service-client")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Service client — Wendy's" },
      { name: "description", content: "Posez vos questions et envoyez vos demandes au service client Wendy's." },
      { property: "og:title", content: "Service client — Wendy's" },
      { property: "og:description", content: "Contactez le service client Wendy's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { userId } = useSession();
  return (
    <AppShell title="Service client">
      <section className="card-soft p-4">
        <h1 className="mb-1 font-display text-lg">Service client</h1>
        <p className="mb-3 text-xs text-muted-foreground">Envoyez votre demande, l'équipe vous répond ici.</p>
        {userId && <SupportChat userId={userId} />}
      </section>
    </AppShell>
  );
}
