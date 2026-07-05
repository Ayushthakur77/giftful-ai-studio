import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeroBanner } from "@/components/marketing/hero-banner";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { OccasionTile } from "@/components/marketing/occasion-tile";
import { SectionHeader } from "@/components/product/product-rail";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";
import { HomepageRenderer } from "@/components/homepage/homepage-renderer";
import { getHomepageLayoutFn } from "@/lib/homepage.functions";
import { occasions, boxBuilderImage } from "@/lib/catalog";

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

function HomePage() {
  const layoutQ = useQuery({
    queryKey: ["homepage-layout"],
    queryFn: () => getHomepageLayoutFn(),
    staleTime: 60_000,
  });

  const sections = layoutQ.data ?? [];
  console.log("[client homepage]", { isLoading: layoutQ.isLoading, length: sections.length, sections: sections.map((s) => s.kind) });

  // If nothing is configured yet, render a graceful default so the site
  // is never empty. Admin can then customize via /admin/homepage-builder.
  if (!layoutQ.isLoading && sections.length === 0) {
    return <DefaultHomepage />;
  }

  return <HomepageRenderer sections={sections} />;
}

/* Minimal fallback when no homepage sections have been configured yet. */
function DefaultHomepage() {
  return (
    <>
      <HeroBanner />
      <TrustStrip />

      <section className="container-page py-8 md:py-10">
        <SectionHeader title="Shop by occasion" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {occasions.map((o) => <OccasionTile key={o.slug} {...o} />)}
        </div>
      </section>

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
    </>
  );
}
