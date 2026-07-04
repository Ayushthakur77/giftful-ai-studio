import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const requireStaff = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    const { data: isStaff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "staff" });
    if (!isSuper && !isStaff) throw new Response("Forbidden", { status: 403 });
    return next();
  });

// ---------- DASHBOARD ----------
export const adminDashboardStatsFn = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [ordersRes, customersRes, revenueRes, pendingRes] = await Promise.all([
      context.supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("orders").select("grand_total_paise").gte("created_at", sevenDaysAgo).eq("payment_status", "paid"),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed", "processing"]),
    ]);
    const revenuePaise = (revenueRes.data ?? []).reduce((s: number, r: any) => s + (r.grand_total_paise ?? 0), 0);
    return {
      orders7d: ordersRes.count ?? 0,
      customers: customersRes.count ?? 0,
      revenue7dPaise: revenuePaise,
      pendingOrders: pendingRes.count ?? 0,
    };
  });

// ---------- ORDERS ----------
export const adminListOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((d) => z.object({
    status: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("orders")
      .select("id, order_number, status, payment_method, payment_status, grand_total_paise, contact, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminUpdateOrderStatusFn = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"]),
    note: z.string().max(300).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("id, user_id, order_number").eq("id", data.orderId).maybeSingle();
    if (!order) return { ok: false as const, error: "Order not found" };
    await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.orderId);
    await supabaseAdmin.from("order_status_history").insert({
      order_id: data.orderId, status: data.status, note: data.note ?? null, changed_by: context.userId,
    });
    // Notify customer
    const label = data.status.replace(/_/g, " ");
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: `order_${data.status}`,
      title: `Order ${order.order_number} is now ${label}`,
      body: data.note ?? null,
      link: `/account/orders/${order.id}`,
    });
    return { ok: true as const };
  });

// ---------- COUPONS ----------
export const adminListCouponsFn = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

const couponInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2).max(30),
  description: z.string().max(200).optional().nullable(),
  discount_type: z.enum(["flat", "percent", "free_shipping"]),
  discount_value: z.number().int().min(0),
  max_discount_paise: z.number().int().min(0).nullable().optional(),
  min_order_paise: z.number().int().min(0).default(0),
  first_order_only: z.boolean().default(false),
  per_user_limit: z.number().int().min(0).default(0),
  total_usage_limit: z.number().int().min(0).default(0),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export const adminUpsertCouponFn = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((d) => couponInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, code: data.code.toUpperCase() };
    if (data.id) {
      const { error } = await context.supabase.from("coupons").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("coupons").insert(payload).select("id").single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row.id };
  });

export const adminDeleteCouponFn = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
