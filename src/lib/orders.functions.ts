import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotalPaise: number;
  itemCount: number;
  createdAt: string;
  estimatedDeliveryAt: string | null;
};

export const listMyOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderSummary[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_method, payment_status, grand_total_paise, created_at, estimated_delivery_at, order_items(id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      grandTotalPaise: o.grand_total_paise,
      itemCount: (o.order_items ?? []).length,
      createdAt: o.created_at,
      estimatedDeliveryAt: o.estimated_delivery_at,
    }));
  });

export const getOrderByIdFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const [{ data: items }, { data: history }, { data: invoice }] = await Promise.all([
      context.supabase.from("order_items").select("*").eq("order_id", data.id).order("created_at"),
      context.supabase.from("order_status_history").select("*").eq("order_id", data.id).order("created_at"),
      context.supabase.from("invoices").select("*").eq("order_id", data.id).maybeSingle(),
    ]);

    return { order, items: items ?? [], history: history ?? [], invoice };
  });

export const cancelOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders").select("id, status").eq("id", data.id).maybeSingle();
    if (!order) return { ok: false as const, error: "Order not found" };
    const cancellable = ["pending", "payment_pending", "confirmed", "processing"];
    if (!cancellable.includes(order.status)) {
      return { ok: false as const, error: `Cannot cancel a ${order.status} order` };
    }
    // Users cannot update orders directly (RLS) — use admin client for the status write.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders")
      .update({ status: "cancelled" }).eq("id", data.id).eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    await supabaseAdmin.from("order_status_history").insert({
      order_id: data.id, status: "cancelled", note: "Cancelled by customer", changed_by: context.userId,
    });
    return { ok: true as const };
  });
