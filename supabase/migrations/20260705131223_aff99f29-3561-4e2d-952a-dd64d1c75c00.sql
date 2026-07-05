
-- =========================================================
-- Recipients
-- =========================================================
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipients TO anon, authenticated;
GRANT ALL ON public.recipients TO service_role;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipients_public_read" ON public.recipients FOR SELECT USING (visible = true OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "recipients_admin_write" ON public.recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_recipients_updated BEFORE UPDATE ON public.recipients
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_recipients_visible_order ON public.recipients (visible, sort_order);

-- =========================================================
-- Relationships
-- =========================================================
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.relationships TO anon, authenticated;
GRANT ALL ON public.relationships TO service_role;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relationships_public_read" ON public.relationships FOR SELECT USING (visible = true OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "relationships_admin_write" ON public.relationships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_relationships_updated BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_relationships_visible_order ON public.relationships (visible, sort_order);

-- =========================================================
-- Junction tables
-- =========================================================
CREATE TABLE public.product_recipients (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, recipient_id)
);
GRANT SELECT ON public.product_recipients TO anon, authenticated;
GRANT ALL ON public.product_recipients TO service_role;
ALTER TABLE public.product_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_recipients_public_read" ON public.product_recipients FOR SELECT USING (true);
CREATE POLICY "product_recipients_admin_write" ON public.product_recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_product_recipients_recipient ON public.product_recipients (recipient_id);

CREATE TABLE public.product_relationships (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, relationship_id)
);
GRANT SELECT ON public.product_relationships TO anon, authenticated;
GRANT ALL ON public.product_relationships TO service_role;
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_relationships_public_read" ON public.product_relationships FOR SELECT USING (true);
CREATE POLICY "product_relationships_admin_write" ON public.product_relationships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_product_relationships_relationship ON public.product_relationships (relationship_id);

-- =========================================================
-- Seed data
-- =========================================================
INSERT INTO public.recipients (slug, name, tagline, sort_order) VALUES
  ('him',        'For Him',       'Thoughtful picks for the men in your life',   10),
  ('her',        'For Her',       'Curated gifts that spark joy',                 20),
  ('kids',       'For Kids',      'Playful, safe, and delightful',                30),
  ('parents',    'For Parents',   'Show them how much they mean',                 40),
  ('couple',     'For Couple',    'Celebrate their love together',                50),
  ('colleagues', 'For Colleagues','Office-appropriate gifts of appreciation',     60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.relationships (slug, name, tagline, sort_order) VALUES
  ('wife',      'Wife',      'For the love of your life',                 10),
  ('husband',   'Husband',   'For your forever partner',                  20),
  ('mother',    'Mother',    'For the woman who did it all',              30),
  ('father',    'Father',    'For your first hero',                       40),
  ('brother',   'Brother',   'For your partner in mischief',              50),
  ('sister',    'Sister',    'For your first best friend',                60),
  ('friend',    'Friend',    'For the family you chose',                  70),
  ('boss',      'Boss',      'A polished token of appreciation',          80),
  ('colleague', 'Colleague', 'Warm, professional, always right',          90),
  ('girlfriend','Girlfriend','For your favourite person',                 100),
  ('boyfriend', 'Boyfriend', 'For the one who gets you',                  110)
ON CONFLICT (slug) DO NOTHING;
