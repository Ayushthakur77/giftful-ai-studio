import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Search — Giftty" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  return (
    <PagePlaceholder
      title={q ? `Results for "${q}"` : "Search"}
      description="Search results with filters and sort will appear here."
    />
  );
}
