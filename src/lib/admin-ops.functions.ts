/**
 * Super Admin — Customers, Reviews, Inventory, Delivery, Payments, Notifications broadcast.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdmin, logAudit } from "./admin-shared";

// -------------------- CUSTOMERS --------------------
export const adminListCustomersFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ q: z.string().max(120).optional(), limit: z.number().int().max(500).default(100) }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select("id, name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    const { data: profiles } = await q;
    if (!profiles?.length) return [];
    // enrich with auth email + order counts
    const ids = profiles.map((p) => p.id);
    const [{ data: orders }, { data: authUsers }] = await Promise.all([
      supabaseAdmin.from("orders").select("user_id, grand_total_paise, status").in("user_id", ids),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);
    const emailById = new Map<string, string>();
    for (const u of authUsers?.users ?? []) if (u.email) emailById.set(u.id, u.email);
    return profiles.map((p) => {
      const my = (orders ?? []).filter((o) => o.user_id === p.id);
      const spent = my.reduce((s, o) => s + (o.grand_total_paise ?? 0), 0);
      return { ...p, email: emailById.get(p.id) ?? null, orders_count: my.length, total_spent_paise: spent };
    });
  });

export const adminGetCustomerFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: orders }, { data: addresses }, authUser] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("orders").select("id, order_number, status, grand_total_paise, created_at").eq("user_id", data.id).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("addresses").select("*").eq("user_id", data.id),
      supabaseAdmin.auth.admin.getUserById(data.id),
    ]);
    return {
      profile,
      email: authUser.data.user?.email ?? null,
      last_sign_in_at: authUser.data.user?.last_sign_in_at ?? null,
      orders: orders ?? [],
      addresses: addresses ?? [],
    };
  });

export const adminToggleCustomerBanFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid(), ban: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.ban ? "876000h" : "none",
    });
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: data.ban ? "customer.ban" : "customer.unban", entity: "auth.users", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- REVIEWS --------------------
export const adminListReviewsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ status: z.string().optional() }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("reviews").select("*, products(name, slug), ready_gift_boxes(name, slug)").order("created_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminModerateReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["approved", "rejected", "flagged", "pending"]).optional(),
    is_featured: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.is_featured !== undefined) patch.is_featured = data.is_featured;
    const { error } = await context.supabase.from("reviews").update(patch as never).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "review.moderate", entity: "reviews", entityId: data.id, diff: patch });
    return { ok: true as const };
  });

export const adminDeleteReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reviews").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "review.delete", entity: "reviews", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- INVENTORY --------------------
export const adminInventoryOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const [{ data: products }, { data: movements }] = await Promise.all([
      context.supabase.from("products").select("id, name, sku, stock, reserved_stock, low_stock_threshold, status").order("stock", { ascending: true }).limit(300),
      context.supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    return { products: products ?? [], movements: movements ?? [] };
  });

export const adminAdjustStockFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    product_id: z.string().uuid(),
    change: z.number().int(),
    reason: z.string().min(1).max(120),
    note: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", data.product_id).maybeSingle();
    if (!p) return { ok: false as const, error: "Product not found" };
    const newStock = Math.max(0, (p.stock ?? 0) + data.change);
    await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", data.product_id);
    await supabaseAdmin.from("inventory_movements").insert({
      product_id: data.product_id, change: data.change, reason: data.reason,
      actor_id: context.userId, note: data.note ?? null,
    });
    await logAudit({ actorId: context.userId, action: "inventory.adjust", entity: "products", entityId: data.product_id, diff: { change: data.change, newStock, reason: data.reason } });
    return { ok: true as const, newStock };
  });

// -------------------- DELIVERY RULES --------------------
export const adminListDeliveryRulesFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("delivery_rules").select("*").order("state", { ascending: true });
    return data ?? [];
  });

const deliveryInput = z.object({
  id: z.string().uuid().optional(),
  state: z.string().nullable().optional(),
  pincode_prefix: z.string().nullable().optional(),
  base_charge_paise: z.number().int().min(0).default(0),
  free_shipping_threshold_paise: z.number().int().min(0).default(0),
  express_available: z.boolean().default(false),
  express_charge_paise: z.number().int().min(0).default(0),
  estimated_days_min: z.number().int().min(0).default(3),
  estimated_days_max: z.number().int().min(0).default(7),
  cod_available: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const adminUpsertDeliveryRuleFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => deliveryInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("delivery_rules").update(data as never).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      await logAudit({ actorId: context.userId, action: "delivery.update", entity: "delivery_rules", entityId: data.id });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("delivery_rules").insert(data as never).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "delivery.create", entity: "delivery_rules", entityId: row.id });
    return { ok: true as const, id: row.id };
  });

export const adminDeleteDeliveryRuleFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("delivery_rules").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "delivery.delete", entity: "delivery_rules", entityId: data.id });
    return { ok: true as const };
  });

// -------------------- PAYMENTS --------------------
export const adminListPaymentsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ status: z.string().optional() }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("payments").select("*, orders(order_number)").order("created_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows } = await q;
    return rows ?? [];
  });

// -------------------- BROADCAST NOTIFICATIONS --------------------
export const adminBroadcastNotificationFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    title: z.string().min(1).max(200),
    body: z.string().max(500).optional(),
    link: z.string().max(300).optional(),
    audience: z.enum(["all", "customers"]).default("all"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
    const rows = (profiles ?? []).map((p) => ({
      user_id: p.id,
      type: "broadcast",
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
    }));
    if (!rows.length) return { ok: true as const, count: 0 };
    const { error } = await supabaseAdmin.from("notifications").insert(rows as never);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "notification.broadcast", entity: "notifications", diff: { count: rows.length, title: data.title } });
    return { ok: true as const, count: rows.length };
  });
