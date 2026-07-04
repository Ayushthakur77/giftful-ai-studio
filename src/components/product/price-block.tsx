import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/catalog";

/**
 * Accepts money in **paise** (canonical Phase 5 unit).
 * Legacy callers passing rupees can use the `price` / `mrp` props;
 * they are converted internally.
 */
export function PriceBlock({
  pricePaise,
  mrpPaise,
  price,
  mrp,
  size = "md",
  className,
}: {
  pricePaise?: number;
  mrpPaise?: number;
  /** Legacy rupees prop. */
  price?: number;
  /** Legacy rupees prop. */
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const p = pricePaise ?? (price != null ? price * 100 : 0);
  const m = mrpPaise ?? (mrp != null ? mrp * 100 : undefined);
  const discount = m && m > p ? Math.round(((m - p) / m) * 100) : 0;
  const priceCls =
    size === "lg" ? "text-2xl md:text-3xl" : size === "sm" ? "text-base" : "text-lg md:text-xl";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2 price-num", className)}>
      <span className={cn("font-bold text-[color:var(--price)]", priceCls)}>{formatINR(p)}</span>
      {m && m > p && (
        <>
          <span className="text-sm text-[color:var(--strike)] line-through">{formatINR(m)}</span>
          <span className="text-sm font-semibold text-success">{discount}% off</span>
        </>
      )}
    </div>
  );
}
