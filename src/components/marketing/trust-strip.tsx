import { Truck, Clock, ShieldCheck, RotateCcw } from "lucide-react";

const items = [
  { icon: Truck, title: "Free shipping", sub: "on orders ₹499+" },
  { icon: Clock, title: "Same-day", sub: "delivery in 100+ cities" },
  { icon: ShieldCheck, title: "Safe payments", sub: "100% secure checkout" },
  { icon: RotateCcw, title: "Easy returns", sub: "hassle-free 7-day policy" },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="container-page grid grid-cols-2 gap-4 py-4 md:grid-cols-4 md:py-6">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="size-6 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
