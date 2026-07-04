import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { adminSalesReportFn } from "@/lib/admin-system.functions";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics });

function AdminAnalytics() {
  const { data: rows = [] } = useQuery({ queryKey: ["admin-analytics-30d"], queryFn: () => adminSalesReportFn({ data: { days: 30 } }) });

  // group revenue by day
  const byDay = new Map<string, { day: string; revenue: number; orders: number }>();
  for (const o of rows as any[]) {
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    const cur = byDay.get(day) ?? { day, revenue: 0, orders: 0 };
    cur.orders += 1;
    if (o.payment_status === "paid") cur.revenue += (o.grand_total_paise ?? 0) / 100;
    byDay.set(day, cur);
  }
  const chartData = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));

  const statusCounts = new Map<string, number>();
  for (const o of rows as any[]) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  const statusData = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Analytics (last 30 days)</h1>
      <div className="rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold mb-3">Revenue trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: any) => formatINR(v * 100)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Orders per day</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Orders by status</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
