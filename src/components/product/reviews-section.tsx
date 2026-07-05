import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { listProductReviewsFn, submitReviewFn } from "@/lib/reviews.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function ReviewsSection({ productSlug }: { productSlug: string }) {
  const qc = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const sub = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  const q = useQuery({
    queryKey: ["reviews", productSlug],
    queryFn: () => listProductReviewsFn({ data: { productSlug, limit: 20 } }),
    staleTime: 30_000,
  });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = useMutation({
    mutationFn: () => submitReviewFn({ data: { productSlug, rating, title: title || undefined, body: body || undefined } }),
    onSuccess: () => {
      toast.success("Thanks! Your review is pending approval.");
      setTitle(""); setBody(""); setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews", productSlug] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to submit review"),
  });

  const data = q.data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
        <div className="text-center">
          <div className="font-display text-3xl font-bold">{data?.avg?.toFixed(1) ?? "—"}</div>
          <StarRow value={data?.avg ?? 0} />
          <div className="mt-1 text-xs text-muted-foreground">{data?.count ?? 0} reviews</div>
        </div>
        <div className="flex-1 text-sm text-muted-foreground">
          Real reviews from verified buyers. Reviews are moderated before appearing.
        </div>
      </div>

      {/* Write */}
      {signedIn ? (
        <form
          className="space-y-3 rounded-md border border-border bg-card p-4"
          onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
        >
          <h3 className="text-sm font-semibold">Write a review</h3>
          <StarPicker value={rating} onChange={setRating} />
          <Input placeholder="Headline (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <Textarea placeholder="Share your experience…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} />
          <Button type="submit" size="sm" disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Submit review
          </Button>
        </form>
      ) : (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <a href={`/auth/sign-in?redirect=/p/${productSlug}`} className="text-primary underline">Sign in</a> to write a review.
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : (data?.reviews ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
        ) : (
          data!.reviews.map((r) => (
            <div key={r.id} className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRow value={r.rating} />
                  <span className="text-sm font-medium">{r.author}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="inline-flex" aria-label={`${value} stars`}>
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`size-4 ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex" role="radiogroup" aria-label="Rating">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
          aria-checked={value === n}
          className="p-0.5"
        >
          <Star className={`size-6 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}
