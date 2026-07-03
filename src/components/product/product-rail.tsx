import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
      <div className="min-w-0">
        <h2 className="truncate font-display text-xl font-bold md:text-2xl lg:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
      </div>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function ProductRail({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
  children,
}: {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaTo?: string;
  children: ReactNode;
}) {
  return (
    <section className="container-page py-8 md:py-10">
      <SectionHeader title={title} subtitle={subtitle} ctaLabel={ctaLabel} ctaTo={ctaTo} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {children}
      </div>
    </section>
  );
}
