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
      giftBoxCompatibleOnly: z.boolean().optional(),
      limit: z.number().int().min(1).max(120).default(20),
    }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = client();
    let q = sb.from("products").select(SELECT).eq("status", "active");
    if (data.flag === "featured") q = q.eq("is_featured", true);
    if (data.flag === "trending") q = q.eq("is_trending", true);
    if (data.flag === "best_seller") q = q.eq("is_best_seller", true);
    if (data.flag === "new_arrival") q = q.eq("is_new_arrival", true);
    if (data.giftBoxCompatibleOnly) q = q.eq("gift_builder_compatible", true);
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

export const getPublicProductsBySlugsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ slugs: z.array(z.string()).max(60) }).parse(raw),
  )
  .handler(async ({ data }) => {
    if (data.slugs.length === 0) return [] as Product[];
    const sb = client();
    const { data: rows } = await sb.from("products").select(SELECT)
      .in("slug", data.slugs).eq("status", "active");
    const bySlug = new Map<string, Product>();
    for (const r of rows ?? []) {
      const p = toProduct(r as unknown as DbProduct);
      bySlug.set(p.slug, p);
    }
    // Preserve original slug order and drop missing/inactive.
    return data.slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  });

export const listPublicCategoriesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = client();
    const { data } = await sb.from("categories")
      .select("slug,name,description,sort_order,icon_url,banner_url")
      .eq("visible", true)
      .order("sort_order");
    return data ?? [];
  });

export const getPublicCategoryBySlugFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const sb = client();
    const { data: row } = await sb.from("categories")
      .select("slug,name,description,sort_order,icon_url,banner_url")
      .eq("slug", data.slug).eq("visible", true).maybeSingle();
    return row ?? null;
  });

// ---------- Gift boxes ----------

const PLACEHOLDER_BOX = "/placeholder.svg";

function firstImage(images: unknown): string {
  if (!Array.isArray(images)) return PLACEHOLDER_BOX;
  const first = (images as unknown[]).find((x): x is string => typeof x === "string" && x.length > 0);
  return first ?? PLACEHOLDER_BOX;
}

export type PublicEmptyBox = {
  slug: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  pricePaise: number;
  capacity: number;
  maxWeightGrams: number;
  material: string | null;
  color: string | null;
  ribbonCompatible: boolean;
  fillerCompatible: boolean;
  cardCompatible: boolean;
  stock: number;
};

export type PublicReadyBox = {
  slug: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  pricePaise: number;
  mrpPaise?: number;
  stock: number;
  isFeatured: boolean;
  isTrending: boolean;
  items: { productSlug: string; quantity: number }[];
  ribbon: string | null;
  filler: string | null;
  card: string | null;
};

export const listPublicEmptyBoxesFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<PublicEmptyBox[]> => {
    const sb = client();
    const { data, error } = await sb.from("empty_gift_boxes")
      .select("slug,name,description,images,base_price_paise,capacity_items,max_weight_grams,material,color,ribbon_compatible,filler_compatible,card_compatible,stock,status,visible")
      .eq("status", "active").eq("visible", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description ?? "",
      image: firstImage(r.images),
      images: Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [],
      pricePaise: r.base_price_paise ?? 0,
      capacity: r.capacity_items ?? 6,
      maxWeightGrams: r.max_weight_grams ?? 2000,
      material: r.material,
      color: r.color,
      ribbonCompatible: r.ribbon_compatible,
      fillerCompatible: r.filler_compatible,
      cardCompatible: r.card_compatible,
      stock: r.stock,
    }));
  });

export const listPublicReadyBoxesFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<PublicReadyBox[]> => {
    const sb = client();
    const { data, error } = await sb.from("ready_gift_boxes")
      .select("slug,name,description,images,price_paise,offer_price_paise,stock,is_featured,is_trending,items,ribbon,filler,card,status")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => {
      const items = Array.isArray(r.items)
        ? (r.items as { product_slug?: string; productSlug?: string; product_id?: string; quantity?: number }[])
            .map((it) => ({
              productSlug: it.product_slug ?? it.productSlug ?? it.product_id ?? "",
              quantity: it.quantity ?? 1,
            }))
            .filter((x) => x.productSlug)
        : [];
      const offer = r.offer_price_paise;
      return {
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        image: firstImage(r.images),
        images: Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [],
        pricePaise: offer ?? r.price_paise,
        mrpPaise: offer ? r.price_paise : undefined,
        stock: r.stock,
        isFeatured: r.is_featured,
        isTrending: r.is_trending,
        items,
        ribbon: r.ribbon,
        filler: r.filler,
        card: r.card,
      };
    });
  });

