import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Gift } from "lucide-react";
import { HeroBanner } from "@/components/marketing/hero-banner";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { OccasionTile } from "@/components/marketing/occasion-tile";
import { SectionHeader, ProductRail } from "@/components/product/product-rail";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { PriceBlock } from "@/components/product/price-block";
import { Button } from "@/components/ui/button";
import { AiHomeRails } from "@/components/ai/ai-home-rail";
import { occasions, recipients, boxBuilderImage } from "@/lib/catalog";
import {
  listPublicProductsFn,
  listPublicCategoriesFn,
  listPublicReadyBoxesFn,
} from "@/lib/public-catalog.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Giftty — Thoughtful Gifting, Delivered Across India" },
      {
        name: "description",
        content:
          "Personalized gifts, curated boxes, same-day flowers & cakes, corporate hampers and AI-powered gift ideas — delivered across India.",
      },
      { property: "og:title", content: "Giftty — Thoughtful Gifting, Delivered Across India" },
      {
        property: "og:description",
        content:
          "Personalized gifts, gift boxes, flowers and cakes with same-day delivery across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function useProducts(flag?: "featured" | "trending" | "best_seller" | "new_arrival") {
  return useQuery({
    queryKey: ["public-products", flag ?? "all"],
    queryFn: () => listPublicProductsFn({ data: { flag, limit: 10 } }),
    staleTime: 60_000,
  });
}

function HomePage() {
  const all = useProducts();
  const trendingQ = useProducts("trending");
  const bestQ = useProducts("best_seller");
  const featuredQ = useProducts("featured");
  const newArrivalsQ = useProducts("new_arrival");
  const categoriesQ = useQuery({
    queryKey: ["public-categories-home"],
    queryFn: () => listPublicCategoriesFn(),
    staleTime: 60_000,
  });
  const readyBoxesQ = useQuery({
    queryKey: ["public-ready-boxes-home"],
    queryFn: () => listPublicReadyBoxesFn(),
    staleTime: 60_000,
  });

  const products = all.data ?? [];
  const trending = trendingQ.data ?? [];
  const bestSellers = bestQ.data ?? [];
  const featured = featuredQ.data ?? [];
  const newArrivals = newArrivalsQ.data ?? [];
  const categories = (categoriesQ.data ?? []).filter((c: any) => c.show_on_home !== false);
  const readyBoxes = readyBoxesQ.data ?? [];


  return (
    <>
      <HeroBanner />
      <TrustStrip />

      <section className="container-page py-8 md:py-10">
        <SectionHeader title="Shop by occasion" ctaLabel="See all" ctaTo="/o/birthday" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {occasions.map((o) => <OccasionTile key={o.slug} {...o} />)}
        </div>
      </section>

      <section className="container-page py-8 md:py-10">
        <SectionHeader title="Shop by recipient" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
          {recipients.map((r) => (
            <Link
              key={r.slug}
              to="/search"
              search={{ recipient: r.slug }}
              className="flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-4 text-center text-sm font-medium hover:bg-muted"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page py-8 md:py-10">
          <SectionHeader title="Shop by category" ctaLabel="Browse all" ctaTo="/search" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
            {categories.slice(0, 12).map((c: any) => (
              <Link
                key={c.slug}
                to="/c/$category"
                params={{ category: c.slug }}
                className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-border bg-card p-3 text-center transition-shadow hover:shadow-sm"
              >
                {c.icon_url ? (
                  <img src={c.icon_url} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-3xl" aria-hidden>🎁</span>
                )}
                <span className="text-xs font-medium text-foreground md:text-sm">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AiHomeRails />

      {all.isLoading ? (
        <ProductRail title="Featured gifts" subtitle="Loading…">
          {Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </ProductRail>
      ) : featured.length > 0 ? (
        <ProductRail title="Featured gifts" subtitle="Handpicked by our team" ctaLabel="Shop all" ctaTo="/search">
          {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
        </ProductRail>
      ) : products.length > 0 ? (
        <ProductRail title="All gifts" ctaLabel="Shop all" ctaTo="/search">
          {products.map((p) => <ProductCard key={p.slug} product={p} />)}
        </ProductRail>
      ) : null}


      <section className="container-page py-8 md:py-10">
        <div className="grid overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <div className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Gift className="size-3.5" /> Build Your Own Box
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">A gift box, exactly the way you want it.</h2>
            <p className="max-w-md text-sm text-muted-foreground md:text-base">
              Pick a box, add favourites, write a note, and we'll pack it with love.
            </p>
            <div>
              <Button asChild size="lg" className="h-11"><Link to="/gift-box">Start building</Link></Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto">
            <img src={boxBuilderImage} alt="Building a Giftty gift box" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="container-page py-8 md:py-10">
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-primary p-6 text-primary-foreground md:flex-row md:p-8">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-6 shrink-0" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">Not sure what to send?</h2>
              <p className="mt-1 text-sm opacity-90 md:text-base">Tell us about them. Our AI picks the perfect gift in seconds.</p>
            </div>
          </div>
          <Button asChild size="lg" variant="secondary" className="h-11 shrink-0"><Link to="/ai-finder">Try AI Gift Finder</Link></Button>
        </div>
      </section>

      {trending.length > 0 && (
        <ProductRail title="Trending now" subtitle="Loved this week across India" ctaLabel="See all" ctaTo="/search">
          {trending.map((p) => <ProductCard key={p.slug} product={p} />)}
        </ProductRail>
      )}

      {bestSellers.length > 0 && (
        <ProductRail title="Best sellers" ctaLabel="See all" ctaTo="/search">
          {bestSellers.map((p) => <ProductCard key={p.slug} product={p} />)}
        </ProductRail>
      )}


      <section className="container-page py-8 md:py-12">
        <SectionHeader title="What our customers say" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Ananya, Mumbai", text: "The personalized box arrived in 4 hours. Engraving was perfect." },
            { name: "Rohan, Bengaluru", text: "Midnight cake delivery worked exactly as promised. Loved it." },
            { name: "Priya, Delhi", text: "AI Gift Finder suggested a hamper my mom is still talking about!" },
          ].map((r) => (
            <figure key={r.name} className="rounded-md border border-border bg-card p-5">
              <div className="text-sm text-[color:var(--rating)]" aria-label="5 stars">★★★★★</div>
              <blockquote className="mt-2 text-sm text-foreground">"{r.text}"</blockquote>
              <figcaption className="mt-3 text-xs font-semibold text-muted-foreground">— {r.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
