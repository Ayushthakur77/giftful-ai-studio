import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListReadyBoxesFn, adminUpsertReadyBoxFn, adminDeleteReadyBoxFn, adminListEmptyBoxesFn } from "@/lib/admin-boxes.functions";
import { adminListProductsFn } from "@/lib/admin-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/ready-boxes")({ component: AdminReadyBoxes });

type Item = { product_id: string; quantity: number };
type F = {
  id?: string; name: string; description: string;
  empty_box_id: string | null; items: Item[];
  ribbon: string; filler: string; card: string;
  price_paise: number; offer_price_paise: number | null;
  images: string[]; stock: number;
  is_featured: boolean; is_trending: boolean;
  status: "active" | "disabled" | "archived" | "draft";
};
const empty: F = {
  name: "", description: "", empty_box_id: null, items: [],
  ribbon: "", filler: "", card: "", price_paise: 0, offer_price_paise: null,
  images: [], stock: 0, is_featured: false, is_trending: false, status: "active",
};

function AdminReadyBoxes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [imgInput, setImgInput] = useState("");
  const [newItemPid, setNewItemPid] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);

  const { data: boxes = [] } = useQuery({ queryKey: ["admin-ready-boxes"], queryFn: () => adminListReadyBoxesFn() });
  const { data: emptyBoxes = [] } = useQuery({ queryKey: ["admin-empty-boxes-sel"], queryFn: () => adminListEmptyBoxesFn() });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products-sel"], queryFn: () => adminListProductsFn({ data: { limit: 500 } }) });

  const save = useMutation({
    mutationFn: () => adminUpsertReadyBoxFn({ data: { ...form } as never }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-ready-boxes"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteReadyBoxFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-ready-boxes"] }); },
  });

  function edit(b: any) {
    setForm({
      id: b.id, name: b.name, description: b.description ?? "",
      empty_box_id: b.empty_box_id, items: Array.isArray(b.items) ? b.items : [],
      ribbon: b.ribbon ?? "", filler: b.filler ?? "", card: b.card ?? "",
      price_paise: b.price_paise, offer_price_paise: b.offer_price_paise,
      images: Array.isArray(b.images) ? b.images : [], stock: b.stock,
      is_featured: b.is_featured, is_trending: b.is_trending, status: b.status,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Ready-made gift boxes ({boxes.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New ready box</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} ready box</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Base empty box</Label>
                <Select value={form.empty_box_id ?? "none"} onValueChange={(v) => setForm({ ...form, empty_box_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— none —</SelectItem>
                    {emptyBoxes.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Items</Label>
                <div className="flex gap-2">
                  <Select value={newItemPid} onValueChange={setNewItemPid}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} value={newItemQty} onChange={(e) => setNewItemQty(+e.target.value)} className="w-20" />
                  <Button variant="outline" onClick={() => { if (newItemPid) { setForm({ ...form, items: [...form.items, { product_id: newItemPid, quantity: newItemQty }] }); setNewItemPid(""); setNewItemQty(1); } }}>Add</Button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {form.items.map((it, i) => {
                    const p: any = products.find((pp: any) => pp.id === it.product_id);
                    return <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}>{p?.name ?? it.product_id.slice(0, 6)} × {it.quantity} ×</Badge>;
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Ribbon</Label><Input value={form.ribbon} onChange={(e) => setForm({ ...form, ribbon: e.target.value })} /></div>
                <div><Label>Filler</Label><Input value={form.filler} onChange={(e) => setForm({ ...form, filler: e.target.value })} /></div>
                <div><Label>Card</Label><Input value={form.card} onChange={(e) => setForm({ ...form, card: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Price (paise)</Label><Input type="number" value={form.price_paise} onChange={(e) => setForm({ ...form, price_paise: +e.target.value })} /></div>
                <div><Label>Offer price</Label><Input type="number" value={form.offer_price_paise ?? ""} onChange={(e) => setForm({ ...form, offer_price_paise: e.target.value ? +e.target.value : null })} /></div>
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
              </div>
              <div><Label>Image URLs</Label>
                <div className="flex gap-2">
                  <Input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://..." />
                  <Button variant="outline" onClick={() => { if (imgInput) { setForm({ ...form, images: [...form.images, imgInput] }); setImgInput(""); } }}>Add</Button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {form.images.map((u, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}>{u.slice(-25)} ×</Badge>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_trending} onCheckedChange={(v) => setForm({ ...form, is_trending: v })} /> Trending</label>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {boxes.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No ready-made boxes yet.</p> :
          boxes.map((b: any) => (
            <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{b.name}</span>
                  <Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{(b.items ?? []).length} items · stock {b.stock}</p>
              </div>
              <span className="text-sm tabular-nums">{formatINR(b.offer_price_paise ?? b.price_paise)}</span>
              <Button variant="ghost" size="icon" onClick={() => edit(b)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(b.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
