import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import {
  getPublicRecipientBySlugFn,
  listProductsByRecipientFn,
  type TaxonomyItem,
  type TaxonomyProduct,
} from "@/lib/taxonomy.functions";
import { PriceBlock } from "@/components/product/price-block";
import { EmptyState } from "@/components/feedback/empty-state";

const CANON = "https://giftful-ai-studio.lovable.app";

const recipientQO = (slug: string) => queryOptions({
  queryKey: ["public-recipient", slug],
  queryFn: async () => {
    const r = await getPublicRecipientBySlugFn({ data: { slug } });
    if (!r) throw notFound();
    return r;
  },
});

const productsQO = (slug: string) => queryOptions({
  queryKey: ["public-recipient-products", slug],
  queryFn: () => listProductsByRecipientFn({ data: { slug, limit: 60 } }),
});

export const Route = createFileRoute("/r/$recipient")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(recipientQO(params.recipient));
    context.queryClient.prefetchQuery(productsQO(params.recipient));
  },
  head: ({ params, loaderData: _l }) => {
    // Read cached recipient for title, fall back to slug if the loader threw.
    return {
      meta: [
        { title: `Gifts for ${titleCase(params.recipient)} — Giftty` },
        { name: "description", content: `Handpicked gift ideas for ${titleCase(params.recipient)} with fast delivery across India.` },
        { property: "og:title", content: `Gifts for ${titleCase(params.recipient)} — Giftty` },
        { property: "og:url", content: `${CANON}/r/${params.recipient}` },
      ],
      links: [{ rel: "canonical", href: `${CANON}/r/${params.recipient}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: CANON },
            { "@type": "ListItem", position: 2, name: "Shop by Recipient", item: `${CANON}/recipients` },
            { "@type": "ListItem", position: 3, name: titleCase(params.recipient) },
          ],
        }),
      }],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: NotFound,
  component: RecipientPage,
});

function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Recipient not found</h1>
      <p className="mt-2 text-muted-foreground">Try browsing all our <Link to="/search" className="underline">gifts</Link>.</p>
    </div>
  );
}

function RecipientPage() {
  const { recipient } = Route.useParams();
  const { data: rec } = useSuspenseQuery(recipientQO(recipient));
  const { data: products } = useSuspenseQuery(productsQO(recipient));

  return (
    <div className="container-page py-8">
      <TaxonomyHero item={rec} />
      <ProductGrid products={products} emptyLabel={`No products tagged for ${rec.name} yet.`} />
    </div>
  );
}

export function TaxonomyHero({ item }: { item: TaxonomyItem }) {
  return (
    <header className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-secondary/50 to-background px-6 py-10 md:px-10 md:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Shop by Recipient</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{item.name}</h1>
      {item.tagline && <p className="mt-3 max-w-xl text-muted-foreground">{item.tagline}</p>}
    </header>
  );
}

export function ProductGrid({ products, emptyLabel }: { products: TaxonomyProduct[]; emptyLabel: string }) {
  if (!products.length) return <EmptyState title="Nothing here yet" description={emptyLabel} />;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <Link
          key={p.id}
          to="/p/$slug"
          params={{ slug: p.slug }}
          className="group overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-md"
        >
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={p.images[0] ?? "/placeholder.svg"}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          </div>
          <div className="p-3">
            <h3 className="line-clamp-2 text-sm font-medium">{p.name}</h3>
            <div className="mt-2">
              <PriceBlock pricePaise={p.offer_price_paise ?? p.price_paise} mrpPaise={p.offer_price_paise ? p.price_paise : undefined} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
