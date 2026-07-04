import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { adminBroadcastNotificationFn } from "@/lib/admin-ops.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/notifications")({ component: AdminNotifications });

function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const send = useMutation({
    mutationFn: () => adminBroadcastNotificationFn({ data: { title, body: body || undefined, link: link || undefined, audience: "all" } }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success(`Sent to ${r.count} users`); setTitle(""); setBody(""); setLink(""); },
  });

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="font-display text-2xl font-bold">Broadcast notification</h1>
      <p className="text-sm text-muted-foreground">Send an in-app notification to every user. Appears in their bell.</p>
      <div className="rounded-md border border-border bg-card p-4 space-y-3">
        <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
        <div><Label>Body</Label><Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} /></div>
        <div><Label>Link (optional)</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/festivals/diwali" /></div>
        <Button onClick={() => send.mutate()} disabled={!title || send.isPending}>
          <Send className="size-4 mr-1.5" /> Broadcast
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Email · SMS · WhatsApp · Push — coming soon.</p>
    </div>
  );
}
