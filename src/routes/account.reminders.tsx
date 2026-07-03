import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/account/reminders")({
  component: () => <PagePlaceholder title="Gift reminders" description="Never miss a birthday or anniversary again." />,
});
