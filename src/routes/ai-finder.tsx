import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/ai-finder")({
  head: () => ({
    meta: [
      { title: "AI Gift Finder — Giftty" },
      { name: "description", content: "Tell us about them. Our AI recommends the perfect gift in seconds." },
    ],
  }),
  component: () => (
    <PagePlaceholder title="AI Gift Finder" description="Chat with AI to discover the perfect gift." />
  ),
});
