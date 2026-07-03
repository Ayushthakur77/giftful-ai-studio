import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/account/settings")({
  component: () => <PagePlaceholder title="Settings" description="Notifications, password, and account preferences." />,
});
