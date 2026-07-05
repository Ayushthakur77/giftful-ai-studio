/**
 * Idempotent post-payment pipeline for Razorpay orders.
 *
 * Both the webhook (`/api/public/razorpay-webhook`) and the client-side
 * verify callback (`verifyRazorpayPaymentFn`) call this on a successful
 * capture. Every step checks its own preconditions so running twice
 * never duplicates rows.
 *
 * Steps:
 *   1. Update payment row.
 *   2. Advance the order (only while still `payment_pending`/`pending`).
 *   3. Redeem coupon via the atomic `redeem_coupon` RPC (won't double-count).
 *   4. Insert invoice (skipped if one already exists).
 *   5. Insert order_status_history row (skipped if already present).
 *   6. Insert user notification (skipped if already present).
 */
import { COMPANY } from "./company";

type CapturedPayment = {
  provider_payment_id?: string;
  method?: string | null;
  raw_response?: unknown;
};

export type PaymentSuccessInput = {
  orderId: string;
  paymentRowId?: string; // if already loaded
  captured?: CapturedPayment;
};

export async function processSuccessfulPayment(input: PaymentSuccessInput): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Load order (source of truth for user_id + coupon info + amounts)
  const { data: order } = await supabaseAdmin
    .from("orders").select("*").eq("id", input.orderId).maybeSingle();
  if (!order) return;

  // If already paid, we've already run — nothing to do.
  if (order.payment_status === "paid") return;

  // 2. Update payment row (best-effort — the caller may have done this).
  const patch = {
    status: "captured" as const,
    ...(input.captured?.provider_payment_id ? { provider_payment_id: input.captured.provider_payment_id } : {}),
    ...(input.captured?.method ? { method: input.captured.method } : {}),
    ...(input.captured?.raw_response !== undefined ? { raw_response: input.captured.raw_response as any } : {}),
  };
  if (input.paymentRowId) {
    await supabaseAdmin.from("payments").update(patch).eq("id", input.paymentRowId);
  } else {
    await supabaseAdmin.from("payments").update(patch).eq("order_id", order.id);
  }

  // 3. Advance the order — guarded on payment_status to be idempotent.
  await supabaseAdmin.from("orders")
    .update({ status: "confirmed", payment_status: "paid" })
    .eq("id", order.id)
    .in("payment_status", ["pending"]);

  // 4. Coupon redemption via atomic RPC.
  //    `redeem_coupon` bumps usage_count only when within the total limit,
  //    then inserts a redemption row. The redemptions PK / unique index on
  //    (coupon_id, order_id) prevents duplicates if we ever re-run.
  if (order.coupon_code && (order.coupon_discount_paise ?? 0) > 0) {
    const { data: existing } = await supabaseAdmin
      .from("coupon_redemptions").select("id").eq("order_id", order.id).maybeSingle();
    if (!existing) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons").select("id").eq("code", order.coupon_code).maybeSingle();
      if (coupon?.id) {
        await supabaseAdmin.rpc("redeem_coupon", {
          _coupon_id: coupon.id,
          _user_id: order.user_id,
          _order_id: order.id,
          _discount_paise: order.coupon_discount_paise,
        });
      }
    }
  }

  // 5. Invoice — one per order.
  const { data: existingInvoice } = await supabaseAdmin
    .from("invoices").select("id").eq("order_id", order.id).maybeSingle();
  if (!existingInvoice) {
    await supabaseAdmin.from("invoices").insert({
      order_id: order.id, user_id: order.user_id,
      subtotal_paise: order.subtotal_paise,
      discount_paise: (order.discount_paise ?? 0) + (order.coupon_discount_paise ?? 0),
      shipping_paise: order.shipping_paise,
      tax_paise: order.tax_paise,
      grand_total_paise: order.grand_total_paise,
      billing_address: order.shipping_address,
      shipping_address: order.shipping_address,
      seller: JSON.parse(JSON.stringify(COMPANY)),
    });
  }

  // 6. Status history — skip if the "confirmed via payment" row is already present.
  const { data: existingHistory } = await supabaseAdmin
    .from("order_status_history").select("id")
    .eq("order_id", order.id).eq("status", "confirmed").eq("note", "Payment received via Razorpay")
    .maybeSingle();
  if (!existingHistory) {
    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id, status: "confirmed", note: "Payment received via Razorpay",
    });
  }

  // 7. Notification — skip if we've already sent one for this order.
  const { data: existingNotif } = await supabaseAdmin
    .from("notifications").select("id")
    .eq("user_id", order.user_id).eq("type", "payment_success")
    .eq("link", `/account/orders/${order.id}`)
    .maybeSingle();
  if (!existingNotif) {
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: "payment_success",
      title: `Payment received · ${order.order_number}`,
      body: `Your payment of ₹${(order.grand_total_paise / 100).toFixed(2)} was successful.`,
      link: `/account/orders/${order.id}`,
    });
  }
}
