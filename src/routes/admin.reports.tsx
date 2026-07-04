import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { adminSalesReportFn } from "@/lib/admin-system.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

function AdminReports() {
  const [days, setDays] = useState(30);
  const { data: rows = [] } = useQuery({ queryKey: ["admin-sales-report", days], queryFn: () => adminSalesReportFn({ data: { days } }) });

  const totalRevenue = (rows as any[]).filter((o) => o.payment_status === "paid").reduce((s, o) => s + (o.grand_total_paise ?? 0), 0);
  const paidCount = (rows as any[]).filter((o) => o.payment_status === "paid").length;

  function downloadCSV() {
    const headers = ["order_number", "status", "payment_status", "subtotal", "discount", "shipping", "tax", "grand_total", "created_at"];
    const lines = [headers.join(",")];
    for (const o of rows as any[]) {
      lines.push([o.order_number, o.status, o.payment_status, o.subtotal_paise / 100, o.discount_paise / 100, o.shipping_paise / 100, o.tax_paise / 100, o.grand_total_paise / 100, o.created_at].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales-report-${days}d.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(+v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadCSV}><Download className="size-4 mr-1.5" /> CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Paid revenue</p>
          <p className="font-display text-2xl font-bold mt-1">{formatINR(totalRevenue)}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Paid orders</p>
          <p className="font-display text-2xl font-bold mt-1">{paidCount}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Total orders (any status)</p>
          <p className="font-display text-2xl font-bold mt-1">{rows.length}</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Order</th><th className="p-2">Status</th><th className="p-2">Paid?</th>
              <th className="p-2 text-right">Grand total</th><th className="p-2 text-left">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, 100).map((o: any) => (
              <tr key={o.id}>
                <td className="p-2 font-mono text-xs">{o.order_number}</td>
                <td className="p-2 text-center">{o.status}</td>
                <td className="p-2 text-center">{o.payment_status}</td>
                <td className="p-2 text-right tabular-nums">{formatINR(o.grand_total_paise)}</td>
                <td className="p-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
