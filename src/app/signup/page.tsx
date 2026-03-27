import Link from "next/link";

import { AuthPageShell } from "@/components/blocks/auth-page-shell";
import { AuthForm } from "@/components/ui/premium-auth";

export default function SignupPage() {

  return (
    <AuthPageShell
      backgroundClassName="bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(180deg,_var(--background),_color-mix(in_oklab,var(--background)_84%,white))]"
      gridClassName="lg:grid-cols-[0.95fr_1.05fr]"
    >
      <section className="order-2 rounded-[2rem] border border-border/70 bg-background/85 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:order-1">
        <AuthForm initialMode="signup" />
      </section>

      <section className="order-1 space-y-6 lg:order-2">
        <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          CPAssist onboarding
        </div>
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Create your account and keep your preparation in one place.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Save solved problems, organize revision notes, and keep the training loop structured from day one.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">Clean email verification flow</div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">Strong password guidance</div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">Optional phone capture</div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">Ready for backend auth wiring</div>
        </div>
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary transition-colors hover:text-primary/80">
            Sign in here
          </Link>
        </p>
      </section>
    </AuthPageShell>
  );
}
