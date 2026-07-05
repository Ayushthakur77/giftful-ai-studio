/**
 * Flat shipping rule (state-wise rules removed by product decision):
 *   - Free shipping when subtotal >= ₹50
 *   - Otherwise flat ₹70
 *   - COD always available
 */
const FLAT_SHIPPING_PAISE = 7000;
const FREE_THRESHOLD_PAISE = 5000;

export type ShippingQuote = {
  shippingPaise: number;
  codAvailable: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  matchedRule: boolean;
};

export async function resolveShippingForState(
  _state: string | null | undefined,
  subtotalPaise: number,
): Promise<ShippingQuote> {
  const shippingPaise =
    subtotalPaise <= 0 ? 0 : subtotalPaise >= FREE_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;
  return {
    shippingPaise,
    codAvailable: true,
    estimatedDaysMin: 3,
    estimatedDaysMax: 7,
    matchedRule: true,
  };
}
