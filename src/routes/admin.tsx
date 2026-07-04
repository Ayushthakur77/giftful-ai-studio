import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Tags, LayoutTemplate, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    }
    // Hide admin entirely from everyone except the Super Admin.
    if (!context.user.isSuperAdmin) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Admin — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Tags },
  { to: "/admin/homepage-builder", label: "Homepage", icon: LayoutTemplate },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="container-page grid gap-6 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin</div>
        <nav className="flex gap-1 overflow-x-auto hide-scrollbar md:flex-col">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                  active && "bg-muted text-foreground",
                )}
              >
                <n.icon className="size-4" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
