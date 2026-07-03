import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Checkout" description="Address + payment on a single page." />
  ),
});
