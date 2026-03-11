import Link from "next/link";

import { AuthPageShell } from "@/components/blocks/auth-page-shell";
import { AuthForm } from "@/components/ui/premium-auth";

export default function LoginPage() {
  return (
    <AuthPageShell
      backgroundClassName="bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.16),_transparent_35%),linear-gradient(180deg,_var(--background),_color-mix(in_oklab,var(--background)_85%,white))]"
      gridClassName="lg:grid-cols-[1.1fr_0.9fr]"
    >
      <section className="space-y-6">
        <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          CPAssist access
        </div>
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Log in to continue your competitive programming workflow.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Track sessions, keep notes in sync, and move back into practice without redoing setup.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="rounded-full border border-border/70 px-3 py-1">Session history</span>
          <span className="rounded-full border border-border/70 px-3 py-1">Smart notes</span>
          <span className="rounded-full border border-border/70 px-3 py-1">Practice tracking</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-primary transition-colors hover:text-primary/80">
            Create one here
          </Link>
        </p>
      </section>

      <section className="rounded-4xl border border-border/70 bg-background/85 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
        <AuthForm initialMode="login" />
      </section>
    </AuthPageShell>
  );
}
