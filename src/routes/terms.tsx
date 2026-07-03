import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Giftty" }] }),
  component: () => <PagePlaceholder title="Terms of service" />,
});
