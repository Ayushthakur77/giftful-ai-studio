import { Link } from "@tanstack/react-router";

export function OccasionTile({
  slug,
  name,
  emoji,
}: {
  slug: string;
  name: string;
  emoji: string;
}) {
  return (
    <Link
      to="/o/$occasion"
      params={{ occasion: slug }}
      className="group flex aspect-[4/5] min-h-11 flex-col items-center justify-center gap-2 rounded-md border border-border bg-card p-3 text-center transition-shadow hover:shadow-sm md:aspect-square"
    >
      <span className="text-3xl md:text-4xl" aria-hidden>{emoji}</span>
      <span className="text-xs font-medium text-foreground md:text-sm">{name}</span>
    </Link>
  );
}
