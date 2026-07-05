/**
 * Server-only catalog repository.
 *
 * Loads the products, ready-made gift boxes, and empty gift boxes needed
 * to price a set of cart lines. Returns a `CatalogSnapshot` that the pure
 * `pricing.ts` engine consumes — so pricing stays synchronous while
 * always reading live DB data.
 *
 * Uses the service-role admin client so pricing works uniformly for
 * signed-in and guest cart totals; only safe columns are read and no
 * mutations happen here.
 */
import type { CatalogSnapshot, PricingProduct, PricingReadyBox, PricingEmptyBox } from "./pricing";
import type { CartLine } from "./pricing";

function uniq<T>(xs: (T | undefined | null)[]): T[] {
  return Array.from(new Set(xs.filter((x): x is T => x != null)));
}

function collectSlugs(lines: CartLine[]) {
  const products = new Set<string>();
  const readyBoxes = new Set<string>();
  const emptyBoxes = new Set<string>();
  for (const l of lines) {
    if (l.kind === "product") products.add(l.productSlug);
    else if (l.kind === "ready-box") readyBoxes.add(l.boxSlug);
    else {
      emptyBoxes.add(l.emptyBoxSlug);
      for (const it of l.items) products.add(it.productSlug);
    }
  }
  return {
    products: [...products],
    readyBoxes: [...readyBoxes],
    emptyBoxes: [...emptyBoxes],
  };
}

export async function loadCatalogSnapshot(lines: CartLine[]): Promise<CatalogSnapshot> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const slugs = collectSlugs(lines);

  const products = new Map<string, PricingProduct>();
  const readyBoxes = new Map<string, PricingReadyBox>();
  const emptyBoxes = new Map<string, PricingEmptyBox>();

  if (slugs.products.length) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("slug,name,images,price_paise,offer_price_paise,stock,weight_grams,gift_builder_compatible,status,category_id,categories(slug)")
      .in("slug", slugs.products);
    for (const r of data ?? []) {
      const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
      products.set(r.slug, {
        slug: r.slug,
        name: r.name,
        image: images[0] ?? "",
        pricePaise: r.offer_price_paise ?? r.price_paise,
        stock: r.status === "active" ? r.stock : 0,
        weightGrams: r.weight_grams ?? 0,
        isGiftBoxCompatible: r.gift_builder_compatible,
        // Personalization is not yet DB-modeled → treated as unavailable.
        isPersonalizable: false,
        personalization: undefined,
        categorySlug: (r as any).categories?.slug ?? null,
      });
    }
  }

  if (slugs.readyBoxes.length) {
    const { data } = await supabaseAdmin
      .from("ready_gift_boxes")
      .select("slug,name,images,price_paise,offer_price_paise,stock,items,status")
      .in("slug", slugs.readyBoxes);
    for (const r of data ?? []) {
      const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
      const items = Array.isArray(r.items)
        ? (r.items as any[]).map((it) => ({
            productSlug: String(it.productSlug ?? it.slug ?? ""),
            quantity: Number(it.quantity ?? 1),
          })).filter((it) => it.productSlug)
        : [];
      readyBoxes.set(r.slug, {
        slug: r.slug,
        name: r.name,
        image: images[0] ?? "",
        pricePaise: r.offer_price_paise ?? r.price_paise,
        stock: r.status === "active" ? r.stock : 0,
        contents: items,
      });
    }

    // Ready-box contents may reference products we haven't loaded yet;
    // do a second-pass fetch so the "details" descriptions resolve names.
    const extraSlugs = uniq(
      [...readyBoxes.values()].flatMap((b) => b.contents.map((c) => c.productSlug)),
    ).filter((s) => !products.has(s));
    if (extraSlugs.length) {
      const { data } = await supabaseAdmin
        .from("products").select("slug,name").in("slug", extraSlugs);
      for (const r of data ?? []) {
        products.set(r.slug, {
          slug: r.slug, name: r.name, image: "",
          pricePaise: 0, stock: 0, weightGrams: 0,
          isGiftBoxCompatible: false, isPersonalizable: false,
          personalization: undefined, categorySlug: null,
        });
      }
    }
  }

  if (slugs.emptyBoxes.length) {
    const { data } = await supabaseAdmin
      .from("empty_gift_boxes")
      .select("slug,name,images,base_price_paise,capacity_items,max_weight_grams,allowed_category_ids,status,stock")
      .in("slug", slugs.emptyBoxes);

    // Resolve category IDs → slugs so allow-lists match products.categorySlug
    const catIds = uniq((data ?? []).flatMap((r: any) => r.allowed_category_ids ?? []));
    const catSlugById = new Map<string, string>();
    if (catIds.length) {
      const { data: cats } = await supabaseAdmin
        .from("categories").select("id,slug").in("id", catIds);
      for (const c of (cats ?? []) as Array<{ id: string; slug: string }>) catSlugById.set(c.id, c.slug);
    }

    for (const r of data ?? []) {
      const images = Array.isArray(r.images) ? (r.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
      emptyBoxes.set(r.slug, {
        slug: r.slug,
        name: r.name,
        image: images[0] ?? "",
        pricePaise: r.base_price_paise,
        capacity: r.capacity_items ?? 999,
        maxWeightGrams: r.max_weight_grams ?? Number.MAX_SAFE_INTEGER,
        allowedCategorySlugs: (r.allowed_category_ids ?? [])
          .map((id: string) => catSlugById.get(id))
          .filter((s: string | undefined): s is string => Boolean(s)),
        available: r.status === "active" && r.stock > 0,
      });
    }
  }

  return { products, readyBoxes, emptyBoxes };
}
