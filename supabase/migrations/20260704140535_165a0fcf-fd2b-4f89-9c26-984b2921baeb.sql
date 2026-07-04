
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon_url text,
  banner_url text,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  show_on_home boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (visible = true OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sku text UNIQUE,
  price_paise int NOT NULL DEFAULT 0,
  offer_price_paise int,
  stock int NOT NULL DEFAULT 0,
  reserved_stock int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,
  weight_grams int,
  length_mm int, width_mm int, height_mm int,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  festival_tags text[] NOT NULL DEFAULT '{}',
  customization jsonb NOT NULL DEFAULT '{}'::jsonb,
  gift_builder_compatible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','archived','draft')),
  seo_title text, seo_description text,
  related_ids uuid[] NOT NULL DEFAULT '{}',
  view_count int NOT NULL DEFAULT 0,
  wishlist_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_flags ON public.products(is_featured, is_trending, is_new_arrival, is_best_seller);

CREATE TABLE public.empty_gift_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  material text,
  color text,
  capacity_items int,
  max_weight_grams int,
  length_mm int, width_mm int, height_mm int,
  allowed_category_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_product_ids uuid[] NOT NULL DEFAULT '{}',
  ribbon_compatible boolean NOT NULL DEFAULT true,
  filler_compatible boolean NOT NULL DEFAULT true,
  card_compatible boolean NOT NULL DEFAULT true,
  base_price_paise int NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','archived')),
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.empty_gift_boxes TO anon, authenticated;
GRANT ALL ON public.empty_gift_boxes TO service_role;
ALTER TABLE public.empty_gift_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empty_boxes public read" ON public.empty_gift_boxes FOR SELECT USING ((status='active' AND visible) OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "empty_boxes admin write" ON public.empty_gift_boxes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_empty_boxes_updated BEFORE UPDATE ON public.empty_gift_boxes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ready_gift_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  empty_box_id uuid REFERENCES public.empty_gift_boxes(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ribbon text, filler text, card text,
  price_paise int NOT NULL DEFAULT 0,
  offer_price_paise int,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  festival_tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','archived','draft')),
  seo_title text, seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ready_gift_boxes TO anon, authenticated;
GRANT ALL ON public.ready_gift_boxes TO service_role;
ALTER TABLE public.ready_gift_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ready_boxes public read" ON public.ready_gift_boxes FOR SELECT USING (status='active' OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "ready_boxes admin write" ON public.ready_gift_boxes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_ready_boxes_updated BEFORE UPDATE ON public.ready_gift_boxes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  banner_url text,
  theme_color text,
  start_date date,
  end_date date,
  priority int NOT NULL DEFAULT 0,
  related_product_ids uuid[] NOT NULL DEFAULT '{}',
  related_category_ids uuid[] NOT NULL DEFAULT '{}',
  related_giftbox_ids uuid[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.festivals TO anon, authenticated;
GRANT ALL ON public.festivals TO service_role;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "festivals public read" ON public.festivals FOR SELECT USING (active OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "festivals admin write" ON public.festivals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_festivals_updated BEFORE UPDATE ON public.festivals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('hero','slider','featured','trending','best_sellers','new_arrivals','festival','ai_recommendations','promo_card','category_grid','giftbox_grid')),
  title text,
  subtitle text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage public read" ON public.homepage_sections FOR SELECT USING (visible OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "homepage admin write" ON public.homepage_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_homepage_updated BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  giftbox_id uuid REFERENCES public.ready_gift_boxes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (product_id IS NOT NULL OR giftbox_id IS NOT NULL),
  UNIQUE (user_id, product_id),
  UNIQUE (user_id, giftbox_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read approved" ON public.reviews FOR SELECT USING (status='approved' OR user_id=auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "reviews self insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "reviews admin update" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "reviews admin delete" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  giftbox_id uuid REFERENCES public.ready_gift_boxes(id) ON DELETE CASCADE,
  empty_box_id uuid REFERENCES public.empty_gift_boxes(id) ON DELETE CASCADE,
  change int NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory admin read" ON public.inventory_movements FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "inventory admin write" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.delivery_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text,
  pincode_prefix text,
  base_charge_paise int NOT NULL DEFAULT 0,
  free_shipping_threshold_paise int NOT NULL DEFAULT 0,
  express_available boolean NOT NULL DEFAULT false,
  express_charge_paise int NOT NULL DEFAULT 0,
  estimated_days_min int NOT NULL DEFAULT 3,
  estimated_days_max int NOT NULL DEFAULT 7,
  cod_available boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_rules TO anon, authenticated;
GRANT ALL ON public.delivery_rules TO service_role;
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery public read" ON public.delivery_rules FOR SELECT USING (active OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "delivery admin write" ON public.delivery_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_delivery_updated BEFORE UPDATE ON public.delivery_rules FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT USING (is_public OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "settings admin write" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.store_settings (key, value, is_public) VALUES
  ('store', '{"name":"Giftty","logo_url":null,"favicon_url":null,"currency":"INR","timezone":"Asia/Kolkata","support_email":null,"support_phone":null,"business_address":null,"gst":null,"maintenance_mode":false}'::jsonb, true),
  ('social', '{"instagram":null,"facebook":null,"twitter":null,"youtube":null}'::jsonb, true),
  ('seo', '{"default_title":"Giftty","default_description":"Curated gifts and gift boxes","og_image":null}'::jsonb, true),
  ('ai', '{"enabled":true,"budget_monthly_paise":500000,"personalized_recs":true,"seasonal":true,"prompt_recommendations":null}'::jsonb, false),
  ('super_admin', '{"email":null}'::jsonb, false)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  diff jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity, entity_id);

CREATE TABLE public.admin_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  ip text,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_login_history TO authenticated;
GRANT ALL ON public.admin_login_history TO service_role;
ALTER TABLE public.admin_login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_history admin read" ON public.admin_login_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.grant_super_admin_if_matched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email text;
BEGIN
  SELECT (value->>'email') INTO admin_email FROM public.store_settings WHERE key='super_admin';
  IF admin_email IS NOT NULL
     AND NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = lower(admin_email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_super
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_if_matched();

CREATE TRIGGER on_auth_user_confirmed_grant_super
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_super_admin_if_matched();
