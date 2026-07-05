import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Tags, LayoutTemplate,
  Settings, Gift, PackageOpen, PartyPopper, Sparkles, Star, Boxes, Truck,
  CreditCard, FileBarChart, LineChart, Bell, Shield, ScrollText, Users2, HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    }
    if (!context.user.isSuperAdmin) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Admin — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const groups: { label: string; items: { to: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/analytics", label: "Analytics", icon: LineChart },
      { to: "/admin/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/recipients", label: "Recipients", icon: Users2 },
      { to: "/admin/relationships", label: "Relationships", icon: HeartHandshake },
      { to: "/admin/empty-boxes", label: "Empty Boxes", icon: PackageOpen },
      { to: "/admin/ready-boxes", label: "Ready Boxes", icon: Gift },
      { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/delivery", label: "Delivery", icon: Truck },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/homepage-builder", label: "Homepage", icon: LayoutTemplate },
      { to: "/admin/festivals", label: "Festivals", icon: PartyPopper },
      { to: "/admin/ai", label: "AI", icon: Sparkles },
    ],
  },
  {
    label: "Community",
    items: [
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/coupons", label: "Coupons", icon: Tags },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/security", label: "Security", icon: Shield },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="container-page grid gap-6 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</div>
        <nav className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{g.label}</div>
              {g.items.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex min-h-9 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted",
                      active && "bg-muted text-foreground",
                    )}
                  >
                    <n.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
