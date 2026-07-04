import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
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

/**
 * Server-authoritative pricing that also applies a coupon.
 * Returns final totals + coupon metadata.
 */
async function computeTotalsWithCoupon(
  supabase: any, userId: string, lines: CartLine[], couponCode?: string,
) {
  const base = computeCart(lines);
  let couponDiscountPaise = 0;
  let shippingPaise = base.shippingPaise;
  let couponId: string | null = null;
  let couponError: string | null = null;

  if (couponCode) {
    const { data: rows, error } = await supabase.rpc("validate_coupon", {
      _code: couponCode.toUpperCase(),
      _user_id: userId,
      _subtotal_paise: base.subtotalPaise,
    });
    if (error) couponError = error.message;
    else {
      const row = (rows as any[] | null)?.[0];
      if (!row?.valid) couponError = row?.error ?? "Invalid coupon";
      else {
        const applied = computeCouponDiscount(
          row.discount_type, row.discount_value, row.max_discount_paise,
          base.subtotalPaise, base.shippingPaise,
        );
        couponDiscountPaise = applied.discountPaise;
        if (applied.shippingWaived) shippingPaise = 0;
        couponId = row.coupon_id;
      }
    }
  }

  // Recompute tax + grand total after coupon
  const discountedSubtotal = Math.max(0, base.subtotalPaise - couponDiscountPaise);
  const taxPaise = Math.round(discountedSubtotal * 0.18);
  const grandTotalPaise = discountedSubtotal + taxPaise + shippingPaise;

  return {
    base,
    couponError,
    couponId,
    couponCode: couponCode?.toUpperCase() ?? null,
    couponDiscountPaise,
    shippingPaise,
    taxPaise,
    grandTotalPaise,
  };
}

/**
 * Snapshot current cart into a `pending` order + create a Razorpay order.
 * Returns the info the browser needs to open Checkout.js.
 */
export const initiateRazorpayCheckoutFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    addressId: z.string().uuid(),
    lines: z.array(cartLineSchema).min(1).max(50),
    couponCode: z.string().min(2).max(30).optional(),
    notes: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return { ok: false as const, error: "Payment provider is not configured" };

    const { data: addr } = await context.supabase
      .from("addresses").select("*").eq("id", data.addressId).maybeSingle();
    if (!addr) return { ok: false as const, error: "Address not found" };

    const totals = await computeTotalsWithCoupon(context.supabase, context.userId, data.lines as CartLine[], data.couponCode);
    if (totals.base.errors.length > 0) return { ok: false as const, error: totals.base.errors.join(" · ") };
    if (totals.couponError) return { ok: false as const, error: totals.couponError };
    if (totals.grandTotalPaise <= 0) return { ok: false as const, error: "Cart is empty" };

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
        status: "payment_pending",
        payment_method: "razorpay",
        payment_status: "pending",
        subtotal_paise: totals.base.subtotalPaise,
        discount_paise: totals.base.discountPaise,
        coupon_code: totals.couponCode,
        coupon_discount_paise: totals.couponDiscountPaise,
        shipping_paise: totals.shippingPaise,
        tax_paise: totals.taxPaise,
        grand_total_paise: totals.grandTotalPaise,
        shipping_address: shippingSnap,
        contact,
        notes: data.notes ?? null,
        estimated_delivery_at: estimatedDeliveryAt,
      })
      .select("id, order_number").single();
    if (orderErr || !order) return { ok: false as const, error: orderErr?.message ?? "Failed to create order" };

    // Snapshot items
    const itemsPayload = totals.base.lines.map((l, i) => {
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
    await context.supabase.from("order_items").insert(itemsPayload);

    // Create Razorpay order via REST
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: totals.grandTotalPaise, currency: "INR",
        receipt: order.order_number,
        notes: { order_id: order.id, user_id: context.userId },
      }),
    });
    if (!rzpRes.ok) {
      const txt = await rzpRes.text();
      // Rollback
      await context.supabase.from("orders").delete().eq("id", order.id);
      return { ok: false as const, error: `Razorpay: ${txt.slice(0, 200)}` };
    }
    const rzpOrder = await rzpRes.json() as { id: string };

    await context.supabase.from("payments").insert({
      order_id: order.id, user_id: context.userId,
      provider: "razorpay", provider_order_id: rzpOrder.id,
      amount_paise: totals.grandTotalPaise, currency: "INR", status: "created",
    });

    await context.supabase.from("order_status_history").insert({
      order_id: order.id, status: "pending", note: "Awaiting payment",
    });

    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.order_number,
      rzpOrderId: rzpOrder.id,
      keyId,
      amountPaise: totals.grandTotalPaise,
      prefill: { name: addr.full_name, email, contact: addr.phone },
    };
  });

/**
 * Verify Razorpay signature client-side callback and mark order paid.
 */
export const verifyRazorpayPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return { ok: false as const, error: "Payment provider is not configured" };

    // 1. Verify HMAC
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false as const, error: "Invalid payment signature" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 2. Load order (must be owned by user and pending)
    const { data: order } = await supabaseAdmin
      .from("orders").select("*").eq("id", data.orderId).eq("user_id", context.userId).maybeSingle();
    if (!order) return { ok: false as const, error: "Order not found" };
    if (order.payment_status === "paid") {
      return { ok: true as const, orderId: order.id, orderNumber: order.order_number };
    }

    // 3. Update payment row
    await supabaseAdmin.from("payments").update({
      provider_payment_id: data.razorpay_payment_id,
      provider_signature: data.razorpay_signature,
      status: "captured",
    }).eq("order_id", order.id).eq("provider_order_id", data.razorpay_order_id);

    // 4. Update order
    await supabaseAdmin.from("orders").update({
      status: "confirmed",
      payment_status: "paid",
    }).eq("id", order.id);

    // 5. Redeem coupon
    if (order.coupon_code && order.coupon_discount_paise > 0) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons").select("id, usage_count").eq("code", order.coupon_code).maybeSingle();
      if (coupon) {
        await supabaseAdmin.from("coupon_redemptions").insert({
          coupon_id: coupon.id, user_id: context.userId,
          order_id: order.id, discount_paise: order.coupon_discount_paise,
        });
        await supabaseAdmin.from("coupons").update({ usage_count: (coupon.usage_count ?? 0) + 1 }).eq("id", coupon.id);
      }
    }

    // 6. Invoice
    await supabaseAdmin.from("invoices").insert({
      order_id: order.id, user_id: context.userId,
      subtotal_paise: order.subtotal_paise,
      discount_paise: (order.discount_paise ?? 0) + (order.coupon_discount_paise ?? 0),
      shipping_paise: order.shipping_paise,
      tax_paise: order.tax_paise,
      grand_total_paise: order.grand_total_paise,
      billing_address: order.shipping_address,
      shipping_address: order.shipping_address,
      seller: JSON.parse(JSON.stringify(COMPANY)),
    });

    // 7. History + notification
    await supabaseAdmin.from("order_status_history").insert([
      { order_id: order.id, status: "confirmed", note: "Payment received via Razorpay" },
    ]);
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      type: "payment_success",
      title: `Payment received · ${order.order_number}`,
      body: `Your payment of ₹${(order.grand_total_paise / 100).toFixed(2)} was successful.`,
      link: `/account/orders/${order.id}`,
    });

    return { ok: true as const, orderId: order.id, orderNumber: order.order_number };
  });
