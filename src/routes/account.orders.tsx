import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "Your orders — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Your orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track, reorder, or download invoices for past purchases.</p>
      </div>
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Your recent orders will appear here once you complete a purchase."
        action={<Button asChild><Link to="/">Start shopping</Link></Button>}
      />
    </div>
  ),
});
