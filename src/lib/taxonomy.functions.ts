/**
 * Recipients & Relationships taxonomy.
 *
 * Public reads via server publishable client (RLS scoped to visible=true).
 * Admin CRUD via super-admin middleware.
 * Junction tables product_recipients / product_relationships link products.
 *
 * NOTE: The regenerated Supabase types don't include the new tables until
 * the migration is approved, so we cast supabase clients to `any` here.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSuperAdmin, logAudit, slugify } from "./admin-shared";

type SB = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function publicClient(): SB {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type TaxonomyItem = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  image_url: string | null;
  sort_order: number;
  visible: boolean;
  seo_title: string | null;
  seo_description: string | null;
};

const SELECT = "id,slug,name,tagline,image_url,sort_order,visible,seo_title,seo_description";

export type TaxonomyProduct = {
  id: string; slug: string; sku: string | null; name: string;
  description: string | null;
  price_paise: number; offer_price_paise: number | null;
  stock: number; images: string[];
  is_featured: boolean; is_trending: boolean;
  is_new_arrival: boolean; is_best_seller: boolean;
  status: string;
};

type DbRel = {
  id: string; slug: string; sku: string | null; name: string;
  description: string | null;
  price_paise: number; offer_price_paise: number | null;
  stock: number; images: unknown;
  is_featured: boolean; is_trending: boolean;
  is_new_arrival: boolean; is_best_seller: boolean;
  status: string;
};

function normalizeProduct(p: DbRel): TaxonomyProduct {
  const images = Array.isArray(p.images)
    ? (p.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  return { ...p, images };
}

// ===================================================================
// PUBLIC — Recipients
// ===================================================================

export const listPublicRecipientsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<TaxonomyItem[]> => {
    const sb = publicClient();
    const { data } = await sb.from("recipients").select(SELECT)
      .eq("visible", true).order("sort_order");
    return (data ?? []) as TaxonomyItem[];
  });

export const getPublicRecipientBySlugFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }): Promise<TaxonomyItem | null> => {
    const sb = publicClient();
    const { data: row } = await sb.from("recipients").select(SELECT)
      .eq("slug", data.slug).eq("visible", true).maybeSingle();
    return (row as TaxonomyItem) ?? null;
  });

export const listProductsByRecipientFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string(), limit: z.number().int().min(1).max(120).default(60) }).parse(raw),
  )
  .handler(async ({ data }): Promise<TaxonomyProduct[]> => {
    const sb = publicClient();
    const { data: rec } = await sb.from("recipients").select("id").eq("slug", data.slug).eq("visible", true).maybeSingle();
    if (!rec) return [];
    const { data: rows } = await sb.from("product_recipients")
      .select("products(id,slug,sku,name,description,price_paise,offer_price_paise,stock,images,is_featured,is_trending,is_new_arrival,is_best_seller,status)")
      .eq("recipient_id", rec.id)
      .limit(data.limit);
    return ((rows ?? []) as { products: TaxonomyProduct | null }[])
      .map((r) => r.products)
      .filter((p): p is TaxonomyProduct => p !== null && p.status === "active");
  });

// ===================================================================
// PUBLIC — Relationships
// ===================================================================

export const listPublicRelationshipsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<TaxonomyItem[]> => {
    const sb = publicClient();
    const { data } = await sb.from("relationships").select(SELECT)
      .eq("visible", true).order("sort_order");
    return (data ?? []) as TaxonomyItem[];
  });

export const getPublicRelationshipBySlugFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }): Promise<TaxonomyItem | null> => {
    const sb = publicClient();
    const { data: row } = await sb.from("relationships").select(SELECT)
      .eq("slug", data.slug).eq("visible", true).maybeSingle();
    return (row as TaxonomyItem) ?? null;
  });

export const listProductsByRelationshipFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ slug: z.string(), limit: z.number().int().min(1).max(120).default(60) }).parse(raw),
  )
  .handler(async ({ data }): Promise<TaxonomyProduct[]> => {
    const sb = publicClient();
    const { data: rel } = await sb.from("relationships").select("id").eq("slug", data.slug).eq("visible", true).maybeSingle();
    if (!rel) return [];
    const { data: rows } = await sb.from("product_relationships")
      .select("products(id,slug,sku,name,description,price_paise,offer_price_paise,stock,images,is_featured,is_trending,is_new_arrival,is_best_seller,status)")
      .eq("relationship_id", rel.id)
      .limit(data.limit);
    return ((rows ?? []) as { products: DbRel | null }[])
      .map((r) => r.products)
      .filter((p): p is DbRel => p !== null && p.status === "active")
      .map(normalizeProduct);
  });

// ===================================================================
// ADMIN — Recipients
// ===================================================================

const taxonomyInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1).max(120),
  tagline: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  visible: z.boolean().default(true),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
});

export const adminListRecipientsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const sb = context.supabase as SB;
    const { data } = await sb.from("recipients").select("*").order("sort_order");
    return (data ?? []) as TaxonomyItem[];
  });

export const adminUpsertRecipientFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => taxonomyInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as SB;
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await sb.from("recipients").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "recipient.update", entity: "recipients", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await sb.from("recipients").insert(payload).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "recipient.create", entity: "recipients", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteRecipientFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as SB;
    const { error } = await sb.from("recipients").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "recipient.delete", entity: "recipients", entityId: data.id });
    return { ok: true as const };
  });

// ===================================================================
// ADMIN — Relationships
// ===================================================================

export const adminListRelationshipsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const sb = context.supabase as SB;
    const { data } = await sb.from("relationships").select("*").order("sort_order");
    return (data ?? []) as TaxonomyItem[];
  });

export const adminUpsertRelationshipFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => taxonomyInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as SB;
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await sb.from("relationships").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "relationship.update", entity: "relationships", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await sb.from("relationships").insert(payload).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "relationship.create", entity: "relationships", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteRelationshipFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as SB;
    const { error } = await sb.from("relationships").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "relationship.delete", entity: "relationships", entityId: data.id });
    return { ok: true as const };
  });
