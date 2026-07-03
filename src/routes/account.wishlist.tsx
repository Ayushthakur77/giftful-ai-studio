import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/wishlist")({
  component: () => (
    <EmptyState
      icon={Heart}
      title="Your wishlist is empty"
      description="Tap the heart on any product to save it here."
      action={<Button asChild><Link to="/">Browse gifts</Link></Button>}
    />
  ),
});
