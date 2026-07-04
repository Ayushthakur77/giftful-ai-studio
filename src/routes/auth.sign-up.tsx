import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { signUpFn } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/sign-up")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "Create your Giftty account" }, { name: "robots", content: "noindex" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const signUp = useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) => signUpFn({ data }),
    onSuccess: async (result) => {
      if (!result.ok) return setError(result.error);
      await router.invalidate();
      navigate({ to: "/account" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    },
  });

  return (
    <div className="container-page flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start sending joy across India.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            signUp.mutate({ name, email, password });
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required className="mt-1 h-11" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required className="mt-1 h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={8} className="mt-1 h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={signUp.isPending}>
            {signUp.isPending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link to="/auth/sign-in" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
