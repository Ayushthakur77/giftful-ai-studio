import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2, Star } from "lucide-react";
import { adminListReviewsFn, adminModerateReviewFn, adminDeleteReviewFn } from "@/lib/admin-ops.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const { data: reviews = [] } = useQuery({ queryKey: ["admin-reviews", status], queryFn: () => adminListReviewsFn({ data: { status } }) });
  const mod = useMutation({
    mutationFn: (input: { id: string; status?: any; is_featured?: boolean }) => adminModerateReviewFn({ data: input }),
    onSuccess: (r) => { if (!r.ok) return toast.error(r.error); toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const del = useMutation({ mutationFn: (id: string) => adminDeleteReviewFn({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); } });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Reviews ({reviews.length})</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {reviews.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No reviews.</p> :
          reviews.map((r: any) => (
            <div key={r.id} className="p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />)}</div>
                    <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                    {r.is_featured && <Badge>Featured</Badge>}
                    <span className="text-xs text-muted-foreground">on {r.products?.name ?? r.ready_gift_boxes?.name ?? "—"}</span>
                  </div>
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" title="Approve" onClick={() => mod.mutate({ id: r.id, status: "approved" })}><Check className="size-4 text-success" /></Button>
                  <Button size="icon" variant="ghost" title="Reject" onClick={() => mod.mutate({ id: r.id, status: "rejected" })}><X className="size-4 text-destructive" /></Button>
                  <Button size="icon" variant="ghost" title="Feature" onClick={() => mod.mutate({ id: r.id, is_featured: !r.is_featured })}><Star className={`size-4 ${r.is_featured ? "fill-warning text-warning" : ""}`} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
