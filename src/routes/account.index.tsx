import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/")({
  component: () => (
    <div>
      <h2 className="font-display text-xl font-bold">Welcome back</h2>
      <p className="mt-2 text-sm text-muted-foreground">Manage your orders, wishlist, addresses and more.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild><Link to="/account/orders">View orders</Link></Button>
        <Button asChild variant="outline"><Link to="/account/wishlist">Wishlist</Link></Button>
      </div>
    </div>
  ),
});
