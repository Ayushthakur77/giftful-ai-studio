import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListOrdersFn, adminUpdateOrderStatusFn } from "@/lib/admin.functions";
import { formatINR } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = [
  "all", "pending", "confirmed", "processing", "packed",
  "shipped", "out_for_delivery", "delivered", "cancelled", "refunded",
];

const NEXT_STATUSES = [
  "confirmed", "processing", "packed", "shipped",
  "out_for_delivery", "delivered", "cancelled",
];

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => adminListOrdersFn({ data: { status: filter, limit: 100 } }),
  });

  const update = useMutation({
    mutationFn: (v: { orderId: string; status: string }) =>
      adminUpdateOrderStatusFn({ data: { orderId: v.orderId, status: v.status as any } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-md border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No orders found.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o: any) => {
              const contact = o.contact as { name?: string; email?: string } | null;
              return (
                <div key={o.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_220px] md:items-center">
                  <div className="min-w-0">
                    <Link to="/account/orders/$id" params={{ id: o.id }}
                          className="font-semibold hover:underline">{o.order_number}</Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {contact?.name ?? "Customer"} · {contact?.email ?? ""} · {new Date(o.created_at).toLocaleString("en-IN")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline">{o.payment_method}</Badge>
                      <Badge variant={o.payment_status === "paid" ? "default" : "outline"} className="capitalize">
                        {o.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-bold price-num md:text-right">{formatINR(o.grand_total_paise)}</p>
                  <div className="hidden md:block w-2" />
                  <Select
                    onValueChange={(v) => update.mutate({ orderId: o.id, status: v })}
                    disabled={update.isPending}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="Change status" /></SelectTrigger>
                    <SelectContent>
                      {NEXT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>Mark {s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
