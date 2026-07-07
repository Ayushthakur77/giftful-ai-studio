import { createFileRoute, useNavigate, useRouteContext, useRouter, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const signIn = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
    },
    onSuccess: async () => {
      await router.invalidate();
      navigate({ href: safeTarget(search.redirect) });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Sign-in failed"),
  });

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectTarget = `${window.location.origin}${safeTarget(search.redirect)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTarget },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
        return;
      }
      // Browser will redirect to Google — nothing else to do.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

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
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.72 3.8-5.5 3.8-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.8 3.06 14.63 2 12 2 6.98 2 2.9 6.03 2.9 11s4.08 9 9.1 9c5.25 0 8.72-3.69 8.72-8.89 0-.6-.06-1.05-.15-1.51H12z" />
            </svg>
            <span>{googleLoading ? "Redirecting…" : "Sign in with Google"}</span>
          </button>
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
            <Input id="email" type="email" autoComplete="email" required className="mt-1 h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required className="mt-1 h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
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
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          <Link to="/auth/sign-up" className="text-primary hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
