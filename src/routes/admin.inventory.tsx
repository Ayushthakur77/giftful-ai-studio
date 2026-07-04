import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminInventoryOverviewFn, adminAdjustStockFn } from "@/lib/admin-ops.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/inventory")({ component: AdminInventory });

function AdminInventory() {
  const qc = useQueryClient();
  const [adj, setAdj] = useState<{ productId: string; name: string } | null>(null);
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const { data } = useQuery({ queryKey: ["admin-inventory"], queryFn: () => adminInventoryOverviewFn() });
  const products = (data?.products ?? []) as any[];
  const movements = (data?.movements ?? []) as any[];
  const low = products.filter((p) => p.stock <= (p.low_stock_threshold ?? 5));

  const save = useMutation({
    mutationFn: () => adminAdjustStockFn({ data: { product_id: adj!.productId, change, reason, note: note || undefined } }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success(`New stock: ${r.newStock}`); setAdj(null); setChange(0); setReason(""); setNote(""); qc.invalidateQueries({ queryKey: ["admin-inventory"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Inventory</h1>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock ({products.length})</TabsTrigger>
          <TabsTrigger value="low">Low stock ({low.length})</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <StockTable rows={products} onAdjust={(p) => setAdj({ productId: p.id, name: p.name })} />
        </TabsContent>
        <TabsContent value="low" className="mt-4">
          <StockTable rows={low} onAdjust={(p) => setAdj({ productId: p.id, name: p.name })} />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <div className="rounded-md border border-border bg-card divide-y divide-border">
            {movements.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No movements yet.</p> :
              movements.map((m) => (
                <div key={m.id} className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 text-sm">
                  <span className={m.change > 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                    {m.change > 0 ? "+" : ""}{m.change}
                  </span>
                  <div>
                    <p>{m.reason}</p>
                    <p className="text-xs text-muted-foreground">{m.note ?? ""} · {new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{m.product_id?.slice(0, 8)}</span>
                </div>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!adj} onOpenChange={(v) => !v && setAdj(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust stock — {adj?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Change (+ or −)</Label><Input type="number" value={change} onChange={(e) => setChange(+e.target.value)} /></div>
            <div><Label>Reason *</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="restock / damage / manual" /></div>
            <div><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!change || !reason || save.isPending}>Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockTable({ rows, onAdjust }: { rows: any[]; onAdjust: (p: any) => void }) {
  return (
    <div className="rounded-md border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr><th className="p-2 text-left">Product</th><th className="p-2 text-left">SKU</th><th className="p-2 text-right">Stock</th><th className="p-2 text-right">Reserved</th><th className="p-2 text-right">Threshold</th><th className="p-2"></th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products.</td></tr> :
            rows.map((p) => (
              <tr key={p.id}>
                <td className="p-2">{p.name} {p.status !== "active" && <Badge variant="secondary" className="ml-1">{p.status}</Badge>}</td>
                <td className="p-2 font-mono text-xs">{p.sku ?? "—"}</td>
                <td className="p-2 text-right"><span className={p.stock <= (p.low_stock_threshold ?? 5) ? "text-destructive font-bold" : ""}>{p.stock}</span></td>
                <td className="p-2 text-right">{p.reserved_stock ?? 0}</td>
                <td className="p-2 text-right text-muted-foreground">{p.low_stock_threshold ?? 5}</td>
                <td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => onAdjust(p)}>Adjust</Button></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}
