/**
 * Product Discovery — server-side search, filters, sorting, pagination,
 * autocomplete and recommendations.
 *
 * All reads use the server publishable Supabase client (RLS as anon).
 * The public "products read" policy exposes rows with status='active'.
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

const PLACEHOLDER = "/placeholder.svg";

const SELECT =
  "id,slug,sku,name,description,category_id,price_paise,offer_price_paise,stock,weight_grams,images,tags,festival_tags,is_featured,is_trending,is_new_arrival,is_best_seller,gift_builder_compatible,seo_title,seo_description,view_count,wishlist_count,created_at,categories(slug)";

type DbRow = {
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
  view_count: number | null; wishlist_count: number | null;
  created_at: string;
  categories?: { slug: string } | null;
};

function toProduct(r: DbRow): Product {
  const images = Array.isArray(r.images)
    ? (r.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const gallery = images.length ? images : [PLACEHOLDER];
  const price = r.offer_price_paise ?? r.price_paise;
  const mrp = r.offer_price_paise ? r.price_paise : undefined;
  const badge =
    r.is_new_arrival ? "New" :
    r.is_best_seller ? "Best Seller" :
    r.is_trending ? "Trending" :
    r.is_featured ? "Featured" : undefined;
  return {
    slug: r.slug, sku: r.sku ?? "", name: r.name,
    shortDescription: (r.seo_description ?? r.description ?? "").slice(0, 160),
    description: r.description ?? "",
    image: gallery[0]!, gallery,
    category: (r.categories?.slug ?? "personalized") as CategorySlug,
    occasions: [] as OccasionSlug[],
    recipients: [] as RecipientSlug[],
    tags: r.tags ?? [],
    pricePaise: price, mrpPaise: mrp,
    weightGrams: r.weight_grams ?? 0, stock: r.stock,
    rating: 0, ratingCount: r.wishlist_count ?? 0,
    badge,
    isPersonalizable: false,
    isGiftBoxCompatible: r.gift_builder_compatible,
    isFeatured: r.is_featured, isTrending: r.is_trending,
    isBestSeller: r.is_best_seller, specs: [],
  };
}

export const searchProductsInput = z.object({
  q: z.string().trim().max(120).optional(),
  categorySlug: z.string().optional(),
  occasion: z.string().optional(),
  recipient: z.string().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  discountOnly: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
  giftBoxOnly: z.boolean().optional(),
  sort: z.enum(["popularity", "newest", "price-asc", "price-desc", "rating", "discount"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
});

export type SearchProductsInput = z.infer<typeof searchProductsInput>;

export const searchProductsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => searchProductsInput.parse(raw ?? {}))
  .handler(async ({ data }) => {
    const sb = client();
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    // Resolve category slug → id
    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: c } = await sb.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (!c) return { items: [] as Product[], total: 0, page: data.page, pageSize: data.pageSize };
      categoryId = c.id;
    }

    let q = sb.from("products").select(SELECT, { count: "exact" }).eq("status", "active");
    if (categoryId) q = q.eq("category_id", categoryId);
    if (data.minPrice != null) q = q.gte("price_paise", data.minPrice);
    if (data.maxPrice != null) q = q.lte("price_paise", data.maxPrice);
    if (data.inStockOnly) q = q.gt("stock", 0);
    if (data.giftBoxOnly) q = q.eq("gift_builder_compatible", true);
    if (data.discountOnly) q = q.not("offer_price_paise", "is", null);
    if (data.occasion) q = q.contains("festival_tags", [data.occasion]);
    if (data.q) {
      const needle = data.q.replace(/[%,]/g, " ");
      q = q.or(`name.ilike.%${needle}%,description.ilike.%${needle}%,seo_title.ilike.%${needle}%`);
    }

    switch (data.sort) {
      case "price-asc": q = q.order("price_paise", { ascending: true }); break;
      case "price-desc": q = q.order("price_paise", { ascending: false }); break;
      case "newest": q = q.order("created_at", { ascending: false }); break;
      case "discount":
        q = q.not("offer_price_paise", "is", null).order("offer_price_paise", { ascending: true });
        break;
      case "rating":
      case "popularity":
      default:
        q = q.order("is_best_seller", { ascending: false })
             .order("is_trending", { ascending: false })
             .order("view_count", { ascending: false, nullsFirst: false });
    }

    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw error;
    return {
      items: (rows ?? []).map((r) => toProduct(r as unknown as DbRow)),
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const autocompleteProductsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ q: z.string().trim().min(1).max(80) }).parse(raw))
  .handler(async ({ data }) => {
    const sb = client();
    const needle = data.q.replace(/[%,]/g, " ");
    const { data: rows } = await sb.from("products")
      .select("slug,name,images,price_paise,offer_price_paise")
      .eq("status", "active")
      .ilike("name", `%${needle}%`)
      .limit(8);
    const products = (rows ?? []).map((r) => {
      const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
      return {
        slug: r.slug,
        name: r.name,
        image: images[0] ?? PLACEHOLDER,
        pricePaise: r.offer_price_paise ?? r.price_paise,
      };
    });
    const { data: cats } = await sb.from("categories")
      .select("slug,name").eq("visible", true).ilike("name", `%${needle}%`).limit(4);
    return { products, categories: cats ?? [] };
  });

export const getRecommendationsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({
    kind: z.enum(["trending", "best_sellers", "new_arrivals", "similar"]).default("trending"),
    excludeSlug: z.string().optional(),
    categorySlug: z.string().optional(),
    limit: z.number().int().min(1).max(24).default(10),
  }).parse(raw ?? {}))
  .handler(async ({ data }) => {
    const sb = client();
    let q = sb.from("products").select(SELECT).eq("status", "active");
    if (data.excludeSlug) q = q.neq("slug", data.excludeSlug);
    if (data.kind === "trending") q = q.eq("is_trending", true);
    if (data.kind === "best_sellers") q = q.eq("is_best_seller", true);
    if (data.kind === "new_arrivals") q = q.eq("is_new_arrival", true).order("created_at", { ascending: false });
    if (data.kind === "similar" && data.categorySlug) {
      const { data: c } = await sb.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (c?.id) q = q.eq("category_id", c.id);
    }
    const { data: rows } = await q.order("view_count", { ascending: false, nullsFirst: false }).limit(data.limit);
    return (rows ?? []).map((r) => toProduct(r as unknown as DbRow));
  });
