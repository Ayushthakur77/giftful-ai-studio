import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Giftty" }] }),
  component: () => <PagePlaceholder title="Frequently asked questions" />,
});
