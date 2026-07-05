/**
 * Public homepage layout loader.
 *
 * Reads the `homepage_sections` table (respecting `visible`,
 * `starts_at`, `ends_at`) and resolves the data required to render each
 * section (products, categories, recipients, relationships, festival
 * banner, testimonials, etc.) in a SINGLE round-trip.
 *
 * Uses the server publishable client (RLS as anon). No secrets exposed.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function client() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const PLACEHOLDER = "/placeholder.svg";
const PROD_SELECT =
  "id,slug,sku,name,description,price_paise,offer_price_paise,stock,weight_grams,images,tags,is_featured,is_trending,is_new_arrival,is_best_seller,gift_builder_compatible,categories(slug)";

type DbProduct = {
  id: string; slug: string; sku: string | null; name: string;
  description: string | null;
  price_paise: number; offer_price_paise: number | null;
  stock: number; weight_grams: number | null;
  images: unknown; tags: string[] | null;
  is_featured: boolean; is_trending: boolean;
  is_new_arrival: boolean; is_best_seller: boolean;
  gift_builder_compatible: boolean;
  categories?: { slug: string } | null;
};

function toProductCard(r: DbProduct) {
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
    slug: r.slug,
    sku: r.sku ?? "",
    name: r.name,
    shortDescription: (r.description ?? "").slice(0, 160),
    description: r.description ?? "",
    image: gallery[0]!,
    gallery,
    category: (r.categories?.slug ?? "personalized") as string,
    occasions: [] as string[],
    recipients: [] as string[],
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
    specs: [] as { label: string; value: string }[],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HomepageSection = {
  id: string;
  kind: string;
  title: string | null;
  subtitle: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

async function fetchProducts(
  sb: ReturnType<typeof client>,
  filter: "featured" | "trending" | "best_seller" | "new_arrival" | null,
  limit = 10,
  slugs?: string[],
) {
  let q = sb.from("products").select(PROD_SELECT).eq("status", "active");
  if (slugs && slugs.length) {
    q = q.in("slug", slugs);
  } else if (filter === "featured") q = q.eq("is_featured", true);
  else if (filter === "trending") q = q.eq("is_trending", true);
  else if (filter === "best_seller") q = q.eq("is_best_seller", true);
  else if (filter === "new_arrival") q = q.eq("is_new_arrival", true);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => toProductCard(r as unknown as DbProduct));
}

async function resolveSection(sb: ReturnType<typeof client>, s: {
  id: string; kind: string; title: string | null; subtitle: string | null; config: unknown;
}): Promise<HomepageSection> {
  const config = (typeof s.config === "object" && s.config) ? (s.config as Record<string, unknown>) : {};
  const limit = typeof config.limit === "number" ? Math.min(24, Math.max(1, config.limit)) : 10;
  const productSlugs = Array.isArray(config.productSlugs)
    ? (config.productSlugs as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;

  let data: unknown = null;
  switch (s.kind) {
    case "hero":
    case "hero_slider": {
      const slides = Array.isArray(config.slides) ? config.slides : [];
      data = { slides };
      break;
    }
    case "usp_strip":
      data = { items: Array.isArray(config.items) ? config.items : [] };
      break;
    case "banner_strip":
    case "promo_card":
      data = {
        image: config.image ?? null,
        ctaLabel: config.ctaLabel ?? "Shop now",
        ctaHref: config.ctaHref ?? "/search",
        variant: config.variant ?? "default",
      };
      break;
    case "countdown_offer":
      data = {
        endsAt: config.endsAt ?? null,
        ctaLabel: config.ctaLabel ?? "Shop the sale",
        ctaHref: config.ctaHref ?? "/search",
        code: config.code ?? null,
      };
      break;
    case "image_cards":
      data = { cards: Array.isArray(config.cards) ? config.cards : [] };
      break;
    case "featured": {
      let products = await fetchProducts(sb, "featured", limit, productSlugs);
      if (!products.length) products = await fetchProducts(sb, null, limit);
      data = { products };
      break;
    }
    case "trending": {
      let products = await fetchProducts(sb, "trending", limit, productSlugs);
      if (!products.length) products = await fetchProducts(sb, null, limit);
      data = { products };
      break;
    }
    case "best_sellers": {
      let products = await fetchProducts(sb, "best_seller", limit, productSlugs);
      if (!products.length) products = await fetchProducts(sb, null, limit);
      data = { products };
      break;
    }
    case "new_arrivals": {
      let products = await fetchProducts(sb, "new_arrival", limit, productSlugs);
      if (!products.length) products = await fetchProducts(sb, null, limit);
      data = { products };
      break;
    }
    case "product_showcase": {
      data = { products: await fetchProducts(sb, null, limit, productSlugs) };
      break;
    }
    case "category_grid": {
      const { data: rows } = await sb.from("categories")
        .select("slug,name,description,icon_url,banner_url,sort_order")
        .eq("visible", true).order("sort_order").limit(limit);
      data = { categories: rows ?? [] };
      break;
    }
    case "recipient_grid": {
      const { data: rows } = await sb.from("recipients")
        .select("slug,name,tagline,image_url,sort_order")
        .eq("visible", true).order("sort_order").limit(limit);
      data = { recipients: rows ?? [] };
      break;
    }
    case "relationship_grid": {
      const { data: rows } = await sb.from("relationships")
        .select("slug,name,image_url,sort_order")
        .eq("visible", true).order("sort_order").limit(limit);
      data = { relationships: rows ?? [] };
      break;
    }
    case "occasion_grid":
      data = {
        occasions: Array.isArray(config.occasions) ? config.occasions : [
          { slug: "birthday", name: "Birthday", emoji: "🎂" },
          { slug: "anniversary", name: "Anniversary", emoji: "💍" },
          { slug: "wedding", name: "Wedding", emoji: "💐" },
          { slug: "rakhi", name: "Rakhi", emoji: "🪢" },
          { slug: "diwali", name: "Diwali", emoji: "🪔" },
          { slug: "corporate", name: "Corporate", emoji: "🏢" },
        ],
      };
      break;
    case "giftbox_grid": {
      const { data: rows } = await sb.from("ready_gift_boxes")
        .select("slug,name,description,images,price_paise,offer_price_paise,stock,is_featured,is_trending")
        .eq("status", "active").order("updated_at", { ascending: false }).limit(limit);
      data = { boxes: rows ?? [] };
      break;
    }
    case "festival": {
      const today = new Date().toISOString().slice(0, 10);
      const { data: rows } = await sb.from("festivals")
        .select("slug,name,description,banner_url,theme_color,start_date,end_date,related_product_ids,related_category_ids")
        .eq("active", true)
        .lte("start_date", today).gte("end_date", today)
        .order("priority", { ascending: false }).limit(1);
      data = { festival: rows?.[0] ?? null };
      break;
    }
    case "testimonials": {
      const { data: rows } = await sb.from("testimonials")
        .select("author_name,author_city,avatar_url,rating,quote,sort_order")
        .eq("visible", true).order("sort_order").limit(limit);
      data = { testimonials: rows ?? [] };
      break;
    }
    case "ai_recommendations":
      data = { ctaHref: "/ai-finder" };
      break;
    default:
      data = null;
  }

  return {
    id: s.id,
    kind: s.kind,
    title: s.title,
    subtitle: s.subtitle,
    config,
    data,
  };
}

export const getHomepageLayoutFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = client();
  const nowIso = new Date().toISOString();
  const { data: sections } = await sb.from("homepage_sections")
    .select("id,kind,title,subtitle,config,starts_at,ends_at,sort_order,visible")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  const active = (sections ?? []).filter((s) => {
    const startsOk = !s.starts_at || s.starts_at <= nowIso;
    const endsOk = !s.ends_at || s.ends_at >= nowIso;
    return startsOk && endsOk;
  });

  const resolved = await Promise.all(active.map((s) => resolveSection(sb, s)));

  // Always ensure products are visible on the homepage.
  const productKinds = new Set(["featured", "trending", "best_sellers", "new_arrivals", "product_showcase"]);
  const hasProductRail = resolved.some((s) => productKinds.has(s.kind));
  if (!hasProductRail) {
    const products = await fetchProducts(sb, null, 12);
    console.log("[homepage] product fallback", products.length, products[0]?.name);
    if (products.length) {
      resolved.push({
        id: "default-product-showcase",
        kind: "product_showcase",
        title: "Shop our gifts",
        subtitle: "Curated picks for every moment",
        config: { limit: 12 },
        data: { products },
      });
    }
  }

  console.log("[homepage] resolved", resolved.length, resolved.map((s) => s.kind));
  return resolved;
});
