import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PriceBlock } from "@/components/product/price-block";
import { PersonalizationForm, type PersonalizationValues } from "@/components/product/personalization-form";
import { findProductBySlug } from "@/lib/catalog";
import { useCart } from "@/lib/store";

export const Route = createFileRoute("/p/$slug/customize")({
  loader: ({ params }) => {
    const product = findProductBySlug(params.slug);
    if (!product) throw notFound();
    if (!product.isPersonalizable) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Personalize ${loaderData.product.name} — Giftty` : "Personalize — Giftty" }, { name: "robots", content: "noindex" }],
  }),
  component: CustomizePage,
});

function CustomizePage() {
  const { product } = Route.useLoaderData();
  const [values, setValues] = useState<PersonalizationValues>({});
  const addProduct = useCart((s) => s.addProduct);
  const navigate = useNavigate();

  function handleAdd() {
    addProduct(product.slug, 1, values);
    toast.success("Personalized gift added to cart");
    navigate({ to: "/cart" });
  }

  return (
    <div className="container-page py-6 md:py-10">
      <nav className="mb-4 text-xs text-muted-foreground">
        <ol className="flex gap-1">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li><li>/</li>
          <li><Link to="/p/$slug" params={{ slug: product.slug }} className="hover:text-foreground">{product.name}</Link></li>
          <li>/</li><li className="text-foreground">Personalize</li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <img src={product.image} alt={product.name} className="aspect-square w-full rounded-lg border border-border object-cover" />
          <h1 className="mt-4 font-display text-2xl font-bold">{product.name}</h1>
          <PriceBlock pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} className="mt-2" />
        </div>
        <div>
          <h2 className="mb-3 font-display text-xl font-bold">Personalize your gift</h2>
          <PersonalizationForm product={product} value={values} onChange={setValues} />
          <div className="mt-6 flex gap-2">
            <Button size="lg" className="flex-1" onClick={handleAdd}>Add to cart</Button>
            <Button size="lg" variant="outline" asChild><Link to="/p/$slug" params={{ slug: product.slug }}>Cancel</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
