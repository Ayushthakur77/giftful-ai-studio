import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
}) {
  return (
    <div className="container-page py-8 md:py-12">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            {breadcrumbs.map((b, i) => (
              <li key={i} className="flex items-center gap-1">
                <span aria-hidden>/</span>
                {b.to ? <Link to={b.to} className="hover:text-foreground">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
        <Construction className="size-10 text-muted-foreground" aria-hidden />
        <h2 className="font-display text-lg font-semibold">Coming soon</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This section is scaffolded and will be built out in the next phase.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
