import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2, Heart, ArrowRight, Truck, Tag } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart, useWishlist } from "@/lib/store";
import { computeCartTotalsFn } from "@/lib/catalog.functions";
import { computeCart, type CartTotals } from "@/lib/pricing";
import { findProductBySlug, formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const updateQty = useCart((s) => s.updateQuantity);
  const remove = useCart((s) => s.remove);
  const addWishlist = useWishlist((s) => s.add);

  // Optimistic client-side totals; server-authoritative totals below.
  const clientTotals = computeCart(lines);
  const [serverTotals, setServerTotals] = useState<CartTotals | null>(null);

  useEffect(() => {
    if (!hydrated || lines.length === 0) { setServerTotals(null); return; }
    let cancelled = false;
    computeCartTotalsFn({ data: { lines } })
      .then((t) => { if (!cancelled) setServerTotals(t as CartTotals); })
      .catch(() => { /* fall back to clientTotals */ });
    return () => { cancelled = true; };
  }, [hydrated, JSON.stringify(lines)]);

  const totals = serverTotals ?? clientTotals;

  if (!hydrated) {
    return <div className="container-page py-12"><p className="text-sm text-muted-foreground">Loading cart…</p></div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-8 md:py-12">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Your cart</h1>
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add gifts you love and they'll show up here."
            action={<Button asChild><Link to="/">Continue shopping</Link></Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">{lines.length} {lines.length === 1 ? "item" : "items"}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-3">
          {totals.lines.map((line) => {
            const raw = lines.find((l) => l.id === line.id);
            const productSlug = raw?.kind === "product" ? raw.productSlug : undefined;
            return (
              <li key={line.id} className="flex gap-4 rounded-md border border-border bg-card p-4">
                <img src={line.image} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover md:h-24 md:w-24" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold md:text-base">{line.name}</h3>
                    <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(line.id)} className="h-8 w-8 shrink-0">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {line.details && (
                    <ul className="text-xs text-muted-foreground">
                      {line.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  )}
                  {line.personalizationPaise > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Personalization: <span className="price-num">+{formatINR(line.personalizationPaise)}</span>
                    </p>
                  )}
                  {line.errors && line.errors.map((e, i) => (
                    <p key={i} className="text-xs font-semibold text-destructive">{e}</p>
                  ))}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <Button variant="ghost" size="sm" onClick={() => updateQty(line.id, line.quantity - 1)} className="h-8 w-8 rounded-r-none">−</Button>
                      <span className="w-10 text-center text-sm font-semibold">{line.quantity}</span>
                      <Button variant="ghost" size="sm" onClick={() => updateQty(line.id, line.quantity + 1)} className="h-8 w-8 rounded-l-none">+</Button>
                    </div>
                    <p className="text-sm font-bold price-num">{formatINR(line.lineSubtotalPaise)}</p>
                  </div>
                  {productSlug && findProductBySlug(productSlug) && (
                    <button
                      onClick={() => { addWishlist(productSlug); remove(line.id); toast.success("Moved to wishlist"); }}
                      className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Heart className="size-3" /> Move to wishlist
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-md border border-border bg-card p-4 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Order summary</h2>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Coupon code" className="h-9 pl-8 text-sm" disabled />
            </div>
            <Button size="sm" variant="outline" disabled>Apply</Button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Coupons enabled in Phase 6.</p>

          <Separator className="my-4" />

          <dl className="grid gap-2 text-sm price-num">
            <Row label="Subtotal" value={formatINR(totals.subtotalPaise)} />
            <Row label={`Tax (${5}%)`} value={formatINR(totals.taxPaise)} />
            <Row
              label="Shipping"
              value={totals.shippingPaise === 0 ? "Free" : formatINR(totals.shippingPaise)}
              hint={totals.shippingPaise === 0 ? undefined :
                `Add ${formatINR(totals.free_shipping_threshold_paise - totals.subtotalPaise)} for free shipping`}
            />
          </dl>

          <Separator className="my-4" />

          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold">Grand total</span>
            <span className="text-xl font-bold price-num">{formatINR(totals.grandTotalPaise)}</span>
          </div>

          {totals.errors.length > 0 && (
            <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="mb-1 font-semibold">Please fix these before checkout:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {totals.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <Button
            asChild
            size="lg"
            className="mt-4 h-11 w-full"
            disabled={totals.errors.length > 0}
          >
            <Link to="/checkout">
              Proceed to checkout <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Truck className="size-3.5" /> Delivery calculated at checkout · Same-day options where available.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
