import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeCart, type CartLine } from "./pricing";
import { COMPANY } from "./company";

const personalizationSchema = z.record(z.string(), z.string().max(500)).optional();

const cartLineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product"),
    id: z.string(),
    productSlug: z.string(),
    quantity: z.number().int().min(1).max(20),
    personalization: personalizationSchema,
  }),
  z.object({
    kind: z.literal("ready-box"),
    id: z.string(),
    boxSlug: z.string(),
    quantity: z.number().int().min(1).max(20),
  }),
  z.object({
    kind: z.literal("custom-box"),
    id: z.string(),
    emptyBoxSlug: z.string(),
    items: z.array(z.object({
      productSlug: z.string(),
      quantity: z.number().int().min(1).max(10),
      personalization: personalizationSchema,
    })).max(20),
    ribbonSlug: z.string().optional(),
    fillerSlug: z.string().optional(),
    cardSlug: z.string().optional(),
    giftNote: z.string().max(500).optional(),
    quantity: z.number().int().min(1).max(10),
  }),
]);

export const placeCodOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    addressId: z.string().uuid(),
    lines: z.array(cartLineSchema).min(1).max(50),
    notes: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // 1. Fetch + verify address ownership
    const { data: addr, error: addrErr } = await context.supabase
      .from("addresses").select("*").eq("id", data.addressId).maybeSingle();
    if (addrErr) return { ok: false as const, error: addrErr.message };
    if (!addr) return { ok: false as const, error: "Address not found" };

    // 2. Server-authoritative pricing
    const totals = computeCart(data.lines as CartLine[]);
    if (totals.errors.length > 0) {
      return { ok: false as const, error: totals.errors.join(" · ") };
    }
    if (totals.grandTotalPaise <= 0) {
      return { ok: false as const, error: "Cart is empty" };
    }

    // 3. Snapshot address + contact
    const email = (context.claims as { email?: string })?.email ?? "";
    const shippingSnap = {
      fullName: addr.full_name, phone: addr.phone,
      line1: addr.line1, line2: addr.line2,
      city: addr.city, state: addr.state,
      pincode: addr.pincode, country: addr.country,
      label: addr.label,
    };
    const contact = { email, phone: addr.phone, name: addr.full_name };

    const estimatedDeliveryAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Insert order
    const { data: order, error: orderErr } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        status: "confirmed",
        payment_method: "cod",
        payment_status: "pending",
        subtotal_paise: totals.subtotalPaise,
        discount_paise: totals.discountPaise,
        shipping_paise: totals.shippingPaise,
        tax_paise: totals.taxPaise,
        grand_total_paise: totals.grandTotalPaise,
        shipping_address: shippingSnap,
        contact,
        notes: data.notes ?? null,
        estimated_delivery_at: estimatedDeliveryAt,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) return { ok: false as const, error: orderErr?.message ?? "Failed to create order" };

    // 5. Insert order items (snapshotted)
    const itemsPayload = totals.lines.map((l, i) => {
      const raw = data.lines[i];
      let slug = "";
      if (raw.kind === "product") slug = raw.productSlug;
      else if (raw.kind === "ready-box") slug = raw.boxSlug;
      else slug = raw.emptyBoxSlug;
      const unit = l.quantity > 0 ? Math.round(l.lineSubtotalPaise / l.quantity) : l.lineSubtotalPaise;
      return {
        order_id: order.id,
        kind: l.kind,
        slug,
        name: l.name,
        image: l.image || null,
        quantity: l.quantity,
        unit_price_paise: unit,
        line_total_paise: l.lineSubtotalPaise,
        details: l.details ?? null,
        payload: raw,
      };
    });
    const { error: itemsErr } = await context.supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      // Compensating delete — best effort
      await context.supabase.from("orders").delete().eq("id", order.id);
      return { ok: false as const, error: itemsErr.message };
    }

    // 6. Insert invoice snapshot
    await context.supabase.from("invoices").insert({
      order_id: order.id,
      user_id: context.userId,
      subtotal_paise: totals.subtotalPaise,
      discount_paise: totals.discountPaise,
      shipping_paise: totals.shippingPaise,
      tax_paise: totals.taxPaise,
      grand_total_paise: totals.grandTotalPaise,
      billing_address: shippingSnap,
      shipping_address: shippingSnap,
      seller: COMPANY,
    });

    // 7. Status history
    await context.supabase.from("order_status_history").insert([
      { order_id: order.id, status: "pending", note: "Order created" },
      { order_id: order.id, status: "confirmed", note: "Cash on Delivery confirmed" },
    ]);

    return { ok: true as const, orderId: order.id, orderNumber: order.order_number };
  });
