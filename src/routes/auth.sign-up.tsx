import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { handleGoogleAuthError } from "@/lib/google-auth-error";

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
  const [info, setInfo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signUp = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: { full_name: data.name },
        },
      });
      if (error) throw error;
      return res;
    },
    onSuccess: async (res) => {
      if (res.session) {
        await router.invalidate();
        navigate({ to: "/account" });
      } else {
        setInfo("Account created. Check your email to confirm your address.");
      }
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Sign-up failed"),
  });

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) {
        setError(handleGoogleAuthError(error, { flow: "sign-up" }));
        setGoogleLoading(false);
        return;
      }
      // Browser will redirect to Google — nothing else to do.
    } catch (e) {
      setError(handleGoogleAuthError(e, { flow: "sign-up" }));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="container-page flex items-center justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start sending joy across India.</p>
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
            <span>{googleLoading ? "Redirecting…" : "Sign up with Google"}</span>
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
            setInfo(null);
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
          {info && (
            <p role="status" className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary">
              {info}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={signUp.isPending}>
            {signUp.isPending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
