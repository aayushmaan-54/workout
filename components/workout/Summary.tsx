"use client";

import { groupBy } from "@/lib/group";
import { formatDuration } from "@/lib/dates";
import type { LoggedSet, PR } from "@/lib/types";

interface Props {
  workoutName: string;
  durationSeconds: number;
  sets: LoggedSet[];
  prs: PR[];
  synced: boolean | null;
  onSync: () => void;
  onDone: () => void;
}

export default function Summary({ workoutName, durationSeconds, sets, prs, synced, onSync, onDone }: Props) {
  const byExercise = groupBy(sets, (s) => s.exerciseId);
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="pt-4 text-center">
        <div className="text-6xl" aria-hidden>
          🎉
        </div>
        <h1 className="mt-2 text-3xl font-bold">Workout done!</h1>
        <p className="text-zinc-500">{workoutName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="label">Duration</p>
          <p className="text-2xl font-bold tabular-nums">{formatDuration(durationSeconds)}</p>
        </div>
        <div className="card text-center">
          <p className="label">Exercises</p>
          <p className="text-2xl font-bold tabular-nums">{byExercise.size}</p>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="card border-amber-400/60 bg-amber-50 dark:bg-amber-500/10">
          <p className="label mb-2">🏆 New personal records</p>
          <ul className="space-y-1">
            {prs.map((p) => (
              <li key={p.exerciseId} className="flex justify-between">
                <span>{p.exerciseName}</span>
                <span className="font-bold tabular-nums">
                  {p.value} {p.unit === "seconds" ? "sec" : "reps"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <p className="label mb-2">What you did</p>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[...byExercise.values()].map((list) => (
            <li key={list[0].exerciseId} className="flex justify-between gap-3 py-2">
              <span className="font-medium">{list[0].exerciseName}</span>
              <span className="text-zinc-500 tabular-nums">
                {list.map((s) => (s.unit === "seconds" ? `${s.value}s` : s.value)).join(" · ")}
              </span>
            </li>
          ))}
          {sets.length === 0 && <li className="py-2 text-zinc-500">No sets logged.</li>}
        </ul>
      </div>

      {synced === false && (
        <div className="card flex items-center gap-3 border-amber-400/50 bg-amber-50 dark:bg-amber-500/10">
          <div className="flex-1">
            <p className="font-semibold">Not synced</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Saved on this phone. We&apos;ll retry next time you open the app.</p>
          </div>
          <button className="btn-secondary" onClick={onSync}>
            Sync now
          </button>
        </div>
      )}
      {synced === null && <p className="text-center text-sm text-zinc-500">Saving…</p>}

      <button className="btn-primary h-16 w-full text-xl" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
