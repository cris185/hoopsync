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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-[380px] flex-col gap-7">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <Logo size={30} />
          <span className="font-display text-xl font-extrabold tracking-wide uppercase">HoopSync</span>
        </Link>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Welcome back</h1>
          <p className="text-sm text-text-secondary">Sign in to manage your tournaments</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-status-live">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-accent-400 hover:text-accent-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
