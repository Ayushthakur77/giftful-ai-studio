import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeCart, type CartLine } from "./pricing";
import { computeCouponDiscount } from "./coupons.functions";
import { COMPANY } from "./company";

const personalizationSchema = z.record(z.string(), z.string().max(500)).optional();

const cartLineSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), id: z.string(), productSlug: z.string(), quantity: z.number().int().min(1).max(20), personalization: personalizationSchema }),
  z.object({ kind: z.literal("ready-box"), id: z.string(), boxSlug: z.string(), quantity: z.number().int().min(1).max(20) }),
  z.object({
    kind: z.literal("custom-box"), id: z.string(), emptyBoxSlug: z.string(),
    items: z.array(z.object({ productSlug: z.string(), quantity: z.number().int().min(1).max(10), personalization: personalizationSchema })).max(20),
    ribbonSlug: z.string().optional(), fillerSlug: z.string().optional(), cardSlug: z.string().optional(),
    giftNote: z.string().max(500).optional(), quantity: z.number().int().min(1).max(10),
  }),
]);

export const placeCodOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    addressId: z.string().uuid(),
    lines: z.array(cartLineSchema).min(1).max(50),
    couponCode: z.string().min(2).max(30).optional(),
    notes: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Defense-in-depth: explicit ownership check on top of addresses RLS.
    const { data: addr, error: addrErr } = await context.supabase
      .from("addresses")
      .select("*")
      .eq("id", data.addressId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (addrErr) return { ok: false as const, error: addrErr.message };
    if (!addr) return { ok: false as const, error: "Address not found" };

    const base = computeCart(data.lines as CartLine[]);
    if (base.errors.length > 0) return { ok: false as const, error: base.errors.join(" · ") };
    if (base.grandTotalPaise <= 0) return { ok: false as const, error: "Cart is empty" };

    // Coupon (optional)
    let couponDiscountPaise = 0;
    let shippingPaise = base.shippingPaise;
    let couponCode: string | null = null;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { data: rows, error: cErr } = await context.supabase.rpc("validate_coupon", {
        _code: data.couponCode.toUpperCase(),
        _user_id: context.userId,
        _subtotal_paise: base.subtotalPaise,
      });
      if (cErr) return { ok: false as const, error: cErr.message };
      const row = (rows as any[] | null)?.[0];
      if (!row?.valid) return { ok: false as const, error: row?.error ?? "Invalid coupon" };
      const applied = computeCouponDiscount(
        row.discount_type, row.discount_value, row.max_discount_paise,
        base.subtotalPaise, base.shippingPaise,
      );
      couponDiscountPaise = applied.discountPaise;
      if (applied.shippingWaived) shippingPaise = 0;
      couponCode = data.couponCode.toUpperCase();
      couponId = row.coupon_id;
    }
    const discountedSubtotal = Math.max(0, base.subtotalPaise - couponDiscountPaise);
    const taxPaise = Math.round(discountedSubtotal * 0.18);
    const grandTotalPaise = discountedSubtotal + taxPaise + shippingPaise;

    const email = (context.claims as { email?: string })?.email ?? "";
    const shippingSnap = {
      fullName: addr.full_name, phone: addr.phone,
      line1: addr.line1, line2: addr.line2,
      city: addr.city, state: addr.state,
      pincode: addr.pincode, country: addr.country, label: addr.label,
    };
    const contact = { email, phone: addr.phone, name: addr.full_name };
    const estimatedDeliveryAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

    const { data: order, error: orderErr } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        status: "confirmed",
        payment_method: "cod",
        payment_status: "pending",
        subtotal_paise: base.subtotalPaise,
        discount_paise: base.discountPaise,
        coupon_code: couponCode,
        coupon_discount_paise: couponDiscountPaise,
        shipping_paise: shippingPaise,
        tax_paise: taxPaise,
        grand_total_paise: grandTotalPaise,
        shipping_address: shippingSnap,
        contact,
        notes: data.notes ?? null,
        estimated_delivery_at: estimatedDeliveryAt,
      })
      .select("id, order_number").single();
    if (orderErr || !order) return { ok: false as const, error: orderErr?.message ?? "Failed to create order" };

    const itemsPayload = base.lines.map((l, i) => {
      const raw = data.lines[i];
      let slug = "";
      if (raw.kind === "product") slug = raw.productSlug;
      else if (raw.kind === "ready-box") slug = raw.boxSlug;
      else slug = raw.emptyBoxSlug;
      const unit = l.quantity > 0 ? Math.round(l.lineSubtotalPaise / l.quantity) : l.lineSubtotalPaise;
      return {
        order_id: order.id, kind: l.kind, slug, name: l.name, image: l.image || null,
        quantity: l.quantity, unit_price_paise: unit, line_total_paise: l.lineSubtotalPaise,
        details: l.details ?? null, payload: raw,
      };
    });
    const { error: itemsErr } = await context.supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      await context.supabase.from("orders").delete().eq("id", order.id);
      return { ok: false as const, error: itemsErr.message };
    }

    await context.supabase.from("invoices").insert({
      order_id: order.id, user_id: context.userId,
      subtotal_paise: base.subtotalPaise,
      discount_paise: base.discountPaise + couponDiscountPaise,
      shipping_paise: shippingPaise, tax_paise: taxPaise,
      grand_total_paise: grandTotalPaise,
      billing_address: shippingSnap, shipping_address: shippingSnap,
      seller: JSON.parse(JSON.stringify(COMPANY)),
    });

    await context.supabase.from("order_status_history").insert([
      { order_id: order.id, status: "pending", note: "Order created" },
      { order_id: order.id, status: "confirmed", note: "Cash on Delivery confirmed" },
    ]);

    // Coupon redemption
    if (couponId && couponDiscountPaise > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: couponId, user_id: context.userId,
        order_id: order.id, discount_paise: couponDiscountPaise,
      });
      const { data: c } = await supabaseAdmin.from("coupons").select("usage_count").eq("id", couponId).maybeSingle();
      await supabaseAdmin.from("coupons").update({ usage_count: (c?.usage_count ?? 0) + 1 }).eq("id", couponId);
    }

    // In-app notification
    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      type: "order_placed",
      title: `Order confirmed · ${order.order_number}`,
      body: `We received your COD order of ₹${(grandTotalPaise / 100).toFixed(2)}.`,
      link: `/account/orders/${order.id}`,
    });

    return { ok: true as const, orderId: order.id, orderNumber: order.order_number };
  });
