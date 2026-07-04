import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListCategoriesFn, adminUpsertCategoryFn, adminDeleteCategoryFn } from "@/lib/admin-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

type F = {
  id?: string; parent_id: string | null; name: string; description: string;
  icon_url: string; banner_url: string;
  sort_order: number; visible: boolean; show_on_home: boolean;
  seo_title: string; seo_description: string;
};
const empty: F = { parent_id: null, name: "", description: "", icon_url: "", banner_url: "", sort_order: 0, visible: true, show_on_home: false, seo_title: "", seo_description: "" };

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);

  const { data: cats = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => adminListCategoriesFn() });

  const save = useMutation({
    mutationFn: () => adminUpsertCategoryFn({ data: {
      ...form,
      description: form.description || null,
      icon_url: form.icon_url || null,
      banner_url: form.banner_url || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    } as never }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-categories"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCategoryFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); },
  });

  function edit(c: any) {
    setForm({
      id: c.id, parent_id: c.parent_id, name: c.name, description: c.description ?? "",
      icon_url: c.icon_url ?? "", banner_url: c.banner_url ?? "",
      sort_order: c.sort_order, visible: c.visible, show_on_home: c.show_on_home,
      seo_title: c.seo_title ?? "", seo_description: c.seo_description ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Categories ({cats.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New category</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div><Label>Parent category</Label>
                <Select value={form.parent_id ?? "none"} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="— none —" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— none —</SelectItem>
                    {cats.filter((c: any) => c.id !== form.id).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Icon URL</Label><Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.show_on_home} onCheckedChange={(v) => setForm({ ...form, show_on_home: v })} /> Show on home</label>
              <div><Label>SEO title</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
              <div><Label>SEO description</Label><Textarea rows={2} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {cats.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No categories yet.</p> :
          cats.map((c: any) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-2 p-3 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {!c.visible && <Badge variant="secondary">Hidden</Badge>}
                  {c.show_on_home && <Badge>Home</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
