/**
 * Shared UI helpers for order status rendering.
 */
export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  payment_pending: "Payment pending",
  payment_failed: "Payment failed",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  ready_for_shipment: "Ready for shipment",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund requested",
  refunded: "Refunded",
  returned: "Returned",
};

export const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  payment_pending: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200",
  payment_failed: "bg-destructive/10 text-destructive",
  confirmed: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  processing: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  packed: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200",
  ready_for_shipment: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200",
  shipped: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200",
  out_for_delivery: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200",
  delivered: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  cancelled: "bg-muted text-muted-foreground line-through",
  refund_requested: "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200",
  refunded: "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200",
  returned: "bg-muted text-muted-foreground",
};

export const TIMELINE_ORDER = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;
