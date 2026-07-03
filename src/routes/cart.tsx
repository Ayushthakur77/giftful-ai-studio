import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Your cart</h1>
      <div className="mt-6">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add gifts you love and they'll show up here."
          action={
            <Button asChild><Link to="/">Continue shopping</Link></Button>
          }
        />
      </div>
    </div>
  );
}
