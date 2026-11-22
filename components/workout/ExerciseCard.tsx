"use client";

import { useState } from "react";
import { unlockAudio } from "@/lib/client/sound";
import type { Exercise } from "@/lib/types";
import TimerInput from "./TimerInput";

interface Props {
  slot: string;
  exercise: Exercise;
  progressLabel: string;
  last: number[];
  best: number | null;
  onSave: (value: number) => void;
  onSwap: () => void;
  onSkip: () => void;
}

const fmt = (n: number, type: Exercise["type"]) => (type === "time" ? `${n}s` : String(n));

export default function ExerciseCard({ slot, exercise, progressLabel, last, best, onSave, onSwap, onSkip }: Props) {
  const [value, setValue] = useState("");
  const [confirmSkip, setConfirmSkip] = useState(false);
  const num = Number(value);
  const valid = value !== "" && Number.isInteger(num) && num >= 0;

  function save() {
    if (!valid) return;
    unlockAudio();
    onSave(num);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="label">{slot}</span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {progressLabel}
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">{exercise.name}</h2>
          {exercise.perSide && (
            <span className="mt-1 inline-block rounded-md bg-sky-500/10 px-2 py-0.5 text-sm font-semibold text-sky-700 dark:text-sky-400">
              per side
            </span>
          )}
          {exercise.note && <p className="mt-2 text-sm text-zinc-500">💡 {exercise.note}</p>}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800/60">
            <dt className="label">Target</dt>
            <dd className="mt-0.5 font-semibold">{exercise.target}</dd>
          </div>
          <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800/60">
            <dt className="label">Last time</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{last.length ? last.map((n) => fmt(n, exercise.type)).join(" · ") : "—"}</dd>
          </div>
          <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800/60">
            <dt className="label">Best</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{best !== null ? fmt(best, exercise.type) : "—"}</dd>
          </div>
        </dl>
      </div>

      {exercise.type === "time" ? (
        <TimerInput value={value} onChange={setValue} />
      ) : (
        <label className="flex flex-col items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={value}
            placeholder={last.length ? String(last[0]) : "0"}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-28 w-48 rounded-3xl border-2 border-zinc-300 bg-white text-center text-7xl font-bold tabular-nums outline-none placeholder:text-zinc-300 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-700"
            aria-label="Reps"
          />
          <span className="text-lg text-zinc-500">reps{exercise.perSide ? " per side" : ""}</span>
        </label>
      )}

      <button className="btn-primary h-16 w-full text-xl" onClick={save} disabled={!valid}>
        Save set
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={onSwap}>
          ⇄ Swap
        </button>
        {confirmSkip ? (
          <button className="btn-danger" onClick={onSkip} onBlur={() => setConfirmSkip(false)}>
            Tap to skip
          </button>
        ) : (
          <button className="btn-secondary" onClick={() => setConfirmSkip(true)}>
            Skip exercise
          </button>
        )}
      </div>
    </div>
  );
}
