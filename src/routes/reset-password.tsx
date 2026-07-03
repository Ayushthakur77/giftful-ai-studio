import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: () => <PagePlaceholder title="Reset your password" />,
});
