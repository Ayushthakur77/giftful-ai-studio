import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package, Printer, ArrowLeft, MapPin, CheckCircle2, Circle,
  Truck, Wallet, XCircle, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderByIdFn, cancelOrderFn } from "@/lib/orders.functions";
import { formatINR } from "@/lib/catalog";
import { STATUS_LABEL, STATUS_TONE, TIMELINE_ORDER } from "@/lib/order-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderByIdFn({ data: { id } }),
  });

  const cancel = useMutation({
    mutationFn: () => cancelOrderFn({ data: { id } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading order…</p>;
  if (!data) throw notFound();

  const { order, items, history, invoice } = data;
  const ship = order.shipping_address as any;
  const currentIdx = TIMELINE_ORDER.indexOf(order.status as any);
  const canCancel = ["pending", "payment_pending", "confirmed", "processing"].includes(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/account/orders"><ArrowLeft className="mr-1.5 size-4" /> All orders</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 size-4" /> Print invoice
          </Button>
          {canCancel && (
            <Button size="sm" variant="destructive" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              <XCircle className="mr-1.5 size-4" /> Cancel order
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order</p>
            <h2 className="font-display text-2xl font-bold">#{order.order_number}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <Badge className={cn("text-xs", STATUS_TONE[order.status] ?? "")}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              Payment: <span className="font-medium uppercase">{order.payment_method}</span> · {order.payment_status}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="rounded-md border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Truck className="size-4" /> Tracking
          </h3>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {TIMELINE_ORDER.map((s, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <li key={s} className="flex flex-col items-start gap-1.5">
                  <div className="flex w-full items-center">
                    {done ? (
                      <CheckCircle2 className={cn("size-5", current ? "text-primary" : "text-emerald-600")} />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/40" />
                    )}
                    {i < TIMELINE_ORDER.length - 1 && (
                      <div className={cn("ml-1 h-0.5 flex-1", i < currentIdx ? "bg-emerald-600" : "bg-border")} />
                    )}
                  </div>
                  <p className={cn("text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {STATUS_LABEL[s]}
                  </p>
                </li>
              );
            })}
          </ol>
          {order.estimated_delivery_at && (
            <p className="mt-4 text-xs text-muted-foreground">
              Estimated delivery by <span className="font-medium text-foreground">
                {new Date(order.estimated_delivery_at).toLocaleDateString()}
              </span>
            </p>
          )}
          {order.tracking_number && (
            <p className="mt-1 text-xs text-muted-foreground">
              Tracking #: <span className="font-mono font-medium">{order.tracking_number}</span>
            </p>
          )}
        </div>
      )}

      {/* Items + Address grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-md border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Package className="size-4" /> Items ({items.length})
          </h3>
          <ul className="space-y-4">
            {items.map((it: any) => (
              <li key={it.id} className="flex gap-3">
                {it.image && <img src={it.image} alt="" className="size-16 shrink-0 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{it.name}</p>
                  {it.details && Array.isArray(it.details) && it.details.length > 0 && (
                    <ul className="mt-0.5 text-xs text-muted-foreground">
                      {it.details.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ul>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty {it.quantity} × {formatINR(it.unit_price_paise)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold price-num">{formatINR(it.line_total_paise)}</p>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          <dl className="grid gap-1.5 text-sm price-num">
            <Row label="Subtotal" value={formatINR(order.subtotal_paise)} />
            {order.discount_paise > 0 && <Row label="Discount" value={`− ${formatINR(order.discount_paise)}`} />}
            <Row label="Shipping" value={order.shipping_paise === 0 ? "Free" : formatINR(order.shipping_paise)} />
            <Row label="GST (18%)" value={formatINR(order.tax_paise)} />
            <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-base font-bold">Grand total</span>
              <span className="text-lg font-bold">{formatINR(order.grand_total_paise)}</span>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="size-4" /> Delivering to
            </h3>
            <p className="text-sm font-semibold">{ship?.fullName}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {ship?.line1}{ship?.line2 ? `, ${ship.line2}` : ""}<br />
              {ship?.city}, {ship?.state} {ship?.pincode}<br />
              {ship?.country}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{ship?.phone}</p>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Wallet className="size-4" /> Payment
            </h3>
            <p className="text-sm">
              <span className="font-medium uppercase">{order.payment_method}</span> · {order.payment_status}
            </p>
            {order.notes && (
              <>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">Note</p>
                <p className="text-sm">{order.notes}</p>
              </>
            )}
          </div>

          {invoice && (
            <div className="rounded-md border border-border bg-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="size-4" /> Invoice
              </h3>
              <p className="font-mono text-sm">{invoice.invoice_number}</p>
              <p className="mt-1 text-xs text-muted-foreground">Issued {new Date(invoice.issued_at).toLocaleDateString()}</p>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => window.print()}>
                <Printer className="mr-1.5 size-4" /> Print / Save PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-md border border-border bg-card p-5 print:hidden">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
          <ol className="space-y-3">
            {history.map((h: any) => (
              <li key={h.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="font-medium">{STATUS_LABEL[h.status] ?? h.status}</p>
                  {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Printable invoice header (only visible on print) */}
      <div className="hidden print:block">
        {invoice && (
          <div className="rounded-md border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">TAX INVOICE</h2>
                <p className="mt-1 font-mono text-sm">{invoice.invoice_number}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(invoice.issued_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">{(invoice.seller as any)?.name}</p>
                {(invoice.seller as any)?.addressLines?.map((l: string, i: number) => <p key={i}>{l}</p>)}
                <p>GSTIN: {(invoice.seller as any)?.gstin}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
