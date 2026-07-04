import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAiSettingsFn, updateAiSettingsFn, listAiLogsFn } from "@/lib/ai.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ai")({
  head: () => ({ meta: [{ title: "AI — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminAi,
});

function AdminAi() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getAiSettingsFn);
  const updateSetting = useServerFn(updateAiSettingsFn);
  const listLogs = useServerFn(listAiLogsFn);

  const { data: settings } = useQuery({ queryKey: ["ai-settings"], queryFn: () => getSettings() });
  const { data: logs } = useQuery({ queryKey: ["ai-logs"], queryFn: () => listLogs() });

  const upd = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => updateSetting({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-settings"] }); toast.success("Saved"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const s = (settings ?? {}) as Record<string, { enabled?: boolean; prompt?: string; budget?: number }>;
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  useEffect(() => {
    const p: Record<string, string> = {};
    for (const k of ["recommend", "build_box", "greeting", "search", "homepage"]) {
      p[k] = (s[k]?.prompt ?? "") as string;
    }
    setPrompts(p);
     
  }, [settings]);

  const features: { key: string; label: string }[] = [
    { key: "recommend", label: "Recommendations" },
    { key: "build_box", label: "Gift Box Builder" },
    { key: "greeting", label: "Greeting Generator" },
    { key: "search", label: "Smart Search" },
    { key: "homepage", label: "Homepage AI" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Management</h1>
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="space-y-4 pt-4">
          {features.map((f) => {
            const cur = s[f.key] ?? {};
            return (
              <Card key={f.key}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{f.label}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label>Enabled</Label>
                    <Switch
                      checked={cur.enabled ?? true}
                      onCheckedChange={(v) => upd.mutate({ key: f.key, value: { ...cur, enabled: v, prompt: prompts[f.key] } })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Prompt</Label>
                    <Textarea
                      rows={3}
                      value={prompts[f.key] ?? ""}
                      onChange={(e) => setPrompts((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label>Budget (calls/day)</Label>
                      <Input
                        type="number"
                        defaultValue={cur.budget ?? 1000}
                        onBlur={(e) => upd.mutate({ key: f.key, value: { ...cur, budget: Number(e.target.value), prompt: prompts[f.key] } })}
                      />
                    </div>
                    <Button onClick={() => upd.mutate({ key: f.key, value: { ...cur, prompt: prompts[f.key] } })}>Save Prompt</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="logs" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Recent AI Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(logs ?? []).map((l, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{l.feature} <span className="text-xs text-muted-foreground">({l.model})</span></div>
                      <div className="text-xs text-muted-foreground">{new Date(l.ts).toLocaleString()} · {l.latencyMs}ms{l.error ? ` · ${l.error}` : ""}</div>
                    </div>
                    <div className={l.ok ? "text-green-600" : "text-destructive"}>{l.ok ? "ok" : "fail"}</div>
                  </div>
                ))}
                {(!logs || logs.length === 0) && <p className="text-muted-foreground">No logs yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
