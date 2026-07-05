import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicRelationshipBySlugFn, listProductsByRelationshipFn } from "@/lib/taxonomy.functions";
import { ProductGrid, TaxonomyHero } from "./r.$recipient";

const CANON = "https://giftful-ai-studio.lovable.app";

const relQO = (slug: string) => queryOptions({
  queryKey: ["public-relationship", slug],
  queryFn: async () => {
    const r = await getPublicRelationshipBySlugFn({ data: { slug } });
    if (!r) throw notFound();
    return r;
  },
});

const productsQO = (slug: string) => queryOptions({
  queryKey: ["public-relationship-products", slug],
  queryFn: () => listProductsByRelationshipFn({ data: { slug, limit: 60 } }),
});

export const Route = createFileRoute("/rel/$relationship")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(relQO(params.relationship));
    context.queryClient.prefetchQuery(productsQO(params.relationship));
  },
  head: ({ params }) => {
    const label = titleCase(params.relationship);
    return {
      meta: [
        { title: `Gifts for ${label} — Giftty` },
        { name: "description", content: `Thoughtful gift ideas for your ${label.toLowerCase()} with fast delivery across India.` },
        { property: "og:title", content: `Gifts for ${label} — Giftty` },
        { property: "og:url", content: `${CANON}/rel/${params.relationship}` },
      ],
      links: [{ rel: "canonical", href: `${CANON}/rel/${params.relationship}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: CANON },
            { "@type": "ListItem", position: 2, name: "Shop by Relationship", item: `${CANON}/relationships` },
            { "@type": "ListItem", position: 3, name: label },
          ],
        }),
      }],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: NotFound,
  component: RelationshipPage,
});

function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Relationship not found</h1>
      <p className="mt-2 text-muted-foreground">Try browsing <Link to="/shop" className="underline">all gifts</Link>.</p>
    </div>
  );
}

function RelationshipPage() {
  const { relationship } = Route.useParams();
  const { data: rel } = useSuspenseQuery(relQO(relationship));
  const { data: products } = useSuspenseQuery(productsQO(relationship));
  return (
    <div className="container-page py-8">
      <TaxonomyHero item={rel} />
      <ProductGrid products={products} emptyLabel={`No products tagged for ${rel.name} yet.`} />
    </div>
  );
}
