/**
 * Super Admin — Products & Categories CRUD.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdmin, logAudit, slugify } from "./admin-shared";

// -------------------- CATEGORIES --------------------
export const adminListCategoriesFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    return data ?? [];
  });

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  icon_url: z.string().url().nullable().optional().or(z.literal("")),
  banner_url: z.string().url().nullable().optional().or(z.literal("")),
  sort_order: z.number().int().default(0),
  visible: z.boolean().default(true),
  show_on_home: z.boolean().default(false),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
});

export const adminUpsertCategoryFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => categoryInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (payload.icon_url === "") payload.icon_url = null;
    if (payload.banner_url === "") payload.banner_url = null;
    if (data.id) {
      const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "category.update", entity: "categories", entityId: data.id, diff: payload });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("categories").insert(payload as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "category.create", entity: "categories", entityId: row.id, diff: payload });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteCategoryFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "category.delete", entity: "categories", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- PRODUCTS --------------------
export const adminListProductsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    q: z.string().max(120).optional(),
    status: z.string().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    limit: z.number().int().min(1).max(500).default(100),
  }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("products")
      .select("id, slug, name, sku, price_paise, offer_price_paise, stock, status, is_featured, is_trending, category_id, images, updated_at")
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    const { data: rows } = await q;
    return rows ?? [];
  });

const productInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  sku: z.string().max(60).nullable().optional(),
  price_paise: z.number().int().min(0),
  offer_price_paise: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  weight_grams: z.number().int().min(0).nullable().optional(),
  length_mm: z.number().int().min(0).nullable().optional(),
  width_mm: z.number().int().min(0).nullable().optional(),
  height_mm: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  festival_tags: z.array(z.string()).default([]),
  gift_builder_compatible: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  status: z.enum(["active", "disabled", "archived", "draft"]).default("active"),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
});

export const adminUpsertProductFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "product.update", entity: "products", entityId: data.id, diff: payload });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("products").insert(payload as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "product.create", entity: "products", entityId: row.id, diff: payload });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteProductFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "product.delete", entity: "products", entityId: data.id });
    return { ok: true as const };
  });

export const adminBulkUpdateProductStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    ids: z.array(z.string().uuid()).min(1).max(500),
    status: z.enum(["active", "disabled", "archived", "draft"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").update({ status: data.status }).in("id", data.ids);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "product.bulk_status", entity: "products", diff: { ids: data.ids, status: data.status } });
    return { ok: true as const, count: data.ids.length };
  });

export const adminBulkDeleteProductsFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().in("id", data.ids);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "product.bulk_delete", entity: "products", diff: { ids: data.ids } });
    return { ok: true as const, count: data.ids.length };
  });

export const adminDuplicateProductFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: src } = await context.supabase.from("products").select("*").eq("id", data.id).maybeSingle();
    if (!src) return { ok: false as const, error: "Not found" };
    const clone: Record<string, unknown> = { ...src };
    delete clone.id; delete clone.created_at; delete clone.updated_at;
    clone.name = `${src.name} (copy)`;
    clone.slug = `${src.slug}-copy-${Date.now().toString(36)}`;
    clone.sku = src.sku ? `${src.sku}-COPY` : null;
    clone.status = "draft";
    const { data: row, error } = await context.supabase.from("products").insert(clone as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "product.duplicate", entity: "products", entityId: row.id, diff: { from: data.id } });
    return { ok: true as const, id: row.id };
  });
