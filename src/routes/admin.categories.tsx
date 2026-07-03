import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/admin/categories")({ component: () => <PagePlaceholder title="Categories" /> });
