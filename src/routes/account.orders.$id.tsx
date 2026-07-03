import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/account/orders/$id")({
  component: () => <PagePlaceholder title="Order details" />,
});
