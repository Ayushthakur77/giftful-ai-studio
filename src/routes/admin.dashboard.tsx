import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, IndianRupee, Users, Clock } from "lucide-react";
import { adminDashboardStatsFn } from "@/lib/admin.functions";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminDashboardStatsFn(),
  });

  const stats = [
    { label: "Orders (7d)", value: data?.orders7d ?? 0, icon: ShoppingCart },
    { label: "Revenue (7d)", value: data ? formatINR(data.revenue7dPaise) : "—", icon: IndianRupee },
    { label: "Customers", value: data?.customers ?? 0, icon: Users },
    { label: "Pending orders", value: data?.pendingOrders ?? 0, icon: Clock },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">
              {isLoading ? "…" : s.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Manage orders, coupons, and products from the sidebar.
      </p>
    </div>
  );
}
