/**
 * Server-only helper: resolve shipping charge + COD eligibility from
 * `delivery_rules` for a given shipping state and cart subtotal.
 *
 * Falls back to a sensible default when no rule is configured for that
 * state, so checkout never blocks on missing seed data.
 */
const DEFAULT_SHIPPING_PAISE = 7900;
const DEFAULT_FREE_THRESHOLD_PAISE = 99900;

export type ShippingQuote = {
  shippingPaise: number;
  codAvailable: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  matchedRule: boolean;
};

export async function resolveShippingForState(
  state: string | null | undefined,
  subtotalPaise: number,
): Promise<ShippingQuote> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stateName = (state ?? "").trim();

  let rule: {
    base_charge_paise: number;
    free_shipping_threshold_paise: number;
    cod_available: boolean;
    estimated_days_min: number;
    estimated_days_max: number;
  } | null = null;

  if (stateName) {
    const { data } = await supabaseAdmin
      .from("delivery_rules")
      .select("base_charge_paise,free_shipping_threshold_paise,cod_available,estimated_days_min,estimated_days_max,active")
      .ilike("state", stateName)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (data) {
      rule = data;
    }
  }

  const base = rule?.base_charge_paise ?? DEFAULT_SHIPPING_PAISE;
  const threshold = rule?.free_shipping_threshold_paise ?? DEFAULT_FREE_THRESHOLD_PAISE;
  const shippingPaise =
    subtotalPaise <= 0 ? 0 : threshold > 0 && subtotalPaise >= threshold ? 0 : base;

  return {
    shippingPaise,
    codAvailable: rule?.cod_available ?? true,
    estimatedDaysMin: rule?.estimated_days_min ?? 3,
    estimatedDaysMax: rule?.estimated_days_max ?? 7,
    matchedRule: rule != null,
  };
}
