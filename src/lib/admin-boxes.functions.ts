/**
 * Super Admin — Empty Gift Boxes, Ready-made Gift Boxes, Festivals, Homepage Sections.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdmin, logAudit, slugify } from "./admin-shared";

// -------------------- EMPTY BOXES --------------------
export const adminListEmptyBoxesFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("empty_gift_boxes").select("*").order("updated_at", { ascending: false });
    return data ?? [];
  });

const emptyBoxInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  material: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  capacity_items: z.number().int().min(0).nullable().optional(),
  max_weight_grams: z.number().int().min(0).nullable().optional(),
  base_price_paise: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  status: z.enum(["active", "disabled", "archived"]).default("active"),
  visible: z.boolean().default(true),
  ribbon_compatible: z.boolean().default(true),
  filler_compatible: z.boolean().default(true),
  card_compatible: z.boolean().default(true),
});

export const adminUpsertEmptyBoxFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => emptyBoxInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await context.supabase.from("empty_gift_boxes").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "empty_box.update", entity: "empty_gift_boxes", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("empty_gift_boxes").insert(payload as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "empty_box.create", entity: "empty_gift_boxes", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteEmptyBoxFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("empty_gift_boxes").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "empty_box.delete", entity: "empty_gift_boxes", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- READY BOXES --------------------
export const adminListReadyBoxesFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("ready_gift_boxes").select("*").order("updated_at", { ascending: false });
    return data ?? [];
  });

const readyBoxInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  empty_box_id: z.string().uuid().nullable().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).default([]),
  ribbon: z.string().nullable().optional(),
  filler: z.string().nullable().optional(),
  card: z.string().nullable().optional(),
  price_paise: z.number().int().min(0),
  offer_price_paise: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  festival_tags: z.array(z.string()).default([]),
  status: z.enum(["active", "disabled", "archived", "draft"]).default("active"),
});

export const adminUpsertReadyBoxFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => readyBoxInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await context.supabase.from("ready_gift_boxes").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "ready_box.update", entity: "ready_gift_boxes", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("ready_gift_boxes").insert(payload as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "ready_box.create", entity: "ready_gift_boxes", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteReadyBoxFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ready_gift_boxes").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "ready_box.delete", entity: "ready_gift_boxes", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- FESTIVALS --------------------
export const adminListFestivalsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("festivals").select("*").order("priority", { ascending: false });
    return data ?? [];
  });

const festivalInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  theme_color: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const adminUpsertFestivalFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => festivalInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    payload.slug = data.slug || slugify(data.name);
    if (data.id) {
      const { error } = await context.supabase.from("festivals").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "festival.update", entity: "festivals", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("festivals").insert(payload as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "festival.create", entity: "festivals", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteFestivalFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("festivals").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "festival.delete", entity: "festivals", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- HOMEPAGE SECTIONS --------------------
export const adminListHomepageFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true });
    return data ?? [];
  });

const sectionInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["hero", "slider", "featured", "trending", "best_sellers", "new_arrivals", "festival", "ai_recommendations", "promo_card", "category_grid", "giftbox_grid"]),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  sort_order: z.number().int().default(0),
  visible: z.boolean().default(true),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

export const adminUpsertSectionFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => sectionInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("homepage_sections").update(data as never).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "homepage.update", entity: "homepage_sections", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("homepage_sections").insert(data as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "homepage.create", entity: "homepage_sections", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteSectionFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("homepage_sections").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "homepage.delete", entity: "homepage_sections", entityId: data.id });
    return { ok: true as const };
  });

export const adminReorderSectionsFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    for (const item of data.order) {
      await context.supabase.from("homepage_sections").update({ sort_order: item.sort_order }).eq("id", item.id);
    }
    await logAudit({ actorId: context.userId, action: "homepage.reorder", entity: "homepage_sections", diff: data.order });
    return { ok: true as const };
  });
