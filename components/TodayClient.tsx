"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { loadActive, loadPending, saveActive } from "@/lib/client/storage";
import { syncPending } from "@/lib/client/sync";
import type { ActiveWorkout, NextWorkout } from "@/lib/types";
import StreakCard, { useStreak } from "./StreakCard";

interface Props {
  userId: number;
  username: string;
  next: NextWorkout;
  dates: string[];
  breakAfter: number;
  color: string;
}

export default function TodayClient({ userId, username, next, dates, breakAfter, color }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const streak = useStreak(dates, breakAfter, pendingDates);

  const doSync = useCallback(async () => {
    if (!loadPending(userId).length) return;
    setSyncing(true);
    const before = loadPending(userId).length;
    const left = await syncPending(userId);
    setPendingDates(loadPending(userId).map((p) => p.localDate));
    setSyncing(false);
    if (left < before) router.refresh();
  }, [userId, router]);

  useEffect(() => {
    setActive(loadActive(userId));
    setPendingDates(loadPending(userId).map((p) => p.localDate));
    setReady(true);
    void doSync();
  }, [userId, doSync]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="space-y-4 animate-fade-in">
      <header className="pt-2">
        <p className="text-sm text-zinc-500" suppressHydrationWarning>
          {greeting}, {username}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
      </header>

      {pendingDates.length > 0 && (
        <div className="card flex items-center gap-3 border-amber-400/50 bg-amber-50 dark:bg-amber-500/10">
          <span className="text-2xl" aria-hidden>
            ⚠️
          </span>
          <div className="flex-1">
            <p className="font-semibold">Not synced</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {pendingDates.length} finished workout{pendingDates.length > 1 ? "s are" : " is"} saved on this phone only.
            </p>
          </div>
          <button className="btn-secondary" onClick={doSync} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      )}

      {active && (
        <div className="card space-y-3 border-emerald-500/50">
          <div>
            <p className="label">Workout in progress</p>
            <p className="text-xl font-bold">{active.workoutName}</p>
            <p className="text-sm text-zinc-500">
              {active.sets.length} set{active.sets.length === 1 ? "" : "s"} logged · started{" "}
              {new Date(active.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          {confirmDiscard ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDiscard(false)}>
                Keep it
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  saveActive(userId, null);
                  setActive(null);
                  setConfirmDiscard(false);
                }}
              >
                Yes, discard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDiscard(true)}>
                Discard
              </button>
              <Link href="/workout" className="btn-primary">
                Resume workout
              </Link>
            </div>
          )}
        </div>
      )}

      <StreakCard info={streak} />

      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Up next</p>
            <h2 className="text-2xl font-bold" style={{ color }}>
              {next.name}
            </h2>
            <p className="text-sm text-zinc-500">
              {next.format === "sets" ? `${next.total} sets each` : `${next.total} rounds circuit`} · {next.restSeconds}s rest
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {next.exercises.length} exercises
          </span>
        </div>
        <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {next.exercises.map(({ slot, exercise }) => (
            <li key={slot} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{exercise.name}</p>
                <p className="text-xs text-zinc-500">{slot}</p>
              </div>
              <p className="shrink-0 text-right text-sm text-zinc-500">
                {exercise.target}
                {exercise.perSide && <span className="block text-xs">per side</span>}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {ready && !active && (
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] pt-2">
          <Link href="/workout" className="btn-primary h-16 w-full text-xl shadow-lg">
            Start {next.name}
          </Link>
        </div>
      )}
    </main>
  );
}
