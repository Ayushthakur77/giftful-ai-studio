import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/c/$category/$subcategory")({
  head: ({ params }) => ({
    meta: [{ title: `${cap(params.subcategory)} — ${cap(params.category)} — Giftty` }],
  }),
  component: SubcategoryPage,
});

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function SubcategoryPage() {
  const { category, subcategory } = Route.useParams();
  return (
    <PagePlaceholder
      title={`${cap(subcategory)}`}
      breadcrumbs={[
        { label: cap(category), to: "/c/$category" },
        { label: cap(subcategory) },
      ]}
    />
  );
}
