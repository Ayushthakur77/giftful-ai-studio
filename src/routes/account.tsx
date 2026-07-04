import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Package, Heart, MapPin, User, Bell, Star, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
    }
  },
  head: () => ({ meta: [{ title: "My Account — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

const nav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/reminders", label: "Reminders", icon: Bell },
  { to: "/account/reviews", label: "Reviews", icon: Star },
  { to: "/account/settings", label: "Settings", icon: Settings },
];

function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">My account</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex gap-1 overflow-x-auto hide-scrollbar md:flex-col">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium hover:bg-muted",
                    active && "border-border bg-muted text-foreground",
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
    </div>
  );
}
