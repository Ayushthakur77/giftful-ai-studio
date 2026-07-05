import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  adminListHomepageFn,
  adminUpsertSectionFn,
  adminDeleteSectionFn,
  adminReorderSectionsFn,
} from "@/lib/admin-boxes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/homepage-builder")({ component: AdminHomepage });

const KINDS = [
  "hero", "hero_slider", "slider",
  "usp_strip", "banner_strip", "promo_card",
  "occasion_grid", "category_grid", "recipient_grid", "relationship_grid",
  "featured", "trending", "best_sellers", "new_arrivals", "product_showcase",
  "giftbox_grid", "festival", "countdown_offer",
  "image_cards", "testimonials", "ai_recommendations",
] as const;
type Kind = typeof KINDS[number];

const KIND_LABEL: Record<Kind, string> = {
  hero: "Hero (single)",
  hero_slider: "Hero (slider)",
  slider: "Slider (alias of hero_slider)",
  usp_strip: "USP strip (icons row)",
  banner_strip: "Banner strip (CTA)",
  promo_card: "Promo card",
  occasion_grid: "Occasion grid",
  category_grid: "Category grid",
  recipient_grid: "Recipient grid",
  relationship_grid: "Relationship grid",
  featured: "Product rail — Featured",
  trending: "Product rail — Trending",
  best_sellers: "Product rail — Best sellers",
  new_arrivals: "Product rail — New arrivals",
  product_showcase: "Product rail — Custom (productSlugs)",
  giftbox_grid: "Ready-made gift box grid",
  festival: "Active festival banner",
  countdown_offer: "Countdown offer banner",
  image_cards: "Image cards row",
  testimonials: "Customer testimonials",
  ai_recommendations: "AI recommendations rails",
};

const CONFIG_TEMPLATE: Record<Kind, string> = {
  hero: JSON.stringify({ slides: [{ eyebrow: "Thoughtful gifting", title: "Send joy across India", subtitle: "Personalized gifts, hampers, flowers & cakes", image: "https://…", ctaLabel: "Shop personalized", ctaHref: "/c/personalized", secondaryCtaLabel: "Build a gift box", secondaryCtaHref: "/gift-box" }] }, null, 2),
  hero_slider: JSON.stringify({ slides: [{ eyebrow: "New collection", title: "Slide 1 title", image: "https://…", ctaLabel: "Shop", ctaHref: "/search" }, { title: "Slide 2 title", image: "https://…", ctaLabel: "Explore", ctaHref: "/gift-boxes" }] }, null, 2),
  slider: JSON.stringify({ slides: [] }, null, 2),
  usp_strip: JSON.stringify({ items: [{ icon: "truck", title: "Free delivery over ₹50", subtitle: "Flat ₹70 below" }, { icon: "clock", title: "Same-day delivery" }, { icon: "shield", title: "Secure payments" }, { icon: "sparkles", title: "AI Gift Finder" }] }, null, 2),
  banner_strip: JSON.stringify({ image: "https://…", ctaLabel: "Shop the sale", ctaHref: "/search" }, null, 2),
  promo_card: JSON.stringify({ image: "https://…", ctaLabel: "Explore", ctaHref: "/gift-boxes" }, null, 2),
  occasion_grid: JSON.stringify({ occasions: [{ slug: "birthday", name: "Birthday", emoji: "🎂" }, { slug: "anniversary", name: "Anniversary", emoji: "💍" }] }, null, 2),
  category_grid: JSON.stringify({ limit: 12 }, null, 2),
  recipient_grid: JSON.stringify({ limit: 12 }, null, 2),
  relationship_grid: JSON.stringify({ limit: 12 }, null, 2),
  featured: JSON.stringify({ limit: 10 }, null, 2),
  trending: JSON.stringify({ limit: 10 }, null, 2),
  best_sellers: JSON.stringify({ limit: 10 }, null, 2),
  new_arrivals: JSON.stringify({ limit: 10 }, null, 2),
  product_showcase: JSON.stringify({ productSlugs: ["your-product-slug"], limit: 10 }, null, 2),
  giftbox_grid: JSON.stringify({ limit: 8 }, null, 2),
  festival: JSON.stringify({}, null, 2),
  countdown_offer: JSON.stringify({ endsAt: "2026-12-31T23:59:59Z", code: "SALE20", ctaLabel: "Shop now", ctaHref: "/search" }, null, 2),
  image_cards: JSON.stringify({ cards: [{ title: "For Him", subtitle: "Gadgets & essentials", image: "https://…", href: "/r/him", ctaLabel: "Shop" }, { title: "For Her", subtitle: "Curated favourites", image: "https://…", href: "/r/her" }] }, null, 2),
  testimonials: JSON.stringify({ limit: 6 }, null, 2),
  ai_recommendations: JSON.stringify({}, null, 2),
};

type F = { id?: string; kind: Kind; title: string; subtitle: string; config: string; sort_order: number; visible: boolean; starts_at: string; ends_at: string };
const empty: F = { kind: "hero", title: "", subtitle: "", config: CONFIG_TEMPLATE.hero, sort_order: 0, visible: true, starts_at: "", ends_at: "" };

function AdminHomepage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const { data: sections = [] } = useQuery({ queryKey: ["admin-homepage"], queryFn: () => adminListHomepageFn() });

  const save = useMutation({
    mutationFn: () => {
      let cfg: Record<string, unknown> = {};
      try { cfg = JSON.parse(form.config || "{}"); } catch { throw new Error("Config must be valid JSON"); }
      return adminUpsertSectionFn({ data: {
        ...form,
        config: cfg,
        title: form.title || null,
        subtitle: form.subtitle || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      } as never });
    },
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-homepage"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => adminDeleteSectionFn({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-homepage"] }); } });
  const reorder = useMutation({
    mutationFn: (order: { id: string; sort_order: number }[]) => adminReorderSectionsFn({ data: { order } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-homepage"] }),
  });

  function edit(s: any) {
    setForm({
      id: s.id,
      kind: s.kind,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      config: JSON.stringify(s.config ?? {}, null, 2),
      sort_order: s.sort_order,
      visible: s.visible,
      starts_at: s.starts_at ? s.starts_at.slice(0, 16) : "",
      ends_at: s.ends_at ? s.ends_at.slice(0, 16) : "",
    });
    setOpen(true);
  }
  function move(idx: number, dir: -1 | 1) {
    const arr = [...(sections as any[])];
    const j = idx + dir; if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    reorder.mutate(arr.map((s, i) => ({ id: s.id, sort_order: i })));
  }
  function onKindChange(k: Kind) {
    // If the current config looks like the template for another kind or empty, replace it.
    const looksLikeTemplate = form.config.trim() === "{}" || Object.values(CONFIG_TEMPLATE).includes(form.config);
    setForm({ ...form, kind: k, config: looksLikeTemplate ? CONFIG_TEMPLATE[k] : form.config });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Homepage builder ({sections.length})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New section</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} section</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Kind</Label>
                <Select value={form.kind} onValueChange={(v: Kind) => onKindChange(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Optional heading" /></div>
                <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Optional sub-heading" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Starts at</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>Ends at</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Config (JSON)</Label>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForm({ ...form, config: CONFIG_TEMPLATE[form.kind] })}>Load template</button>
                </div>
                <Textarea rows={10} className="font-mono text-xs" value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">Tip: click "Load template" to reset config to the recommended shape for this kind.</p>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} /> Visible on homepage</label>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {sections.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No sections yet. Add hero, USP strip, category grid, product rails, testimonials…</p> :
          sections.map((s: any, i: number) => (
            <div key={s.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center p-3">
              <span className="text-xs text-muted-foreground font-mono w-8 text-center">#{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{s.kind}</Badge>
                  <span className="font-medium">{s.title ?? "—"}</span>
                  {!s.visible && <Badge variant="secondary">Hidden</Badge>}
                  {s.starts_at && <Badge variant="outline" className="text-xs">from {new Date(s.starts_at).toLocaleDateString()}</Badge>}
                  {s.ends_at && <Badge variant="outline" className="text-xs">until {new Date(s.ends_at).toLocaleDateString()}</Badge>}
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
