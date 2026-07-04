import { createFileRoute, Link, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { signInFn } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const searchSchema = z.object({
  redirect: fallback(z.string(), "/account").default("/account"),
  error: fallback(z.string(), "").optional(),
});

function safeTarget(t: string) {
  return t.startsWith("/") && !t.startsWith("//") ? t : "/account";
}

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Sign in — Giftty" }, { name: "robots", content: "noindex" }] }),
  component: SignInPage,
});

function SignInPage() {
  const search = Route.useSearch();
  const { user } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(search.error ? search.error : null);

  const signIn = useMutation({
    mutationFn: (data: { email: string; password: string }) => signInFn({ data }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await router.invalidate();
      navigate({ href: safeTarget(search.redirect) });
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  if (user) {
    return (
      <div className="container-page flex items-center justify-center py-10 md:py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center md:p-8">
          <h1 className="font-display text-2xl font-bold">You're signed in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Continue to your account as {user.email}.</p>
          <Button asChild className="mt-6 h-11 w-full">
            <a href={safeTarget(search.redirect)}>Continue</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your gifting journey.</p>
        <div className="mt-6">
          <GoogleSignInButton redirectAfter={safeTarget(search.redirect)} label="Sign in with Google" />
        </div>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            signIn.mutate({ email, password });
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={signIn.isPending}>
            {signIn.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          <Link to="/auth/sign-up" className="text-primary hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
