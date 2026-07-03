import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns & Refunds — Giftty" }] }),
  component: () => <PagePlaceholder title="Returns & refunds" />,
});
