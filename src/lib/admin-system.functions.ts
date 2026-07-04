/**
 * Super Admin — Store Settings, Security, Audit Logs, Reports, Analytics, Bootstrap.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin, logAudit } from "./admin-shared";

// -------------------- BOOTSTRAP SUPER ADMIN --------------------
/**
 * One-time bootstrap: sets super_admin.email in store_settings using the
 * SUPER_ADMIN_EMAIL env var and grants the role to the calling user if their
 * email matches. Callable by any authenticated user, but ONLY grants role
 * when their email matches the configured SUPER_ADMIN_EMAIL secret.
 */
export const bootstrapSuperAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = process.env.SUPER_ADMIN_EMAIL;
    if (!configured) return { ok: false as const, error: "SUPER_ADMIN_EMAIL not configured" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const userEmail = authUser.user?.email;
    if (!userEmail) return { ok: false as const, error: "No email on account" };
    // Save configured email to settings (idempotent) so trigger can pick it up next time
    await supabaseAdmin.from("store_settings").upsert({
      key: "super_admin",
      value: { email: configured } as never,
      is_public: false,
      updated_by: context.userId,
    });
    if (userEmail.toLowerCase() !== configured.toLowerCase()) {
      return { ok: false as const, error: "Your email does not match the configured super admin email." };
    }
    await supabaseAdmin.from("user_roles").upsert({
      user_id: context.userId,
      role: "super_admin" as never,
    }, { onConflict: "user_id,role" });
    await logAudit({ actorId: context.userId, actorEmail: userEmail, action: "bootstrap.super_admin", entity: "user_roles", entityId: context.userId });
    return { ok: true as const };
  });

// -------------------- STORE SETTINGS --------------------
export const adminGetSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("store_settings").select("*");
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  });

export const adminUpdateSettingFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    key: z.string().min(1).max(60),
    value: z.record(z.string(), z.unknown()),
    is_public: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { key: data.key, value: data.value, updated_by: context.userId };
    if (data.is_public !== undefined) patch.is_public = data.is_public;
    const { error } = await supabaseAdmin.from("store_settings").upsert(patch as never);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "settings.update", entity: "store_settings", entityId: data.key, diff: data.value });
    return { ok: true as const };
  });

// -------------------- AUDIT LOGS --------------------
export const adminListAuditLogsFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({
    entity: z.string().optional(),
    limit: z.number().int().max(500).default(200),
  }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 200);
    if (data.entity && data.entity !== "all") q = q.eq("entity", data.entity);
    const { data: rows } = await q;
    return rows ?? [];
  });

// -------------------- SECURITY --------------------
export const adminListLoginHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("admin_login_history").select("*").order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const adminForceLogoutFn = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.signOut(data.userId);
    if (error) return { ok: false as const, error: error.message };
    await logAudit({ actorId: context.userId, action: "security.force_logout", entity: "auth.users", entityId: data.userId });
    return { ok: true as const };
  });

// -------------------- ENHANCED DASHBOARD --------------------
export const adminDashboardFullFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      todayRev, monthRev, yearRev,
      totalOrders, pendingOrders, processingOrders, deliveredOrders, cancelledOrders,
      customersCount, newCustomers,
      lowStock, topProducts,
      activeCoupons, paymentsSuccess, paymentsFailed,
      topCategories,
    ] = await Promise.all([
      context.supabase.from("orders").select("grand_total_paise").eq("payment_status", "paid").gte("created_at", startOfDay.toISOString()),
      context.supabase.from("orders").select("grand_total_paise").eq("payment_status", "paid").gte("created_at", startOfMonth.toISOString()),
      context.supabase.from("orders").select("grand_total_paise").eq("payment_status", "paid").gte("created_at", startOfYear.toISOString()),
      context.supabase.from("orders").select("id", { count: "exact", head: true }),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      context.supabase.from("products").select("id, name, stock, low_stock_threshold").lte("stock", 5).eq("status", "active").limit(10),
      context.supabase.from("products").select("id, name, view_count, wishlist_count").order("view_count", { ascending: false }).limit(5),
      context.supabase.from("coupons").select("id", { count: "exact", head: true }).eq("active", true),
      context.supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "captured"),
      context.supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed"),
      context.supabase.from("categories").select("id, name").limit(5),
    ]);

    const sum = (rows: { grand_total_paise: number | null }[] | null | undefined) =>
      (rows ?? []).reduce((s, r) => s + (r.grand_total_paise ?? 0), 0);
    const totalPayments = (paymentsSuccess.count ?? 0) + (paymentsFailed.count ?? 0);
    const successRate = totalPayments ? Math.round(((paymentsSuccess.count ?? 0) / totalPayments) * 100) : 0;
    const aov = totalOrders.count ? Math.round(sum(monthRev.data as never) / (totalOrders.count || 1)) : 0;

    return {
      revenue: {
        todayPaise: sum(todayRev.data as never),
        monthPaise: sum(monthRev.data as never),
        yearPaise: sum(yearRev.data as never),
      },
      orders: {
        total: totalOrders.count ?? 0,
        pending: pendingOrders.count ?? 0,
        processing: processingOrders.count ?? 0,
        delivered: deliveredOrders.count ?? 0,
        cancelled: cancelledOrders.count ?? 0,
      },
      customers: {
        total: customersCount.count ?? 0,
        newThisMonth: newCustomers.count ?? 0,
      },
      lowStock: lowStock.data ?? [],
      topProducts: topProducts.data ?? [],
      topCategories: topCategories.data ?? [],
      activeCoupons: activeCoupons.count ?? 0,
      paymentSuccessRate: successRate,
      aovPaise: aov,
    };
  });

// -------------------- REPORTS (CSV export) --------------------
export const adminSalesReportFn = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((d) => z.object({ days: z.number().int().min(1).max(365).default(30) }).partial().parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - (data.days ?? 30) * 24 * 3600 * 1000).toISOString();
    const { data: orders } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_status, grand_total_paise, subtotal_paise, discount_paise, shipping_paise, tax_paise, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    return orders ?? [];
  });
