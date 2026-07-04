import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListPaymentsFn } from "@/lib/admin-ops.functions";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const [status, setStatus] = useState("all");
  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments", status],
    queryFn: () => adminListPaymentsFn({ data: { status } }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Payments ({payments.length})</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="captured">Captured</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Order</th>
              <th className="p-2 text-left">Provider</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Reference</th>
              <th className="p-2 text-left">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payments.</td></tr> :
              payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-2 font-mono">{p.orders?.order_number ?? "—"}</td>
                  <td className="p-2">{p.provider}</td>
                  <td className="p-2">{p.method ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{formatINR(p.amount_paise ?? 0)}</td>
                  <td className="p-2">
                    <Badge variant={p.status === "captured" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="p-2 font-mono text-xs">{p.provider_payment_id ?? p.provider_order_id ?? "—"}</td>
                  <td className="p-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
