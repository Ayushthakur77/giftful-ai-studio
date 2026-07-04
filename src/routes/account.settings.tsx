import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Monitor, LogOut, Bell, BellRing } from "lucide-react";

import { listSessionsFn, signOutOthersFn } from "@/lib/profile.functions";
import {
  listNotificationsFn, markAllNotificationsReadFn, markNotificationReadFn,
} from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";

export const Route = createFileRoute("/account/settings")({
  head: () => ({ meta: [{ title: "Account settings — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: sessions = [] } = useQuery({ queryKey: ["sessions"], queryFn: () => listSessionsFn() });
  const { data: notif } = useQuery({ queryKey: ["notifications"], queryFn: () => listNotificationsFn() });

  const signOutOthers = useMutation({
    mutationFn: () => signOutOthersFn(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(res.removed > 0 ? `Signed out ${res.removed} other device${res.removed === 1 ? "" : "s"}` : "No other active sessions");
    },
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsReadFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationReadFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage notifications and active sessions.</p>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold"><Bell className="size-4" /> Notifications</h3>
          {notif?.unread ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>Mark all read</Button>
          ) : null}
        </div>
        {notif?.items && notif.items.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {notif.items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3">
                <span className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${n.readAt ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                </div>
                {!n.readAt && (
                  <button className="text-xs text-primary hover:underline" onClick={() => markOne.mutate(n.id)}>Mark read</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3"><EmptyState icon={BellRing} title="You're all caught up" description="Order updates and account alerts will show here." /></div>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold"><Monitor className="size-4" /> Active sessions</h3>
          {otherSessions.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => signOutOthers.mutate()} disabled={signOutOthers.isPending}>
              <LogOut className="mr-1.5 size-3.5" /> Sign out other devices
            </Button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {s.userAgent?.slice(0, 80) ?? "Unknown device"}
                  {s.isCurrent && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">This device</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.ip ?? "unknown IP"} · last seen {new Date(s.lastSeenAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
