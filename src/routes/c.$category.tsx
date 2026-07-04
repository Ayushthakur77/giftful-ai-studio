import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { browserSearchValidator } from "@/lib/search-schema";
import { findCategoryBySlug, type CategorySlug } from "@/lib/catalog";

export const Route = createFileRoute("/c/$category")({
  validateSearch: browserSearchValidator,
  loader: ({ params }) => {
    const c = findCategoryBySlug(params.category);
    if (!c) throw notFound();
    return { category: c };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Category — Giftty" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.category.name} gifts — Giftty`;
    return {
      meta: [
        { title },
        { name: "description", content: `Shop ${loaderData.category.name.toLowerCase()} — ${loaderData.category.description}. Same-day delivery across India.` },
        { property: "og:title", content: title },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Category not found</h1>
    </div>
  ),
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <>
      <div className="container-page pt-6">
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted-foreground">
          <ol className="flex gap-1"><li>Home</li><li aria-hidden>/</li><li className="text-foreground">{category.name}</li></ol>
        </nav>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{category.name} gifts</h1>
        <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
      </div>
      <ShopBrowser search={search} routeFrom="/c/$category" lockCategory={category.slug as CategorySlug} />
    </>
  );
}
