import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PriceBlock } from "@/components/product/price-block";
import { readyMadeGiftBoxes, findProductBySlug } from "@/lib/catalog";
import { useCart } from "@/lib/store";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/gift-boxes")({
  head: () => ({
    meta: [
      { title: "Ready-made Gift Boxes — Giftty" },
      { name: "description", content: "Curated gift boxes for every occasion — anniversary, Diwali, corporate and more." },
      { property: "og:title", content: "Ready-made Gift Boxes — Giftty" },
    ],
  }),
  component: GiftBoxesPage,
});

function GiftBoxesPage() {
  const addReadyBox = useCart((s) => s.addReadyBox);
  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Ready-made gift boxes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Curated combinations, packed and ready to send.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {readyMadeGiftBoxes.map((b) => (
          <article key={b.slug} className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
            <img src={b.image} alt={b.name} className="aspect-[4/3] w-full object-cover" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="font-display text-lg font-bold">{b.name}</h2>
              <p className="text-sm text-muted-foreground">{b.description}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {b.contents.map((c) => {
                  const p = findProductBySlug(c.productSlug);
                  return <li key={c.productSlug}>• {c.quantity}× {p?.name ?? c.productSlug}</li>;
                })}
              </ul>
              <PriceBlock pricePaise={b.pricePaise} mrpPaise={b.mrpPaise} size="md" className="mt-2" />
              <div className="mt-3 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => { addReadyBox(b.slug); toast.success(`${b.name} added to cart`); }}
                >
                  <ShoppingBag className="mr-1.5 size-4" /> Add to cart
                </Button>
                {b.isCustomizable && (
                  <Button variant="outline" asChild><Link to="/gift-box">Customize</Link></Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
