import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiGreetingFn } from "@/lib/ai.functions";

type Tone = "heartfelt" | "funny" | "professional" | "romantic" | "formal" | "short" | "poetic";
type Language = "English" | "Hindi" | "Hinglish";

export function AiGreetingButton({
  onApply,
  defaultOccasion,
  maxChars = 200,
  size = "sm",
}: {
  onApply: (message: string) => void;
  defaultOccasion?: string;
  maxChars?: number;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState(defaultOccasion ?? "birthday");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<Tone>("heartfelt");
  const [language, setLanguage] = useState<Language>("English");
  const [draft, setDraft] = useState("");

  async function generate() {
    setLoading(true);
    setDraft("");
    try {
      const res = await aiGreetingFn({ data: { occasion, recipient: recipient || undefined, tone, language, maxChars } });
      if (!res.ok) { toast.error(res.error); return; }
      setDraft(res.message);
    } catch {
      toast.error("Could not generate a message right now.");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!draft.trim()) return;
    onApply(draft.trim());
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" size={size} onClick={() => setOpen(true)}>
        <Sparkles className="mr-1 size-3.5" /> Write with AI
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Greeting Writer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Occasion</Label>
                <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="Birthday" />
              </div>
              <div>
                <Label className="text-xs">Recipient</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Wife, Mom, Boss…" />
              </div>
              <div>
                <Label className="text-xs">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["heartfelt","funny","professional","romantic","formal","short","poetic"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Language</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Hinglish">Hinglish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Sparkles className="mr-1 size-4" />}
              {loading ? "Generating…" : "Generate"}
            </Button>

            {draft && (
              <textarea
                className="min-h-[120px] rounded-md border border-border bg-background p-3 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, maxChars))}
                maxLength={maxChars}
              />
            )}
            {draft && <p className="text-right text-xs text-muted-foreground">{draft.length}/{maxChars} · edit before applying</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={apply} disabled={!draft.trim()}>Use this message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
