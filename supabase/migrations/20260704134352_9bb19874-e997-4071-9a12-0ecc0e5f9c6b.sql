
-- Helper: is staff or super_admin
CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'super_admin') OR public.has_role(_uid,'staff');
$$;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated, service_role;

-- ---------- 1. PAYMENTS ----------
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_signature TEXT,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_provider_order ON public.payments(provider_order_id);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff_all_payments" ON public.payments
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- 2. COUPONS ----------
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL DEFAULT 0,
  max_discount_paise INTEGER,
  min_order_paise INTEGER NOT NULL DEFAULT 0,
  first_order_only BOOLEAN NOT NULL DEFAULT false,
  per_user_limit INTEGER NOT NULL DEFAULT 0,
  total_usage_limit INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(active);

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_active_coupons" ON public.coupons
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "staff_manage_coupons" ON public.coupons
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- 3. COUPON REDEMPTIONS ----------
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_paise INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions(coupon_id);

GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "staff_read_redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- 4. Orders: coupon columns ----------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount_paise INTEGER NOT NULL DEFAULT 0;

-- ---------- 5. NOTIFICATIONS ----------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- 6. Coupon validation function ----------
CREATE OR REPLACE FUNCTION public.validate_coupon(_code TEXT, _user_id UUID, _subtotal_paise INTEGER)
RETURNS TABLE(valid BOOLEAN, coupon_id UUID, discount_type TEXT, discount_value INTEGER, max_discount_paise INTEGER, error TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.coupons%ROWTYPE;
  user_uses INTEGER;
  has_prior_orders INTEGER;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(_code) AND active = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, 'Invalid coupon'::TEXT; RETURN;
  END IF;
  IF c.valid_from IS NOT NULL AND now() < c.valid_from THEN
    RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise, 'Coupon not yet active'::TEXT; RETURN;
  END IF;
  IF c.valid_until IS NOT NULL AND now() > c.valid_until THEN
    RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise, 'Coupon expired'::TEXT; RETURN;
  END IF;
  IF _subtotal_paise < c.min_order_paise THEN
    RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise,
      ('Minimum order '||(c.min_order_paise/100)::TEXT||' required')::TEXT; RETURN;
  END IF;
  IF c.total_usage_limit > 0 AND c.usage_count >= c.total_usage_limit THEN
    RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise, 'Coupon fully redeemed'::TEXT; RETURN;
  END IF;
  IF c.per_user_limit > 0 THEN
    SELECT count(*) INTO user_uses FROM public.coupon_redemptions WHERE coupon_id = c.id AND user_id = _user_id;
    IF user_uses >= c.per_user_limit THEN
      RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise, 'Coupon already used'::TEXT; RETURN;
    END IF;
  END IF;
  IF c.first_order_only THEN
    SELECT count(*) INTO has_prior_orders FROM public.orders WHERE user_id = _user_id AND status <> 'cancelled';
    IF has_prior_orders > 0 THEN
      RETURN QUERY SELECT false, c.id, c.discount_type, c.discount_value, c.max_discount_paise, 'Only for first order'::TEXT; RETURN;
    END IF;
  END IF;
  RETURN QUERY SELECT true, c.id, c.discount_type, c.discount_value, c.max_discount_paise, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, UUID, INTEGER) TO authenticated, service_role;

-- ---------- 7. Seed sample coupons ----------
INSERT INTO public.coupons (code, description, discount_type, discount_value, max_discount_paise, min_order_paise, first_order_only, per_user_limit)
VALUES
  ('WELCOME100', 'Flat ₹100 off on first order', 'flat', 10000, NULL, 49900, true, 1),
  ('SAVE15',     '15% off up to ₹300', 'percent', 15, 30000, 99900, false, 3),
  ('FREESHIP',   'Free shipping on orders above ₹499', 'free_shipping', 0, NULL, 49900, false, 0)
ON CONFLICT (code) DO NOTHING;
