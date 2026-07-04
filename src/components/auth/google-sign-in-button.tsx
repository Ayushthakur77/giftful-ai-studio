interface GoogleButtonProps {
  redirectAfter?: string;
  label?: string;
}

export function GoogleSignInButton({ redirectAfter = "/account", label = "Continue with Google" }: GoogleButtonProps) {
  const href = `/api/auth/google/start?redirect=${encodeURIComponent(redirectAfter)}`;
  return (
    <a
      href={href}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.72 3.8-5.5 3.8-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.8 3.06 14.63 2 12 2 6.98 2 2.9 6.03 2.9 11s4.08 9 9.1 9c5.25 0 8.72-3.69 8.72-8.89 0-.6-.06-1.05-.15-1.51H12z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
