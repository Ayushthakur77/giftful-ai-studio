import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: () => <PagePlaceholder title="Forgot password" description="We'll email you a reset link." />,
});
