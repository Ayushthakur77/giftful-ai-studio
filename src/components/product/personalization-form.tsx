import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, type Product } from "@/lib/catalog";

export type PersonalizationValues = Record<string, string>;

export function PersonalizationForm({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: PersonalizationValues;
  onChange: (v: PersonalizationValues) => void;
}) {
  const fields = product.personalization ?? [];
  if (fields.length === 0) return null;

  function update(key: string, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid gap-3">
      {fields.map((f) => {
        const current = value[f.key] ?? "";
        const extraLabel = f.extraPaise > 0 ? ` (+${formatINR(f.extraPaise)})` : "";
        if (f.key === "name") {
          return (
            <div key={f.key}>
              <Label htmlFor={`pf-${f.key}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}{extraLabel}
              </Label>
              <Input id={`pf-${f.key}`} maxLength={f.maxLength} value={current}
                onChange={(e) => update(f.key, e.target.value)} placeholder="e.g. Ananya" className="mt-1 h-10" />
              <p className="mt-1 text-[11px] text-muted-foreground">{current.length}/{f.maxLength}</p>
            </div>
          );
        }
        if (f.key === "message") {
          return (
            <div key={f.key}>
              <Label htmlFor={`pf-${f.key}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}{extraLabel}
              </Label>
              <Textarea id={`pf-${f.key}`} maxLength={f.maxLength} value={current}
                onChange={(e) => update(f.key, e.target.value)} placeholder="A few words from the heart..." className="mt-1" rows={3} />
              <p className="mt-1 text-[11px] text-muted-foreground">{current.length}/{f.maxLength}</p>
            </div>
          );
        }
        if (f.key === "font" || f.key === "color") {
          return (
            <div key={f.key}>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}{extraLabel}
              </Label>
              <Select value={current} onValueChange={(v) => update(f.key, v)}>
                <SelectTrigger className="mt-1 h-10"><SelectValue placeholder={`Select ${f.label.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (f.key === "image") {
          return (
            <div key={f.key}>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}{extraLabel}
              </Label>
              <Input type="file" accept="image/*" className="mt-1 h-10" disabled />
              <p className="mt-1 text-[11px] text-muted-foreground">Uploads enabled in Phase 6.</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
