import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingPill({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-[color:var(--rating)] px-1.5 py-0.5 text-xs font-semibold text-white",
        className,
      )}
      aria-label={`Rated ${rating} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      {rating.toFixed(1)}
      <Star className="size-3 fill-current" aria-hidden />
      {count !== undefined && (
        <span className="ml-1 font-medium opacity-90">
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </span>
  );
}
