"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

type Role = "ORGANIZER" | "SPECTATOR";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "ORGANIZER", label: "Organize tournaments", description: "Create and manage your own competitions" },
  { value: "SPECTATOR", label: "Just watching", description: "Follow tournaments, teams and live scores" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ORGANIZER");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password, name, role);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-7">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <Logo size={30} />
          <span className="font-display text-xl font-extrabold tracking-wide uppercase">HoopSync</span>
        </Link>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Create your account</h1>
          <p className="text-sm text-text-secondary">Free, forever — no card required</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="name">
              Name
            </label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="password">
              Password
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">I want to…</span>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-sm border p-3 text-left transition",
                    role === option.value
                      ? "border-accent-400 bg-accent/10"
                      : "border-surface-border bg-bg-sunken hover:border-surface-tint-strong",
                  )}
                >
                  <span className="text-xs font-bold">{option.label}</span>
                  <span className="text-[11px] text-text-tertiary">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-status-live">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
            {isSubmitting ? "Creating account…" : "Get Started"}
          </Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-400 hover:text-accent-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
