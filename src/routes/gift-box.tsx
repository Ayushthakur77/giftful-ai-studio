import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/gift-box")({
  head: () => ({
    meta: [
      { title: "Build Your Own Gift Box — Giftty" },
      { name: "description", content: "Design a custom gift box in 6 easy steps and let us pack it with love." },
      { property: "og:title", content: "Build Your Own Gift Box — Giftty" },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Build your own gift box"
      description="A 6-step wizard: choose box → add items → greeting → note → summary → cart."
    />
  ),
});
