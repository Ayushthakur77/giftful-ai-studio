import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingPill } from "./rating-pill";
import { PriceBlock } from "./price-block";
import type { MockProduct } from "@/lib/mock-data";

export function ProductCard({ product }: { product: MockProduct }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-sm">
      <Link
        to="/p/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-surface"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-sm bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
            {product.badge}
          </span>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Add ${product.name} to wishlist`}
        className="absolute right-2 top-2 h-9 w-9 rounded-full bg-background/90 hover:bg-background"
      >
        <Heart className="size-4" />
      </Button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          to="/p/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary md:text-base"
        >
          {product.name}
        </Link>
        <RatingPill rating={product.rating} count={product.ratingCount} className="self-start" />
        <PriceBlock price={product.price} mrp={product.mrp} size="sm" />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
      <div className="aspect-square animate-pulse rounded-sm bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
