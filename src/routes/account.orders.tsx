import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/orders")({
  component: () => (
    <EmptyState
      icon={Package}
      title="No orders yet"
      description="Your recent orders will appear here."
      action={<Button asChild><Link to="/">Start shopping</Link></Button>}
    />
  ),
});
