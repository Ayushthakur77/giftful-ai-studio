import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — Giftty" }] }),
  component: () => <PagePlaceholder title="Shipping policy" />,
});
