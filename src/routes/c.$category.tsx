import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/c/$category")({
  head: ({ params }) => {
    const title = `${cap(params.category)} Gifts — Giftty`;
    return {
      meta: [
        { title },
        { name: "description", content: `Shop ${params.category} gifts online with same-day delivery across India.` },
        { property: "og:title", content: title },
      ],
    };
  },
  component: CategoryPage,
});

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function CategoryPage() {
  const { category } = Route.useParams();
  return (
    <PagePlaceholder
      title={`${cap(category)} gifts`}
      description="Filters, sort, and product grid will live here."
      breadcrumbs={[{ label: cap(category) }]}
    />
  );
}
