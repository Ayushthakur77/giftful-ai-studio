import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { browserSearchValidator } from "@/lib/search-schema";
import { findOccasionBySlug, type OccasionSlug } from "@/lib/catalog";

export const Route = createFileRoute("/o/$occasion")({
  validateSearch: browserSearchValidator,
  loader: ({ params }) => {
    const o = findOccasionBySlug(params.occasion);
    if (!o) throw notFound();
    return { occasion: o };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Occasion — Giftty" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.occasion.name} gifts — Giftty`;
    return {
      meta: [
        { title },
        { name: "description", content: `Handpicked ${loaderData.occasion.name.toLowerCase()} gifts with same-day delivery across India.` },
      ],
    };
  },
  component: OccasionPage,
  notFoundComponent: () => (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Occasion not found</h1>
    </div>
  ),
});

function OccasionPage() {
  const { occasion } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <>
      <div className="container-page pt-6">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{occasion.name} gifts {occasion.emoji}</h1>
      </div>
      <ShopBrowser search={search} routeFrom="/o/$occasion" lockOccasion={occasion.slug as OccasionSlug} />
    </>
  );
}
