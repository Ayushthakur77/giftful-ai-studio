import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({ meta: [{ title: "Create your Giftty account" }, { name: "robots", content: "noindex" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="container-page flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start sending joy across India.</p>
        <Button variant="outline" className="mt-6 h-11 w-full">Continue with Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div><Label htmlFor="name">Name</Label><Input id="name" required className="mt-1 h-11" /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required className="mt-1 h-11" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required className="mt-1 h-11" /></div>
          <Button type="submit" className="h-11 w-full">Create account</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link to="/auth/sign-in" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
