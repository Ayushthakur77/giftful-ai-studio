import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListEmptyBoxesFn, adminUpsertEmptyBoxFn, adminDeleteEmptyBoxFn } from "@/lib/admin-boxes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/empty-boxes")({ component: AdminEmptyBoxes });

type F = {
  id?: string; name: string; description: string; material: string; color: string;
  images: string[]; capacity_items: number | null; max_weight_grams: number | null;
  base_price_paise: number; stock: number;
  status: "active" | "disabled" | "archived"; visible: boolean;
  ribbon_compatible: boolean; filler_compatible: boolean; card_compatible: boolean;
};
const empty: F = {
  name: "", description: "", material: "", color: "", images: [],
  capacity_items: null, max_weight_grams: null, base_price_paise: 0, stock: 0,
  status: "active", visible: true, ribbon_compatible: true, filler_compatible: true, card_compatible: true,
};

function AdminEmptyBoxes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [imgInput, setImgInput] = useState("");

  const { data: boxes = [] } = useQuery({ queryKey: ["admin-empty-boxes"], queryFn: () => adminListEmptyBoxesFn() });
  const save = useMutation({
    mutationFn: () => adminUpsertEmptyBoxFn({ data: { ...form } as never }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-empty-boxes"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteEmptyBoxFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-empty-boxes"] }); },
  });
  function edit(b: any) {
    setForm({
      id: b.id, name: b.name, description: b.description ?? "", material: b.material ?? "", color: b.color ?? "",
      images: Array.isArray(b.images) ? b.images : [], capacity_items: b.capacity_items, max_weight_grams: b.max_weight_grams,
      base_price_paise: b.base_price_paise, stock: b.stock, status: b.status, visible: b.visible,
      ribbon_compatible: b.ribbon_compatible, filler_compatible: b.filler_compatible, card_compatible: b.card_compatible,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Empty gift boxes ({boxes.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New empty box</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} empty box</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
                <div><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                <div><Label>Capacity items</Label><Input type="number" value={form.capacity_items ?? ""} onChange={(e) => setForm({ ...form, capacity_items: e.target.value ? +e.target.value : null })} /></div>
                <div><Label>Max weight (g)</Label><Input type="number" value={form.max_weight_grams ?? ""} onChange={(e) => setForm({ ...form, max_weight_grams: e.target.value ? +e.target.value : null })} /></div>
                <div><Label>Base price (paise)</Label><Input type="number" value={form.base_price_paise} onChange={(e) => setForm({ ...form, base_price_paise: +e.target.value })} /></div>
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
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.ribbon_compatible} onCheckedChange={(v) => setForm({ ...form, ribbon_compatible: v })} /> Ribbon</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.filler_compatible} onCheckedChange={(v) => setForm({ ...form, filler_compatible: v })} /> Filler</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.card_compatible} onCheckedChange={(v) => setForm({ ...form, card_compatible: v })} /> Card</label>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible</label>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {boxes.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No empty boxes yet.</p> :
          boxes.map((b: any) => (
            <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{b.name}</span>
                  <Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge>
                  {!b.visible && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{b.material ?? "—"} · {b.color ?? "—"} · stock {b.stock}</p>
              </div>
              <span className="text-sm tabular-nums">{formatINR(b.base_price_paise)}</span>
              <Button variant="ghost" size="icon" onClick={() => edit(b)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(b.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
