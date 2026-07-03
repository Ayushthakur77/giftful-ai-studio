import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/p/$slug/customize")({
  head: () => ({ meta: [{ title: "Personalize your gift — Giftty" }] }),
  component: () => <PagePlaceholder title="Personalize your gift" description="Text, images, live preview." />,
});
