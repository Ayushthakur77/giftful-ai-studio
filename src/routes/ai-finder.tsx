import { createFileRoute } from "@tanstack/react-router";
import { AiAssistant } from "@/components/ai/ai-assistant";

export const Route = createFileRoute("/ai-finder")({
  head: () => ({
    meta: [
      { title: "AI Gift Finder — Giftty" },
      { name: "description", content: "Tell us about them. Our AI recommends the perfect gift in seconds — with editable results." },
      { property: "og:title", content: "AI Gift Finder — Giftty" },
      { property: "og:description", content: "AI-powered gift recommendations, gift-box building, and greeting messages for every Indian occasion." },
    ],
  }),
  component: AiAssistant,
});
