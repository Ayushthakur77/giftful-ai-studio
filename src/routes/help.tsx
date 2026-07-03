import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center — Giftty" }] }),
  component: () => <PagePlaceholder title="Help center" />,
});
