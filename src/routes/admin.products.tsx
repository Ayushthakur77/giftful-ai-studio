import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Filter } from "lucide-react";
import {
  adminListProductsFn, adminUpsertProductFn, adminDeleteProductFn,
  adminDuplicateProductFn, adminBulkUpdateProductStatusFn, adminBulkDeleteProductsFn,
  adminListCategoriesFn,
} from "@/lib/admin-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Form = {
  id?: string;
  slug?: string; name: string; description: string;
  category_id: string | null; sku: string;
  price_paise: number; offer_price_paise: number | null;
  stock: number; low_stock_threshold: number;
  images: string[]; tags: string[]; festival_tags: string[];
  is_featured: boolean; is_trending: boolean; is_new_arrival: boolean; is_best_seller: boolean;
  gift_builder_compatible: boolean;
  status: "active" | "disabled" | "archived" | "draft";
  seo_title: string; seo_description: string;
};

const emptyForm: Form = {
  name: "", description: "", category_id: null, sku: "",
  price_paise: 0, offer_price_paise: null, stock: 0, low_stock_threshold: 5,
  images: [], tags: [], festival_tags: [],
  is_featured: false, is_trending: false, is_new_arrival: false, is_best_seller: false,
  gift_builder_compatible: true, status: "active",
  seo_title: "", seo_description: "",
};

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products", q, status],
    queryFn: () => adminListProductsFn({ data: { q: q || undefined, status } }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: () => adminListCategoriesFn(),
  });

  const save = useMutation({
    mutationFn: () => adminUpsertProductFn({ data: {
      ...form,
      description: form.description || null,
      sku: form.sku || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    } as never }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Saved"); setOpen(false); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteProductFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });

  const dup = useMutation({
    mutationFn: (id: string) => adminDuplicateProductFn({ data: { id } }),
    onSuccess: () => { toast.success("Duplicated"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });

  const bulkStatus = useMutation({
    mutationFn: (s: Form["status"]) => adminBulkUpdateProductStatusFn({ data: { ids: [...selected], status: s } }),
    onSuccess: (r) => { if (r.ok) { toast.success(`${r.count} updated`); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin-products"] }); } },
  });
  const bulkDel = useMutation({
    mutationFn: () => adminBulkDeleteProductsFn({ data: { ids: [...selected] } }),
    onSuccess: (r) => { if (r.ok) { toast.success(`${r.count} deleted`); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin-products"] }); } },
  });

  function edit(p: any) {
    setForm({
      id: p.id, slug: p.slug, name: p.name, description: p.description ?? "",
      category_id: p.category_id, sku: p.sku ?? "",
      price_paise: p.price_paise, offer_price_paise: p.offer_price_paise,
      stock: p.stock, low_stock_threshold: p.low_stock_threshold ?? 5,
      images: Array.isArray(p.images) ? p.images : [], tags: p.tags ?? [], festival_tags: p.festival_tags ?? [],
      is_featured: !!p.is_featured, is_trending: !!p.is_trending,
      is_new_arrival: !!p.is_new_arrival, is_best_seller: !!p.is_best_seller,
      gift_builder_compatible: p.gift_builder_compatible !== false,
      status: p.status ?? "active",
      seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Products ({products.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 size-4" /> New product</Button>
          </DialogTrigger>
          <ProductDialog form={form} setForm={setForm} categories={categories as any} onSave={() => save.mutate()} saving={save.isPending} />
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="pl-8" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <>
            <Badge variant="secondary">{selected.size} selected</Badge>
            <Button size="sm" variant="outline" onClick={() => bulkStatus.mutate("active")}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkStatus.mutate("disabled")}>Disable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkStatus.mutate("archived")}>Archive</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkDel.mutate()}>Delete</Button>
          </>
        )}
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 w-8"><Checkbox
                checked={selected.size === products.length && products.length > 0}
                onCheckedChange={(v) => setSelected(v ? new Set(products.map((p: any) => p.id)) : new Set())} /></th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Stock</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Flags</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No products.</td></tr>
            ) : products.map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="p-2"><Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => {
                  const s = new Set(selected); if (v) s.add(p.id); else s.delete(p.id); setSelected(s);
                }} /></td>
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2 font-mono text-xs">{p.sku ?? "—"}</td>
                <td className="p-2 text-right">{formatINR(p.offer_price_paise ?? p.price_paise)}</td>
                <td className="p-2 text-right"><span className={p.stock <= 5 ? "text-destructive" : ""}>{p.stock}</span></td>
                <td className="p-2"><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></td>
                <td className="p-2 space-x-1">
                  {p.is_featured && <Badge variant="outline" className="text-xs">F</Badge>}
                  {p.is_trending && <Badge variant="outline" className="text-xs">T</Badge>}
                </td>
                <td className="p-2 space-x-1 whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => edit(p)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => dup.mutate(p.id)}><Copy className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDialog({ form, setForm, categories, onSave, saving }: {
  form: Form; setForm: (f: Form) => void; categories: any[]; onSave: () => void; saving: boolean;
}) {
  const [imgInput, setImgInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{form.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label>
            <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— none —</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Price (₹) *</Label><Input type="number" step="0.01" min="0" value={form.price_paise ? form.price_paise / 100 : ""} onChange={(e) => setForm({ ...form, price_paise: Math.round(parseFloat(e.target.value || "0") * 100) })} /></div>
          <div><Label>Offer price (₹)</Label><Input type="number" step="0.01" min="0" value={form.offer_price_paise != null ? form.offer_price_paise / 100 : ""} onChange={(e) => setForm({ ...form, offer_price_paise: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} /></div>
          <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
        </div>
        <div><Label>Image URLs</Label>
          <div className="flex gap-2">
            <Input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://..." />
            <Button type="button" variant="outline" onClick={() => { if (imgInput) { setForm({ ...form, images: [...form.images, imgInput] }); setImgInput(""); } }}>Add</Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {form.images.map((u, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}>
                {u.slice(-30)} ×
              </Badge>
            ))}
          </div>
        </div>
        <div><Label>Tags</Label>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => { if (tagInput) { setForm({ ...form, tags: [...form.tags, tagInput] }); setTagInput(""); } }}>Add</Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {form.tags.map((t, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}>{t} ×</Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_trending} onCheckedChange={(v) => setForm({ ...form, is_trending: v })} /> Trending</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_new_arrival} onCheckedChange={(v) => setForm({ ...form, is_new_arrival: v })} /> New arrival</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_best_seller} onCheckedChange={(v) => setForm({ ...form, is_best_seller: v })} /> Best seller</label>
          <label className="flex items-center gap-2 text-sm col-span-2"><Switch checked={form.gift_builder_compatible} onCheckedChange={(v) => setForm({ ...form, gift_builder_compatible: v })} /> Gift builder compatible</label>
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
        <div><Label>SEO title</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
        <div><Label>SEO description</Label><Textarea rows={2} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={saving || !form.name}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}
