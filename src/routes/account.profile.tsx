import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { deleteAccountFn, getProfileFn, updateProfileFn } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/account/profile")({
  head: () => ({ meta: [{ title: "Profile — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.name ?? "");
      setPhone(data.profile.phone ?? "");
      setAvatarUrl(data.profile.avatarUrl ?? "");
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => updateProfileFn({ data: { name, phone, avatarUrl } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const del = useMutation({
    mutationFn: () => deleteAccountFn({ data: { confirm: "DELETE" } }),
    onSuccess: () => { window.location.assign("/"); },
  });

  const p = data?.profile;
  const initial = (p?.name || p?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update how you appear on Giftty.</p>
      </div>

      <form
        className="space-y-5 rounded-md border border-border bg-card p-5"
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      >
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl || undefined} alt={name || ""} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" type="url" placeholder="https://…" className="mt-1 h-11" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className="mt-1 h-11" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" className="mt-1 h-11" value={p?.email ?? ""} disabled readOnly />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className="mt-1 h-11" value={phone} placeholder="+91 98xxxxxxxx" onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Member since</Label>
            <div className="mt-1 flex h-11 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              {p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>

      <section className="rounded-md border border-destructive/40 bg-destructive/5 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-destructive">
          <AlertTriangle className="size-4" /> Danger zone
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Deleting your account is permanent. Your data will be removed and you'll be signed out.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Type <span className="font-mono font-bold">DELETE</span> below to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirm !== "DELETE" || del.isPending}
                onClick={() => del.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {del.isPending ? "Deleting…" : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
