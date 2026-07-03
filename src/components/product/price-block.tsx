import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/mock-data";

export function PriceBlock({
  price,
  mrp,
  size = "md",
  className,
}: {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const priceCls =
    size === "lg" ? "text-2xl md:text-3xl" : size === "sm" ? "text-base" : "text-lg md:text-xl";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2 price-num", className)}>
      <span className={cn("font-bold text-[color:var(--price)]", priceCls)}>{formatPrice(price)}</span>
      {mrp && mrp > price && (
        <>
          <span className="text-sm text-[color:var(--strike)] line-through">{formatPrice(mrp)}</span>
          <span className="text-sm font-semibold text-success">{discount}% off</span>
        </>
      )}
    </div>
  );
}
