-- Prevent double-redemption of coupons across concurrent webhook/verify paths.
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_order_unique
  ON public.coupon_redemptions (order_id);

-- Ensure only one invoice per order (also enforced by app code).
CREATE UNIQUE INDEX IF NOT EXISTS invoices_order_unique
  ON public.invoices (order_id);