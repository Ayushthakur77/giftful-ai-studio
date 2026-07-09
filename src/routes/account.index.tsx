import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Heart, MapPin, Bell, Sparkles } from "lucide-react";

import { getProfileFn } from "@/lib/profile.functions";
import { listNotificationsFn } from "@/lib/notifications.functions";
import { getPublicProductsBySlugsFn } from "@/lib/public-catalog.functions";
import { Button } from "@/components/ui/button";
import { getRecentlyViewed } from "@/lib/store";
import { ProductCard } from "@/components/product/product-card";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/account/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: notif } = useQuery({ queryKey: ["notifications"], queryFn: () => listNotificationsFn() });
  const [rvSlugs, setRvSlugs] = useState<string[]>([]);
  useEffect(() => setRvSlugs(getRecentlyViewed()), []);
  const { data: rvProducts = [] } = useQuery({
    queryKey: ["recently-viewed", rvSlugs.slice(0, 4)],
    queryFn: () => getPublicProductsBySlugsFn({ data: { slugs: rvSlugs.slice(0, 4) } }),
    enabled: rvSlugs.length > 0,
  });

  const stats = profile?.stats ?? { addressCount: 0, wishlistCount: 0, unreadNotifications: 0 };
  const p = profile?.profile;
  const firstName = (p?.name ?? "").split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold md:text-2xl">Hi {firstName} 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard to="/account/orders" icon={Package} label="Orders" value="0" />
        <StatCard to="/account/wishlist" icon={Heart} label="Wishlist" value={String(stats.wishlistCount)} />
        <StatCard to="/account/addresses" icon={MapPin} label="Addresses" value={String(stats.addressCount)} />
        <StatCard to="/account/settings" icon={Bell} label="Unread" value={String(stats.unreadNotifications)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent notifications</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/account/settings">View all</Link></Button>
        </div>
        {notif?.items && notif.items.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {notif.items.slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-start gap-3 p-3">
                <span className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${n.readAt ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        )}
      </section>

      {rvProducts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Sparkles className="size-4" /> Recently viewed</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {rvProducts.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ to, icon: Icon, label, value }: { to: string; icon: typeof Package; label: string; value: string }) {
  return (
    <Link to={to} className="group rounded-md border border-border bg-card p-4 transition hover:border-primary hover:bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </Link>
  );
}
