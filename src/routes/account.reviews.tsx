import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/account/reviews")({
  component: () => <PagePlaceholder title="My reviews" />,
});
