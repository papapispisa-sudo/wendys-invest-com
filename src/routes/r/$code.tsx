import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$code")({
  ssr: false,
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/", search: { ref: params.code } });
  },
});
