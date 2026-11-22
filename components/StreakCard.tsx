"use client";

import { useEffect, useState } from "react";
import { localDateString } from "@/lib/dates";
import { computeStreak, type StreakInfo } from "@/lib/streak";

export function useStreak(dates: string[], breakAfter: number, extraDates: string[] = []): StreakInfo | null {
  const [info, setInfo] = useState<StreakInfo | null>(null);
  const key = dates.join() + "|" + extraDates.join();
  useEffect(() => {
    setInfo(computeStreak([...dates, ...extraDates], localDateString(), breakAfter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, breakAfter]);
  return info;
}

export default function StreakCard({ info, showHint = true }: { info: StreakInfo | null; showHint?: boolean }) {
  let hint = "";
  if (info) {
    if (info.current === 0) hint = info.best > 0 ? "Start a new streak today." : "Your first workout starts the streak.";
    else if (info.trainedToday) hint = "Done today. Nice work!";
    else if (info.restDaysLeft === 0) hint = "Train today to keep your streak.";
    else hint = `You can rest ${info.restDaysLeft} more day${info.restDaysLeft === 1 ? "" : "s"} without losing it.`;
  }
  return (
    <div className="card flex items-center gap-4">
      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-3xl" aria-hidden>
        🔥
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{info?.current ?? "–"}</span>
          <span className="text-sm text-zinc-500">workout{info?.current === 1 ? "" : "s"} in a row</span>
        </div>
        {showHint && <p className="truncate text-sm text-zinc-500">{hint}</p>}
      </div>
      <div className="text-right">
        <div className="label">Best</div>
        <div className="text-xl font-bold tabular-nums">{info?.best ?? "–"}</div>
      </div>
    </div>
  );
}
