"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERNAME_RE, USERNAME_RULE } from "@/lib/constants";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isLogin && !USERNAME_RE.test(username.trim())) {
      setError(USERNAME_RULE);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Can't reach the server. Check your connection.");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-emerald-500 text-3xl text-white shadow-lg shadow-emerald-500/30">
          <svg viewBox="0 0 24 24" className="size-9" fill="currentColor" aria-hidden>
            <rect x="4" y="8" width="2.6" height="8" rx="1" />
            <rect x="17.4" y="8" width="2.6" height="8" rx="1" />
            <rect x="2" y="9.8" width="2" height="4.4" rx=".8" />
            <rect x="20" y="9.8" width="2" height="4.4" rx=".8" />
            <rect x="6.6" y="11" width="10.8" height="2" rx=".6" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Simple Workout</h1>
        <p className="mt-1 text-zinc-500">{isLogin ? "Welcome back. Let's train." : "Create your account."}</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="label">Username</span>
          <input
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={20}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? 1 : 4}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? "…" : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        {isLogin ? "No account yet? " : "Already have an account? "}
        <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-emerald-600 dark:text-emerald-400">
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </main>
  );
}
