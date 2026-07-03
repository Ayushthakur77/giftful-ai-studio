import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
export const Route = createFileRoute("/admin/homepage-builder")({ component: () => <PagePlaceholder title="Homepage builder" /> });
