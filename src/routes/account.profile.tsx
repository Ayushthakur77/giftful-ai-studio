import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/account/profile")({
  component: () => <PagePlaceholder title="Profile" description="Manage your name, email, and phone." />,
});
