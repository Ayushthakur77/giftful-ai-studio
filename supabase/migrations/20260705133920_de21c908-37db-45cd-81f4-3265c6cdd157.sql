
-- Product view count increment (safe, no privileges leakage; anon-callable)
CREATE OR REPLACE FUNCTION public.increment_product_view(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products SET view_count = view_count + 1 WHERE slug = _slug AND status = 'active';
$$;
GRANT EXECUTE ON FUNCTION public.increment_product_view(text) TO anon, authenticated;

-- Product review aggregate (approved only)
CREATE OR REPLACE FUNCTION public.product_review_stats(_product_id uuid)
RETURNS TABLE(avg_rating numeric, review_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating)::numeric(3,2), 0), COUNT(*)::int
  FROM public.reviews
  WHERE product_id = _product_id AND status = 'approved';
$$;
GRANT EXECUTE ON FUNCTION public.product_review_stats(uuid) TO anon, authenticated;

-- Allow anon to read approved reviews for public product pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Public can read approved reviews'
  ) THEN
    CREATE POLICY "Public can read approved reviews" ON public.reviews
      FOR SELECT TO anon, authenticated
      USING (status = 'approved');
  END IF;
END $$;

GRANT SELECT ON public.reviews TO anon;
