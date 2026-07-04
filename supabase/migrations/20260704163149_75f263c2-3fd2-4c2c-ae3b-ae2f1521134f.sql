-- RLS policies on public tables (products, categories, etc.) call has_role/is_staff
-- during SELECT evaluation. The Data API's anon role must be able to EXECUTE
-- them, otherwise anonymous product/category reads fail with 42501.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;