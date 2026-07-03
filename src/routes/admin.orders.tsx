import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/admin/orders")({ component: () => <PagePlaceholder title="Orders" /> });
