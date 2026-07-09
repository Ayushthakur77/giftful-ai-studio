import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { PriceBlock } from "@/components/product/price-block";
import { RatingPill } from "@/components/product/rating-pill";
import { useWishlist, useCart } from "@/lib/store";
import { getPublicProductsBySlugsFn } from "@/lib/public-catalog.functions";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({ meta: [{ title: "Your wishlist — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const slugs = useWishlist((s) => s.slugs);
  const remove = useWishlist((s) => s.remove);
  const addProduct = useCart((s) => s.addProduct);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", slugs],
    queryFn: () => getPublicProductsBySlugsFn({ data: { slugs } }),
    enabled: slugs.length > 0,
  });

  if (slugs.length === 0 || (!isLoading && items.length === 0)) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here."
        action={<Button asChild><Link to="/">Browse gifts</Link></Button>}
      />
    );
  }

  if (isLoading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Loading your wishlist…</div>;
  }


  return (
    <div className="grid gap-3">
      {items.map((p) => (
        <div key={p.slug} className="flex gap-4 rounded-md border border-border bg-card p-3">
          <Link to="/p/$slug" params={{ slug: p.slug }} className="shrink-0">
            <img src={p.image} alt={p.name} className="h-24 w-24 rounded-md object-cover md:h-28 md:w-28" />
          </Link>
          <div className="flex flex-1 flex-col gap-1.5">
            <Link to="/p/$slug" params={{ slug: p.slug }} className="text-sm font-semibold hover:text-primary md:text-base">
              {p.name}
            </Link>
            <RatingPill rating={p.rating} count={p.ratingCount} className="self-start" />
            <PriceBlock pricePaise={p.pricePaise} mrpPaise={p.mrpPaise} size="sm" />
            <div className="mt-1 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => { addProduct(p.slug); remove(p.slug); toast.success("Moved to cart"); }}
              >
                <ShoppingBag className="mr-1.5 size-3.5" /> Move to cart
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { remove(p.slug); toast("Removed"); }}>
                <Trash2 className="mr-1.5 size-3.5" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
