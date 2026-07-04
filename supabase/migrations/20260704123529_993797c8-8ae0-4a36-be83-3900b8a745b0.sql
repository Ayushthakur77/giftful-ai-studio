
-- Data API grants were missing on every public table, causing "permission denied"
-- even though RLS policies were correct. Add explicit grants scoped to what
-- each table's policies allow.

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

GRANT SELECT, INSERT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Ensure has_role remains executable for RLS predicates (idempotent).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO anon, authenticated, service_role;
