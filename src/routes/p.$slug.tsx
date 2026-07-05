import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Heart, Share2, Truck, ShieldCheck, ShoppingBag, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RatingPill } from "@/components/product/rating-pill";
import { PriceBlock } from "@/components/product/price-block";
import { ProductRail } from "@/components/product/product-rail";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/catalog";
import { useCart, useWishlist, pushRecentlyViewed } from "@/lib/store";
import { PersonalizationForm, type PersonalizationValues } from "@/components/product/personalization-form";
import { checkPincodeFn } from "@/lib/catalog.functions";
import { getPublicProductBySlugFn } from "@/lib/public-catalog.functions";
import { getRecommendationsFn } from "@/lib/discovery.functions";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const result = await getPublicProductBySlugFn({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found — Giftty" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — Giftty` },
        { name: "description", content: p.shortDescription },
        { property: "og:title", content: `${p.name} — Giftty` },
        { property: "og:description", content: p.shortDescription },
        { property: "og:image", content: p.image },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Product not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This gift may have been removed.</p>
      <Button asChild className="mt-4"><Link to="/">Back to home</Link></Button>
    </div>
  );
}

function ProductPage() {
  const { product, related } = Route.useLoaderData();

  const [activeImage, setActiveImage] = useState(0);
  const [personalization, setPersonalization] = useState<PersonalizationValues>({});
  const [quantity, setQuantity] = useState(1);
  const addProduct = useCart((s) => s.addProduct);
  const wishlisted = useWishlist((s) => s.slugs.includes(product.slug));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const navigate = useNavigate();

  useEffect(() => { pushRecentlyViewed(product.slug); }, [product.slug]);

  const hasPersonalization = Object.values(personalization).some((v) => v && v.trim().length > 0);

  function handleAdd() {
    if (product.stock <= 0) return toast.error("Out of stock");
    addProduct(product.slug, quantity, hasPersonalization ? personalization : undefined);
    toast.success(`${product.name} added to cart`);
  }
  function handleBuyNow() {
    handleAdd();
    navigate({ to: "/cart" });
  }

  return (
    <div className="container-page py-6 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/c/$category" params={{ category: product.category }} className="hover:text-foreground capitalize">
              {product.category}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <img
              src={product.gallery[activeImage] ?? product.image}
              alt={product.name}
              className="aspect-square w-full object-cover transition-transform hover:scale-105"
            />
          </div>
          {product.gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.gallery.map((g: string, i: number) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                    i === activeImage ? "border-primary" : "border-border hover:border-muted-foreground",
                  )}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{product.category}</Badge>
            {product.badge && <Badge>{product.badge}</Badge>}
            {product.isPersonalizable && <Badge variant="outline">Personalizable</Badge>}
            {product.isGiftBoxCompatible && <Badge variant="outline">Gift-box ready</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{product.name}</h1>
          <p className="text-sm text-muted-foreground md:text-base">{product.shortDescription}</p>
          <RatingPill rating={product.rating} count={product.ratingCount} className="self-start" />
          <PriceBlock pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="lg" />

          <StockLabel product={product} />

          <DeliveryEstimator />

          {product.isPersonalizable && (
            <div className="mt-2 rounded-md border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Make it yours</h3>
              <PersonalizationForm product={product} value={personalization} onChange={setPersonalization} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</span>
            <div className="inline-flex items-center rounded-md border border-border">
              <Button variant="ghost" size="sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-r-none">−</Button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <Button variant="ghost" size="sm" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="h-9 w-9 rounded-l-none">+</Button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="lg" className="h-11 flex-1 min-w-[140px]" onClick={handleAdd} disabled={product.stock <= 0}>
              <ShoppingBag className="mr-2 size-4" /> Add to cart
            </Button>
            <Button size="lg" variant="secondary" className="h-11 flex-1 min-w-[140px]" onClick={handleBuyNow} disabled={product.stock <= 0}>
              Buy now
            </Button>
            <Button
              size="icon"
              variant={wishlisted ? "default" : "outline"}
              onClick={() => toggleWishlist(product.slug)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="h-11 w-11"
            >
              <Heart className={cn("size-4", wishlisted && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  void navigator.share({ title: product.name, url: window.location.href });
                } else if (typeof navigator !== "undefined") {
                  void (navigator as Navigator).clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }
              }}
              aria-label="Share"
              className="h-11 w-11"
            >
              <Share2 className="size-4" />
            </Button>
          </div>

          <ul className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Same-day delivery available</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Secure checkout</li>
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.ratingCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose prose-sm max-w-none pt-4 text-sm leading-relaxed">
            <p>{product.description}</p>
          </TabsContent>
          <TabsContent value="specs" className="pt-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {(product.specs ?? []).map((s: { label: string; value: string }) => (
                <div key={s.label} className="flex justify-between border-b border-border py-2">
                  <dt className="font-medium text-muted-foreground">{s.label}</dt>
                  <dd className="text-foreground">{s.value}</dd>
                </div>
              ))}
              <div className="flex justify-between border-b border-border py-2">
                <dt className="font-medium text-muted-foreground">SKU</dt><dd>{product.sku}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt className="font-medium text-muted-foreground">Weight</dt><dd>{product.weightGrams} g</dd>
              </div>
            </dl>
          </TabsContent>
          <TabsContent value="reviews" className="pt-4 text-sm text-muted-foreground">
            Verified customer reviews will appear here in Phase 6.
          </TabsContent>
        </Tabs>
      </div>

      {related.length > 0 && (
        <ProductRail title="You may also like" ctaLabel="See more" ctaTo="/search">
          {related.slice(0, 5).map((p: Product) => <ProductCard key={p.slug} product={p} />)}
        </ProductRail>
      )}

      <TrendingRail excludeSlug={product.slug} />
    </div>
  );
}

function TrendingRail({ excludeSlug }: { excludeSlug: string }) {
  const q = useQuery({
    queryKey: ["recs", "trending", excludeSlug],
    queryFn: () => getRecommendationsFn({ data: { kind: "trending", excludeSlug, limit: 10 } }),
    staleTime: 60_000,
  });
  const items = q.data ?? [];
  if (items.length === 0) return null;
  return (
    <ProductRail title="Trending picks" ctaLabel="Browse all" ctaTo="/search">
      {items.slice(0, 8).map((p: Product) => <ProductCard key={p.slug} product={p} />)}
    </ProductRail>
  );
}

function StockLabel({ product }: { product: Product }) {
  if (product.stock <= 0) return <p className="text-sm font-semibold text-destructive">Out of stock</p>;
  if (product.stock <= 5) return <p className="text-sm font-semibold text-warning">Only {product.stock} left!</p>;
  return <p className="text-sm font-semibold text-success">In stock</p>;
}

function DeliveryEstimator() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<null | { serviceable: boolean; estimate: string; codAvailable: boolean }>(null);
  const [checking, setChecking] = useState(false);
  async function check() {
    if (!/^\d{6}$/.test(pincode)) { toast.error("Enter a valid 6-digit pincode"); return; }
    setChecking(true);
    try {
      const r = await checkPincodeFn({ data: { pincode } });
      setResult({ serviceable: r.serviceable, estimate: r.estimate, codAvailable: r.codAvailable });
    } catch { toast.error("Could not check delivery"); }
    finally { setChecking(false); }
  }
  return (
    <div>
      <label htmlFor="pincode" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery to</label>
      <div className="mt-1 flex gap-2">
        <Input id="pincode" placeholder="Enter pincode" className="h-11 max-w-[200px]" inputMode="numeric" maxLength={6}
          value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <Button variant="outline" className="h-11" onClick={check} disabled={checking}>Check</Button>
      </div>
      {result && (
        <p className="mt-2 flex items-center gap-1.5 text-sm">
          {result.serviceable ? <Check className="size-4 text-success" /> : <X className="size-4 text-destructive" />}
          <span>{result.estimate}{result.codAvailable ? " · COD available" : ""}</span>
        </p>
      )}
    </div>
  );
}
