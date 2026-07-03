import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="container-page flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your gifting journey.</p>
        <Button variant="outline" className="mt-6 h-11 w-full">Continue with Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required className="mt-1 h-11" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required className="mt-1 h-11" />
          </div>
          <Button type="submit" className="h-11 w-full">Sign in</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          <Link to="/auth/sign-up" className="text-primary hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
