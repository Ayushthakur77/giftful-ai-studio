import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListRecipientsFn, adminUpsertRecipientFn, adminDeleteRecipientFn, type TaxonomyItem } from "@/lib/taxonomy.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/recipients")({ component: AdminRecipients });

type F = {
  id?: string; slug: string; name: string; tagline: string;
  image_url: string; sort_order: number; visible: boolean;
  seo_title: string; seo_description: string;
};
const empty: F = { slug: "", name: "", tagline: "", image_url: "", sort_order: 0, visible: true, seo_title: "", seo_description: "" };

function AdminRecipients() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const { data: items = [] } = useQuery({ queryKey: ["admin-recipients"], queryFn: () => adminListRecipientsFn() });

  const save = useMutation({
    mutationFn: () => adminUpsertRecipientFn({ data: {
      ...form,
      slug: form.slug || undefined,
      tagline: form.tagline || null,
      image_url: form.image_url || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    } }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-recipients"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteRecipientFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-recipients"] }); },
  });

  function edit(c: TaxonomyItem) {
    setForm({
      id: c.id, slug: c.slug, name: c.name, tagline: c.tagline ?? "",
      image_url: c.image_url ?? "", sort_order: c.sort_order, visible: c.visible,
      seo_title: c.seo_title ?? "", seo_description: c.seo_description ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Recipients ({items.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New recipient</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} recipient</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug (auto if empty)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="for-him" /></div>
              <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible</label>
              <div><Label>SEO title</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
              <div><Label>SEO description</Label><Textarea rows={2} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {items.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No recipients yet.</p> :
          items.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-2 p-3 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {!c.visible && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">/r/{c.slug} · order {c.sort_order}</p>
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
