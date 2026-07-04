import { createFileRoute } from "@tanstack/react-router";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { AiSearchPanel } from "@/components/ai/ai-search-panel";
import { browserSearchValidator } from "@/lib/search-schema";

export const Route = createFileRoute("/search")({
  validateSearch: browserSearchValidator,
  head: ({ match }) => {
    const q = (match.search as { q?: string }).q;
    return {
      meta: [
        { title: q ? `Results for "${q}" — Giftty` : "Search gifts — Giftty" },
        { name: "description", content: "Search flowers, cakes, personalized gifts and hampers across India, powered by AI." },
      ],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  return (
    <>
      <div className="container-page pt-6">
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          {search.q ? `Results for "${search.q}"` : "All gifts"}
        </h1>
      </div>
      <AiSearchPanel initialQuery={search.q} />
      <ShopBrowser search={search} routeFrom="/search" />
    </>
  );
}
