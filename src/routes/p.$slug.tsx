import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Share2, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RatingPill } from "@/components/product/rating-pill";
import { PriceBlock } from "@/components/product/price-block";
import { ProductRail } from "@/components/product/product-rail";
import { ProductCard } from "@/components/product/product-card";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/p/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found — Giftty" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.product.name} — Giftty` },
        { name: "description", content: `Buy ${loaderData.product.name} online with fast delivery across India.` },
        { property: "og:title", content: `${loaderData.product.name} — Giftty` },
        { property: "og:image", content: loaderData.product.image },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: NotFound,
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
  const { product } = Route.useLoaderData();
  return (
    <div className="container-page py-6 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-bold md:text-3xl">{product.name}</h1>
          <RatingPill rating={product.rating} count={product.ratingCount} className="self-start" />
          <PriceBlock price={product.price} mrp={product.mrp} size="lg" />
          <p className="text-sm text-muted-foreground">
            Hand-picked, premium quality, delivered fresh across India. Free shipping over ₹499.
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor="pincode" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery to
            </label>
            <div className="flex gap-2">
              <Input id="pincode" placeholder="Enter pincode" className="h-11 max-w-[200px]" inputMode="numeric" />
              <Button variant="outline" className="h-11">Check</Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="lg" className="h-11 flex-1 min-w-[140px]">Add to cart</Button>
            <Button size="lg" variant="secondary" className="h-11 flex-1 min-w-[140px]">Buy now</Button>
            {product.personalizable && (
              <Button asChild size="lg" variant="outline" className="h-11">
                <Link to="/p/$slug/customize" params={{ slug: product.slug }}>Personalize</Link>
              </Button>
            )}
            <Button size="icon" variant="outline" aria-label="Add to wishlist" className="h-11 w-11"><Heart className="size-4" /></Button>
            <Button size="icon" variant="outline" aria-label="Share" className="h-11 w-11"><Share2 className="size-4" /></Button>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Same-day delivery</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Secure checkout</li>
          </ul>
        </div>
      </div>

      <ProductRail title="You may also like" ctaLabel="See more" ctaTo="/c/personalized">
        {products.filter((p) => p.slug !== product.slug).slice(0, 5).map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    </div>
  );
}
