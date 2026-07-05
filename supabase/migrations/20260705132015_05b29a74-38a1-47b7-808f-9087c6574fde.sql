
-- Expand homepage_sections kinds
ALTER TABLE public.homepage_sections DROP CONSTRAINT IF EXISTS homepage_sections_kind_check;
ALTER TABLE public.homepage_sections ADD CONSTRAINT homepage_sections_kind_check CHECK (
  kind = ANY (ARRAY[
    'hero','hero_slider','slider','featured','trending','best_sellers','new_arrivals',
    'festival','ai_recommendations','promo_card','category_grid','giftbox_grid',
    'occasion_grid','recipient_grid','relationship_grid','testimonials',
    'banner_strip','usp_strip','countdown_offer','product_showcase','image_cards'
  ])
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_city TEXT,
  avatar_url TEXT,
  rating SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  quote TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT
  USING (visible = true OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "testimonials_admin_write" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_testimonials_updated
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_testimonials_visible_order ON public.testimonials(visible, sort_order);
