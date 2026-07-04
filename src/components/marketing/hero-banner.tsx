import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { heroImage } from "@/lib/mock-data";

export function HeroBanner() {
  return (
    <section className="container-page pt-6 md:pt-8">
      <div className="grid overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 p-6 md:p-10 lg:p-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Thoughtful gifting, delivered
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Send joy across India in a click.
          </h1>
          <p className="max-w-md text-sm text-muted-foreground md:text-base">
            Personalized gifts, same-day flowers &amp; cakes, curated hampers, and
            AI-powered gift ideas — all in one place.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11">
              <Link to={"/c/personalized" as any}>Shop personalized</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link to="/gift-box">Build a gift box</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] md:aspect-auto">
          <img
            src={heroImage}
            alt="A curated Giftty gift box with flowers, chocolates and a handwritten card"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
