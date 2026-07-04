import { useEffect, useState } from "react";
import { ProductRail } from "@/components/product/product-rail";
import { ProductCard } from "@/components/product/product-card";
import { findProductBySlug } from "@/lib/catalog";
import { aiHomepageFn } from "@/lib/ai.functions";
import { useWishlist, getRecentlyViewed } from "@/lib/store";

type Section = {
  key: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  ctaLabel?: string;
  ctaTo?: string;
  productSlugs: string[];
};

export function AiHomeRails() {
  const wishlist = useWishlist((s) => s.slugs);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await aiHomepageFn({
          data: { wishlistSlugs: wishlist.slice(0, 20), recentSlugs: getRecentlyViewed().slice(0, 20) },
        });
        if (alive && res.ok) setSections(res.sections);
      } catch {
        // silent — homepage falls back to static rails
      }
    })();
    return () => { alive = false; };
  }, [wishlist]);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((s) => {
        const items = s.productSlugs.map(findProductBySlug).filter((p): p is NonNullable<typeof p> => !!p);
        if (items.length === 0) return null;
        return (
          <ProductRail
            key={s.key}
            title={`${s.emoji ? s.emoji + " " : ""}${s.title}`}
            subtitle={s.subtitle}
            ctaLabel={s.ctaLabel}
            ctaTo={s.ctaTo as never}
          >
            {items.map((p) => <ProductCard key={p.slug} product={p} />)}
          </ProductRail>
        );
      })}
    </>
  );
}
