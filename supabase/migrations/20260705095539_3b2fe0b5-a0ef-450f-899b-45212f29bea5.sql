
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  _coupon_id uuid,
  _user_id uuid,
  _order_id uuid,
  _discount_paise integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows integer;
BEGIN
  -- Atomically bump usage_count only when still within the total limit.
  UPDATE public.coupons
     SET usage_count = usage_count + 1
   WHERE id = _coupon_id
     AND active = true
     AND (total_usage_limit = 0 OR usage_count < total_usage_limit);
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, order_id, discount_paise)
  VALUES (_coupon_id, _user_id, _order_id, _discount_paise);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(uuid, uuid, uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(uuid, uuid, uuid, integer) TO authenticated, service_role;
