"use client";

import { useEffect, useState } from "react";
import { clock } from "@/lib/dates";
import { unlockAudio } from "@/lib/client/sound";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Tap to start counting up, tap again to stop. The result lands in an editable input. */
export default function TimerInput({ value, onChange }: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [startedAt]);

  const running = startedAt !== null;
  const elapsed = running ? Math.floor((now - startedAt) / 1000) : Number(value) || 0;

  function toggle() {
    unlockAudio();
    if (running) {
      onChange(String(Math.floor((Date.now() - startedAt) / 1000)));
      setStartedAt(null);
    } else {
      const t = Date.now();
      setNow(t);
      setStartedAt(t);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        className={`grid size-52 place-items-center rounded-full border-8 transition active:scale-95 ${
          running
            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_-8px] shadow-emerald-500/60"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }`}
        aria-label={running ? "Stop timer" : "Start timer"}
      >
        <span className="text-center">
          <span className="block text-6xl font-bold tabular-nums">{clock(elapsed)}</span>
          <span className={`mt-1 block text-sm font-semibold uppercase tracking-wider ${running ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>
            {running ? "Tap to stop" : elapsed > 0 ? "Tap to restart" : "Tap to start"}
          </span>
        </span>
      </button>
      <label className="flex items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={running ? "" : value}
          placeholder={running ? "…" : "0"}
          disabled={running}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
          className="input w-28 text-center text-3xl font-bold tabular-nums"
          aria-label="Seconds"
        />
        <span className="text-lg text-zinc-500">seconds</span>
      </label>
    </div>
  );
}
