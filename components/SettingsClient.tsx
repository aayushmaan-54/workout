"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  userId: number;
  username: string;
  rotation: { key: string; name: string; isNext: boolean }[];
  breakAfter: number;
}

export default function SettingsClient({ username, rotation, breakAfter }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <main className="space-y-4 animate-fade-in">
      <h1 className="pt-2 text-3xl font-bold tracking-tight">Settings</h1>

      <section className="card flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-full bg-emerald-500 text-xl font-bold text-white uppercase dark:text-zinc-950">
          {username.slice(0, 1)}
        </div>
        <div>
          <p className="label">Logged in as</p>
          <p className="text-lg font-semibold">{username}</p>
        </div>
      </section>

      <section className="card space-y-2">
        <p className="label">Rotation</p>
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {rotation.map((r, i) => (
            <li key={r.key} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 ${r.isNext ? "bg-emerald-500 font-semibold text-white dark:text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800"}`}
              >
                {r.name}
              </span>
              {i < rotation.length - 1 && <span className="text-zinc-400">→</span>}
            </li>
          ))}
        </ol>
        <p className="text-sm text-zinc-500">
          Your streak survives up to {breakAfter} rest day{breakAfter === 1 ? "" : "s"} in a row. Exercises come from{" "}
          <code className="text-xs">data/exercises.json</code>.
        </p>
      </section>

      <section className="space-y-2">
        <Link href="/calendar#history" className="card flex items-center justify-between active:scale-[0.99]">
          <span className="font-medium">Workout history</span>
          <span className="text-zinc-400">›</span>
        </Link>
        <a href="/api/export" download className="card flex items-center justify-between active:scale-[0.99]">
          <span>
            <span className="block font-medium">Export my data</span>
            <span className="text-sm text-zinc-500">All workouts and sets as a JSON file</span>
          </span>
          <span className="text-zinc-400">↓</span>
        </a>
      </section>

      <button className="btn-secondary w-full text-red-600 dark:text-red-400" onClick={logout} disabled={busy}>
        {busy ? "Logging out…" : "Log out"}
      </button>
    </main>
  );
}
