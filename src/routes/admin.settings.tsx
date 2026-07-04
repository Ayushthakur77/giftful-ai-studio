import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAiSettingsFn,
  updateAiSettingsFn,
  listAiLogsFn,
} from "@/lib/ai.functions";

type Settings = Awaited<ReturnType<typeof getAiSettingsFn>>;
type Logs = Awaited<ReturnType<typeof listAiLogsFn>>;

const FEATURES: { key: keyof Settings["enabled"]; label: string; help: string }[] = [
  { key: "assistant", label: "AI Gift Assistant", help: "Natural-language recommendations at /ai-finder" },
  { key: "builder",   label: "AI Gift Box Builder", help: "Auto-builds custom boxes on /gift-box" },
  { key: "greeting",  label: "AI Greeting Writer", help: "Generates messages inside the wizard & product pages" },
  { key: "search",    label: "AI Natural-Language Search", help: "Ranked results on /search" },
  { key: "homepage",  label: "AI Homepage Personalization", help: "Festival, trending, and 'for you' rails" },
];

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [logs, setLogs] = useState<Logs>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [s, l] = await Promise.all([getAiSettingsFn(), listAiLogsFn()]);
      setSettings(s);
      setLogs(l);
    } catch {
      toast.error("Could not load admin settings.");
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const next = await updateAiSettingsFn({
        data: {
          enabled: settings.enabled,
          prompts: settings.prompts,
          featuredFestivals: settings.featuredFestivals,
        } as never,
      });
      setSettings(next);
      toast.success("AI settings saved.");
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="container-page py-10 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto size-6 animate-spin" />
        Loading admin settings…
      </div>
    );
  }

  return (
    <div className="container-page py-6 md:py-10">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-bold md:text-3xl">Admin settings</h1>
      </div>

      <Tabs defaultValue="ai" className="mt-6">
        <TabsList>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="logs">AI logs</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Feature toggles</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {FEATURES.map((f) => (
                <div key={f.key} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-none last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.help}</p>
                  </div>
                  <Switch
                    checked={settings.enabled[f.key]}
                    onCheckedChange={(v) =>
                      setSettings((s) => s && ({ ...s, enabled: { ...s.enabled, [f.key]: v } }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">System prompts</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {FEATURES.map((f) => (
                <div key={f.key}>
                  <Label className="text-xs font-semibold uppercase tracking-wide">{f.label}</Label>
                  <Textarea
                    rows={3}
                    value={settings.prompts[f.key]}
                    onChange={(e) =>
                      setSettings((s) => s && ({ ...s, prompts: { ...s.prompts, [f.key]: e.target.value } }))
                    }
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save AI settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent AI requests ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No AI requests yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-2">Time</th>
                        <th className="py-2 pr-2">Feature</th>
                        <th className="py-2 pr-2">Model</th>
                        <th className="py-2 pr-2">Latency</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2 pr-2">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l, i) => (
                        <tr key={i} className="border-b border-border last:border-none">
                          <td className="py-1.5 pr-2 tabular-nums">{new Date(l.ts).toLocaleTimeString()}</td>
                          <td className="py-1.5 pr-2 font-medium">{l.feature}</td>
                          <td className="py-1.5 pr-2 font-mono text-[11px]">{l.model}</td>
                          <td className="py-1.5 pr-2 tabular-nums">{l.latencyMs}ms</td>
                          <td className="py-1.5 pr-2">
                            {l.ok ? (
                              <span className="text-success">OK</span>
                            ) : (
                              <span className="text-destructive">{l.error ?? "err"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 text-muted-foreground">{l.userId ? l.userId.slice(0, 8) : "guest"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
