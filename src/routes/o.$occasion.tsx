import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const Route = createFileRoute("/o/$occasion")({
  head: ({ params }) => ({
    meta: [
      { title: `${cap(params.occasion)} Gifts — Giftty` },
      { name: "description", content: `Gifts for ${params.occasion} — delivered across India.` },
    ],
  }),
  component: OccasionPage,
});

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function OccasionPage() {
  const { occasion } = Route.useParams();
  return (
    <PagePlaceholder
      title={`${cap(occasion)} gifts`}
      breadcrumbs={[{ label: cap(occasion) }]}
    />
  );
}
