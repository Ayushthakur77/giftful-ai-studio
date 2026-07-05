import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceBlock } from "@/components/product/price-block";
import { EmptyState } from "@/components/feedback/empty-state";
import { listPublicReadyBoxesFn } from "@/lib/public-catalog.functions";
import { useCart } from "@/lib/store";

export const Route = createFileRoute("/gift-boxes")({
  head: () => ({
    meta: [
      { title: "Ready-made Gift Boxes — Giftty" },
      { name: "description", content: "Curated gift boxes for every occasion — anniversary, Diwali, corporate and more." },
      { property: "og:title", content: "Ready-made Gift Boxes — Giftty" },
      { property: "og:description", content: "Curated gift boxes, packed and ready to send across India." },
    ],
  }),
  component: GiftBoxesPage,
});

function GiftBoxesPage() {
  const addReadyBox = useCart((s) => s.addReadyBox);
  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ["public-ready-boxes"],
    queryFn: () => listPublicReadyBoxesFn(),
    staleTime: 30_000,
  });

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Ready-made gift boxes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Curated combinations, packed and ready to send.</p>

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
              <div className="aspect-[4/3] w-full animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : boxes.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={PackageSearch}
            title="No ready-made boxes yet"
            description="New curated boxes coming soon. In the meantime, build your own!"
            action={<Button asChild><Link to="/gift-box">Build a gift box</Link></Button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boxes.map((b) => (
            <article key={b.slug} className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
              <img src={b.image} alt={b.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="font-display text-lg font-bold">{b.name}</h2>
                {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                {b.items.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {b.items.slice(0, 5).map((c, i) => (
                      <li key={`${c.productSlug}-${i}`}>• {c.quantity}× {c.productSlug}</li>
                    ))}
                  </ul>
                )}
                <PriceBlock pricePaise={b.pricePaise} mrpPaise={b.mrpPaise} size="md" className="mt-2" />
                <div className="mt-3 flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={b.stock <= 0}
                    onClick={() => { addReadyBox(b.slug); toast.success(`${b.name} added to cart`); }}
                  >
                    <ShoppingBag className="mr-1.5 size-4" /> {b.stock <= 0 ? "Out of stock" : "Add to cart"}
                  </Button>
                  <Button variant="outline" asChild><Link to="/gift-box">Customize</Link></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
