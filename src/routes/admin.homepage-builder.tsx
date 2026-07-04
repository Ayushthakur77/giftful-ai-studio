import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { adminListHomepageFn, adminUpsertSectionFn, adminDeleteSectionFn, adminReorderSectionsFn } from "@/lib/admin-boxes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/homepage-builder")({ component: AdminHomepage });

const KINDS = ["hero", "slider", "featured", "trending", "best_sellers", "new_arrivals", "festival", "ai_recommendations", "promo_card", "category_grid", "giftbox_grid"] as const;
type Kind = typeof KINDS[number];

type F = { id?: string; kind: Kind; title: string; subtitle: string; config: string; sort_order: number; visible: boolean };
const empty: F = { kind: "hero", title: "", subtitle: "", config: "{}", sort_order: 0, visible: true };

function AdminHomepage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const { data: sections = [] } = useQuery({ queryKey: ["admin-homepage"], queryFn: () => adminListHomepageFn() });

  const save = useMutation({
    mutationFn: () => {
      let cfg: Record<string, unknown> = {};
      try { cfg = JSON.parse(form.config || "{}"); } catch { throw new Error("Config must be valid JSON"); }
      return adminUpsertSectionFn({ data: { ...form, config: cfg, title: form.title || null, subtitle: form.subtitle || null } as never });
    },
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-homepage"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => adminDeleteSectionFn({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-homepage"] }); } });
  const reorder = useMutation({
    mutationFn: (order: { id: string; sort_order: number }[]) => adminReorderSectionsFn({ data: { order } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-homepage"] }),
  });

  function edit(s: any) { setForm({ id: s.id, kind: s.kind, title: s.title ?? "", subtitle: s.subtitle ?? "", config: JSON.stringify(s.config ?? {}, null, 2), sort_order: s.sort_order, visible: s.visible }); setOpen(true); }
  function move(idx: number, dir: -1 | 1) {
    const arr = [...(sections as any[])];
    const j = idx + dir; if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    reorder.mutate(arr.map((s, i) => ({ id: s.id, sort_order: i })));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Homepage builder ({sections.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New section</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} section</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Kind</Label>
                <Select value={form.kind} onValueChange={(v: Kind) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div><Label>Config (JSON)</Label><Textarea rows={4} className="font-mono text-xs" value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></div>
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible</label>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {sections.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No sections yet. Add hero/featured/trending etc.</p> :
          sections.map((s: any, i: number) => (
            <div key={s.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center p-3">
              <span className="text-xs text-muted-foreground font-mono w-8 text-center">#{i + 1}</span>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.kind}</Badge>
                  <span className="font-medium">{s.title ?? "—"}</span>
                  {!s.visible && <Badge variant="secondary">Hidden</Badge>}
                </div>
                {s.subtitle && <p className="text-xs text-muted-foreground">{s.subtitle}</p>}
              </div>
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6" onClick={() => move(i, -1)}><ArrowUp className="size-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6" onClick={() => move(i, 1)}><ArrowDown className="size-3" /></Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(s)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
