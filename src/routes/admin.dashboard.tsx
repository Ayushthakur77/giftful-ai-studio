import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, ShoppingCart, Users, Package, Percent, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { adminDashboardFullFn, bootstrapSuperAdminFn } from "@/lib/admin-system.functions";
import { formatINR } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard-full"],
    queryFn: () => adminDashboardFullFn(),
    refetchInterval: 30_000,
  });

  async function bootstrap() {
    const r = await bootstrapSuperAdminFn();
    if (r.ok) { toast.success("Super Admin role granted"); refetch(); }
    else toast.error(r.error);
  }

  if (error) {
    return (
      <div className="rounded-md border border-border p-6">
        <h1 className="font-display text-2xl font-bold">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account may not have the Super Admin role yet. Click below to grant it (requires your email to match the configured SUPER_ADMIN_EMAIL).
        </p>
        <Button onClick={bootstrap} className="mt-4">Grant me Super Admin</Button>
      </div>
    );
  }

  const stats = [
    { label: "Revenue today", value: data ? formatINR(data.revenue.todayPaise) : "—", icon: IndianRupee },
    { label: "Revenue this month", value: data ? formatINR(data.revenue.monthPaise) : "—", icon: TrendingUp },
    { label: "Revenue this year", value: data ? formatINR(data.revenue.yearPaise) : "—", icon: TrendingUp },
    { label: "AOV", value: data ? formatINR(data.aovPaise) : "—", icon: Award },
    { label: "Total orders", value: data?.orders.total ?? 0, icon: ShoppingCart },
    { label: "Pending", value: data?.orders.pending ?? 0, icon: ShoppingCart },
    { label: "Processing", value: data?.orders.processing ?? 0, icon: ShoppingCart },
    { label: "Delivered", value: data?.orders.delivered ?? 0, icon: ShoppingCart },
    { label: "Customers", value: data?.customers.total ?? 0, icon: Users },
    { label: "New (month)", value: data?.customers.newThisMonth ?? 0, icon: Users },
    { label: "Active coupons", value: data?.activeCoupons ?? 0, icon: Percent },
    { label: "Payment success", value: `${data?.paymentSuccessRate ?? 0}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-xl font-bold">{isLoading ? "…" : s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <h2 className="font-semibold">Low stock ({data?.lowStock.length ?? 0})</h2>
          </div>
          {data?.lowStock.length ? (
            <ul className="space-y-1 text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="truncate">{p.name}</span>
                  <span className="text-destructive">{p.stock} left</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">All products stocked.</p>}
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="size-4" />
            <h2 className="font-semibold">Top products by views</h2>
          </div>
          {data?.topProducts.length ? (
            <ul className="space-y-1 text-sm">
              {data.topProducts.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="truncate">{p.name}</span>
                  <span className="text-muted-foreground">{p.view_count} views</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No product analytics yet.</p>}
        </div>
      </div>
    </div>
  );
}
