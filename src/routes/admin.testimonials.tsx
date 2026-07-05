import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  adminListTestimonialsFn,
  adminUpsertTestimonialFn,
  adminDeleteTestimonialFn,
} from "@/lib/admin-testimonials.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/testimonials")({ component: AdminTestimonials });

type F = {
  id?: string;
  author_name: string;
  author_city: string;
  avatar_url: string;
  rating: number;
  quote: string;
  sort_order: number;
  visible: boolean;
};

const empty: F = {
  author_name: "",
  author_city: "",
  avatar_url: "",
  rating: 5,
  quote: "",
  sort_order: 0,
  visible: true,
};

function AdminTestimonials() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => adminListTestimonialsFn(),
  });

  const save = useMutation({
    mutationFn: () =>
      adminUpsertTestimonialFn({
        data: {
          ...form,
          author_city: form.author_city || null,
          avatar_url: form.avatar_url || null,
        } as never,
      }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Saved");
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteTestimonialFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  function edit(t: any) {
    setForm({
      id: t.id,
      author_name: t.author_name,
      author_city: t.author_city ?? "",
      avatar_url: t.avatar_url ?? "",
      rating: t.rating,
      quote: t.quote,
      sort_order: t.sort_order,
      visible: t.visible,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Testimonials ({rows.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-1.5" /> New testimonial</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit" : "New"} testimonial</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Author name</Label>
                  <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.author_city} onChange={(e) => setForm({ ...form, author_city: e.target.value })} placeholder="Mumbai" />
                </div>
              </div>
              <div>
                <Label>Avatar URL</Label>
                <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rating (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Math.max(1, Math.min(5, +e.target.value)) })} />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Quote</Label>
                <Textarea rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible on homepage
              </label>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !form.author_name || !form.quote}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No testimonials yet. Add customer quotes to show on the homepage.</p>
        ) : (
          rows.map((t: any) => (
            <div key={t.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center p-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                {t.avatar_url ? <img src={t.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t.author_name}</span>
                  {t.author_city && <span className="text-xs text-muted-foreground">· {t.author_city}</span>}
                  <span className="text-xs text-[color:var(--rating)]">{"★".repeat(t.rating)}</span>
                  {!t.visible && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{t.quote}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => edit(t)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(t.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
