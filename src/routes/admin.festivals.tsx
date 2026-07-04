import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListFestivalsFn, adminUpsertFestivalFn, adminDeleteFestivalFn } from "@/lib/admin-boxes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/festivals")({ component: AdminFestivals });

type F = { id?: string; name: string; description: string; banner_url: string; theme_color: string; start_date: string; end_date: string; priority: number; active: boolean };
const empty: F = { name: "", description: "", banner_url: "", theme_color: "", start_date: "", end_date: "", priority: 0, active: true };

function AdminFestivals() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const { data: fests = [] } = useQuery({ queryKey: ["admin-festivals"], queryFn: () => adminListFestivalsFn() });
  const save = useMutation({
    mutationFn: () => adminUpsertFestivalFn({ data: { ...form, description: form.description || null, banner_url: form.banner_url || null, theme_color: form.theme_color || null, start_date: form.start_date || null, end_date: form.end_date || null } as never }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-festivals"] }); },
  });
  const del = useMutation({ mutationFn: (id: string) => adminDeleteFestivalFn({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-festivals"] }); } });
  function edit(f: any) { setForm({ id: f.id, name: f.name, description: f.description ?? "", banner_url: f.banner_url ?? "", theme_color: f.theme_color ?? "", start_date: f.start_date ?? "", end_date: f.end_date ?? "", priority: f.priority, active: f.active }); setOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Festivals ({fests.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New festival</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} festival</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Theme color</Label><Input value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} placeholder="#ff6b6b" /></div>
                <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: +e.target.value })} /></div>
                <div><Label>Start</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>End</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active</label>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {fests.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No festivals yet.</p> :
          fests.map((f: any) => (
            <div key={f.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center p-3">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{f.name}</span>{!f.active && <Badge variant="secondary">Inactive</Badge>}<Badge variant="outline">P{f.priority}</Badge></div>
                <p className="text-xs text-muted-foreground">{f.start_date ?? "—"} → {f.end_date ?? "—"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(f)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(f.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
