import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, Truck, Wallet } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyOrdersFn } from "@/lib/orders.functions";
import { formatINR } from "@/lib/catalog";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/order-ui";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "Your orders — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: OrdersListPage,
});

function OrdersListPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrdersFn(),
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Your orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track, reorder, or download invoices for past purchases.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your recent orders will appear here once you complete a purchase."
          action={<Button asChild><Link to="/">Start shopping</Link></Button>}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/account/orders/$id"
                params={{ id: o.id }}
                className="group flex flex-col gap-3 rounded-md border border-border bg-card p-4 transition hover:border-primary md:flex-row md:items-center"
              >
                <div className="flex flex-1 items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Package className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">#{o.orderNumber}</p>
                      <Badge variant="secondary" className={STATUS_TONE[o.status] ?? ""}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placed {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Wallet className="size-3" /> {o.paymentMethod.toUpperCase()}</span>
                      {o.estimatedDeliveryAt && (
                        <span className="inline-flex items-center gap-1">
                          <Truck className="size-3" /> ETA {new Date(o.estimatedDeliveryAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 md:justify-end">
                  <p className="text-base font-bold price-num">{formatINR(o.grandTotalPaise)}</p>
                  <ChevronRight className="size-5 text-muted-foreground transition group-hover:text-primary" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
