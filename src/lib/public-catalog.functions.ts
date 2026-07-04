/**
 * Public (customer-facing) product/category reads backed by the DB.
 *
 * Uses the server publishable Supabase client so RLS applies as `anon`.
 * The "products public read" policy exposes rows with status='active'.
 *
 * We map DB rows into the Phase 5 `Product` shape so existing UI
 * components (ProductCard, ProductPage, etc.) work unchanged.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Product, CategorySlug, OccasionSlug, RecipientSlug } from "./catalog";

function client() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type DbProduct = {
  id: string; slug: string; sku: string | null; name: string;
  description: string | null;
  category_id: string | null;
  price_paise: number; offer_price_paise: number | null;
  stock: number; weight_grams: number | null;
  images: unknown; tags: string[] | null; festival_tags: string[] | null;
  is_featured: boolean; is_trending: boolean;
  is_new_arrival: boolean; is_best_seller: boolean;
  gift_builder_compatible: boolean;
  seo_title: string | null; seo_description: string | null;
  categories?: { slug: string } | null;
};

const PLACEHOLDER = "/placeholder.svg";

function toProduct(r: DbProduct): Product {
  const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const gallery = images.length ? images : [PLACEHOLDER];
  const price = r.offer_price_paise ?? r.price_paise;
  const mrp = r.offer_price_paise ? r.price_paise : undefined;
  const badge =
    r.is_new_arrival ? "New" :
    r.is_best_seller ? "Best Seller" :
    r.is_trending ? "Trending" :
    r.is_featured ? "Featured" : undefined;

  return {
    slug: r.slug,
    sku: r.sku ?? "",
    name: r.name,
    shortDescription: (r.seo_description ?? r.description ?? "").slice(0, 160),
    description: r.description ?? "",
    image: gallery[0]!,
    gallery,
    category: (r.categories?.slug ?? "personalized") as CategorySlug,
    occasions: [] as OccasionSlug[],
    recipients: [] as RecipientSlug[],
    tags: r.tags ?? [],
    pricePaise: price,
    mrpPaise: mrp,
    weightGrams: r.weight_grams ?? 0,
    stock: r.stock,
    rating: 0,
    ratingCount: 0,
    badge,
    isPersonalizable: false,
    isGiftBoxCompatible: r.gift_builder_compatible,
    isFeatured: r.is_featured,
    isTrending: r.is_trending,
    isBestSeller: r.is_best_seller,
    specs: [],
  };
}

const SELECT = "id,slug,sku,name,description,category_id,price_paise,offer_price_paise,stock,weight_grams,images,tags,festival_tags,is_featured,is_trending,is_new_arrival,is_best_seller,gift_builder_compatible,seo_title,seo_description,categories(slug)";

export const listPublicProductsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      flag: z.enum(["featured", "trending", "best_seller", "new_arrival"]).optional(),
      categorySlug: z.string().optional(),
      limit: z.number().int().min(1).max(60).default(20),
    }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = client();
    let q = sb.from("products").select(SELECT).eq("status", "active");
    if (data.flag === "featured") q = q.eq("is_featured", true);
    if (data.flag === "trending") q = q.eq("is_trending", true);
    if (data.flag === "best_seller") q = q.eq("is_best_seller", true);
    if (data.flag === "new_arrival") q = q.eq("is_new_arrival", true);
    if (data.categorySlug) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
      else return [];
    }
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw error;
    return (rows ?? []).map((r) => toProduct(r as unknown as DbProduct));
  });

export const getPublicProductBySlugFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const sb = client();
    const { data: row } = await sb.from("products").select(SELECT).eq("slug", data.slug).eq("status", "active").maybeSingle();
    if (!row) return null;
    const product = toProduct(row as unknown as DbProduct);
    const { data: rel } = await sb.from("products").select(SELECT)
      .eq("status", "active").neq("slug", data.slug).limit(8);
    const related = (rel ?? []).map((r) => toProduct(r as unknown as DbProduct));
    return { product, related };
  });

export const listPublicCategoriesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = client();
    const { data } = await sb.from("categories").select("slug,name,description,sort_order").eq("visible", true).order("sort_order");
    return data ?? [];
  });
