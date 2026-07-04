import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingPill } from "./rating-pill";
import { PriceBlock } from "./price-block";
import { toast } from "sonner";
import { useCart, useWishlist } from "@/lib/store";
import { findProductBySlug, type Product } from "@/lib/catalog";
import type { MockProduct } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Accepts either a full `Product` (new Phase 5 shape) or the legacy
 * `MockProduct` (used by a handful of unmigrated call sites). The card
 * normalises to `Product` before rendering.
 */
export function ProductCard({ product }: { product: Product | MockProduct }) {
  const p = normalize(product);
  if (!p) return null;

  const wishlisted = useWishlist((s) => s.slugs.includes(p.slug));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const addProduct = useCart((s) => s.addProduct);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (p!.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    addProduct(p!.slug);
    toast.success(`${p!.name} added to cart`);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(p!.slug);
    toast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-sm">
      <Link
        to="/p/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-square overflow-hidden bg-surface"
      >
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {p.badge && (
          <span className="absolute left-2 top-2 rounded-sm bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
            {p.badge}
          </span>
        )}
        {p.stock <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={wishlisted ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        onClick={handleWishlist}
        className="absolute right-2 top-2 h-9 w-9 rounded-full bg-background/90 hover:bg-background"
      >
        <Heart className={cn("size-4", wishlisted && "fill-primary text-primary")} />
      </Button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          to="/p/$slug"
          params={{ slug: p.slug }}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary md:text-base"
        >
          {p.name}
        </Link>
        <RatingPill rating={p.rating} count={p.ratingCount} className="self-start" />
        <PriceBlock pricePaise={p.pricePaise} mrpPaise={p.mrpPaise} size="sm" />
        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 flex-1 text-xs"
            onClick={handleAdd}
            disabled={p.stock <= 0}
          >
            <ShoppingBag className="mr-1.5 size-3.5" /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}

function normalize(input: Product | MockProduct): Product | null {
  if ("pricePaise" in input) return input;
  // Legacy MockProduct — look up the real product.
  return findProductBySlug(input.slug) ?? null;
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
