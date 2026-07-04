import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CouponPreview = {
  ok: boolean;
  code?: string;
  description?: string | null;
  discountType?: "flat" | "percent" | "free_shipping";
  discountPaise?: number;   // computed against subtotal
  shippingWaived?: boolean;
  error?: string;
};

/** Given a subtotal + shipping, compute the discount a coupon would apply. */
export function computeCouponDiscount(
  discountType: string,
  discountValue: number,
  maxDiscountPaise: number | null | undefined,
  subtotalPaise: number,
  shippingPaise: number,
): { discountPaise: number; shippingWaived: boolean } {
  if (discountType === "flat") {
    return { discountPaise: Math.min(discountValue, subtotalPaise), shippingWaived: false };
  }
  if (discountType === "percent") {
    let d = Math.floor((subtotalPaise * discountValue) / 100);
    if (maxDiscountPaise && maxDiscountPaise > 0) d = Math.min(d, maxDiscountPaise);
    return { discountPaise: d, shippingWaived: false };
  }
  if (discountType === "free_shipping") {
    return { discountPaise: 0, shippingWaived: true };
  }
  return { discountPaise: 0, shippingWaived: false };
}

export const validateCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    code: z.string().min(2).max(30),
    subtotalPaise: z.number().int().min(0),
    shippingPaise: z.number().int().min(0).default(0),
  }).parse(d))
  .handler(async ({ data, context }): Promise<CouponPreview> => {
    const { data: rows, error } = await context.supabase
      .rpc("validate_coupon", {
        _code: data.code.toUpperCase(),
        _user_id: context.userId,
        _subtotal_paise: data.subtotalPaise,
      });
    if (error) return { ok: false, error: error.message };
    const row = (rows as any[] | null)?.[0];
    if (!row || !row.valid) return { ok: false, error: row?.error ?? "Invalid coupon" };

    const { discountPaise, shippingWaived } = computeCouponDiscount(
      row.discount_type, row.discount_value, row.max_discount_paise,
      data.subtotalPaise, data.shippingPaise,
    );

    const { data: c } = await context.supabase
      .from("coupons").select("description").eq("id", row.coupon_id).maybeSingle();

    return {
      ok: true,
      code: data.code.toUpperCase(),
      description: c?.description ?? null,
      discountType: row.discount_type,
      discountPaise,
      shippingWaived,
    };
  });

export const listActiveCouponsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("coupons")
      .select("code, description, discount_type, discount_value, max_discount_paise, min_order_paise, first_order_only, valid_until")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });
