import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { aiBuildBoxFn } from "@/lib/ai.functions";

export type AiBuildDraft = {
  emptyBoxSlug: string;
  items: { productSlug: string; quantity: number }[];
  ribbonSlug?: string;
  fillerSlug?: string;
  cardSlug?: string;
  giftNote: string;
  notes: string[];
};

export function AiGiftBuilderPanel({
  defaultQuery,
  defaultBudget,
  onApply,
}: {
  defaultQuery?: string;
  defaultBudget?: string;
  onApply: (draft: AiBuildDraft) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultQuery));
  const [occasion, setOccasion] = useState("");
  const [relationship, setRelationship] = useState("");
  const [budget, setBudget] = useState(defaultBudget ?? "");
  const [preferences, setPreferences] = useState(defaultQuery ?? "");
  const [loading, setLoading] = useState(false);

  async function build() {
    setLoading(true);
    try {
      const budgetPaise = budget ? Math.max(0, Math.floor(Number(budget) * 100)) : undefined;
      const res = await aiBuildBoxFn({
        data: {
          occasion: occasion || undefined,
          relationship: relationship || undefined,
          budgetPaise: Number.isFinite(budgetPaise) ? budgetPaise : undefined,
          preferences: preferences || undefined,
        },
      });
      if (!res.ok) { toast.error(res.error); return; }
      onApply(res.draft);
      res.draft.notes.forEach((n) => toast.info(n));
      toast.success("AI built your gift box — edit anything before adding to cart.");
    } catch {
      toast.error("AI is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Let AI build this box for you</h3>
            <p className="text-xs text-muted-foreground">You can edit every item afterwards.</p>
          </div>
        </div>
        <Button size="sm" variant={open ? "ghost" : "outline"} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Try AI Builder"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Occasion</Label>
            <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Birthday, Anniversary…" />
          </div>
          <div>
            <Label className="text-xs">Relationship</Label>
            <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Wife, Colleague…" />
          </div>
          <div>
            <Label className="text-xs">Budget (₹)</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Preferences (tastes, allergies, style)</Label>
            <Textarea rows={2} value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="Loves chocolate, no nuts, minimalist aesthetic…" />
          </div>
          <div className="md:col-span-2">
            <Button onClick={build} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {loading ? "Building…" : "Build my box"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
