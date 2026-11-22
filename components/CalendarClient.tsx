"use client";

import { groupBy } from "@/lib/group";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDate, formatDuration, localDateString } from "@/lib/dates";
import type { LoggedSet, WorkoutSummary } from "@/lib/types";
import StreakCard, { useStreak } from "./StreakCard";

interface Props {
  workouts: WorkoutSummary[];
  colors: Record<string, string>;
  legend: Record<string, string>;
  breakAfter: number;
}

interface DayWorkout {
  id: string;
  workoutKey: string;
  workoutName: string;
  durationSeconds: number;
  sets: LoggedSet[];
}

const FALLBACK = "#a1a1aa";
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarClient({ workouts, colors, legend, breakAfter }: Props) {
  const dates = useMemo(() => workouts.map((w) => w.localDate), [workouts]);
  const streak = useStreak(dates, breakAfter);
  const byDate = useMemo(() => groupBy(workouts, (w) => w.localDate), [workouts]);

  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [today, setToday] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [day, setDay] = useState<{ date: string; workouts: DayWorkout[] } | "loading" | "error" | null>(null);

  useEffect(() => {
    const d = new Date();
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    setToday(localDateString(d));
  }, []);

  useEffect(() => {
    if (!selected) return setDay(null);
    if (!byDate.has(selected)) return setDay({ date: selected, workouts: [] });
    let cancelled = false;
    setDay("loading");
    fetch(`/api/workouts?date=${selected}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => !cancelled && setDay({ date: selected, workouts: data.workouts }))
      .catch(() => !cancelled && setDay("error"));
    return () => {
      cancelled = true;
    };
  }, [selected, byDate]);

  const cells = useMemo(() => {
    if (!month) return [];
    const first = new Date(month.y, month.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(localDateString(new Date(month.y, month.m, d)));
    return out;
  }, [month]);

  const shift = (delta: number) =>
    setMonth((cur) => {
      if (!cur) return cur;
      const d = new Date(cur.y, cur.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <main className="space-y-4 animate-fade-in">
      <h1 className="pt-2 text-3xl font-bold tracking-tight">Calendar</h1>
      <StreakCard info={streak} />

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-ghost size-12 p-0 text-xl" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <h2 className="text-lg font-semibold">
            {month && new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <button className="btn-ghost size-12 p-0 text-xl" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="pb-1 text-xs font-semibold text-zinc-400">
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;
            const ws = byDate.get(date) ?? [];
            const isToday = date === today;
            const isSelected = date === selected;
            return (
              <button
                key={date}
                onClick={() => setSelected(isSelected ? null : date)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition active:scale-95 ${
                  isSelected
                    ? "bg-emerald-500 text-white dark:text-zinc-950"
                    : isToday
                      ? "bg-zinc-100 font-bold ring-2 ring-emerald-500/60 dark:bg-zinc-800"
                      : ws.length
                        ? "bg-zinc-100 font-semibold dark:bg-zinc-800/70"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="tabular-nums">{Number(date.slice(8))}</span>
                <span className="flex h-1.5 gap-0.5">
                  {ws.slice(0, 3).map((w) => (
                    <span
                      key={w.id}
                      className="size-1.5 rounded-full ring-1 ring-white dark:ring-zinc-900"
                      style={{ background: colors[w.workoutKey] ?? FALLBACK }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          {Object.entries(legend).map(([key, name]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: colors[key] ?? FALLBACK }} />
              {name}
            </span>
          ))}
        </div>
      </section>

      {selected && (
        <section className="card space-y-3 animate-fade-in">
          <h2 className="font-semibold">{formatDate(selected, { weekday: "long", day: "numeric", month: "long" })}</h2>
          {day === "loading" && <p className="text-zinc-500">Loading…</p>}
          {day === "error" && <p className="text-red-500">Couldn&apos;t load this day.</p>}
          {day && typeof day === "object" && day.workouts.length === 0 && <p className="text-zinc-500">Rest day.</p>}
          {day &&
            typeof day === "object" &&
            day.workouts.map((w) => <DayWorkoutView key={w.id} w={w} color={colors[w.workoutKey] ?? FALLBACK} />)}
        </section>
      )}

      <section className="space-y-2" id="history">
        <h2 className="px-1 pt-2 text-xl font-bold">History</h2>
        {workouts.length === 0 && <p className="card text-zinc-500">No workouts yet. Your first one will show up here.</p>}
        {workouts.map((w) => (
          <Link key={w.id} href={`/history/${w.id}`} className="card flex items-center gap-3 active:scale-[0.99]">
            <span className="h-10 w-1.5 rounded-full" style={{ background: colors[w.workoutKey] ?? FALLBACK }} />
            <span className="flex-1">
              <span className="block font-semibold">{w.workoutName}</span>
              <span className="text-sm text-zinc-500">{formatDate(w.localDate)}</span>
            </span>
            <span className="text-sm tabular-nums text-zinc-500">{formatDuration(w.durationSeconds)}</span>
            <span className="text-zinc-400">›</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

function DayWorkoutView({ w, color }: { w: DayWorkout; color: string }) {
  const groups = [...groupBy(w.sets, (s) => s.exerciseId).values()];
  return (
    <Link href={`/history/${w.id}`} className="block rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800/60">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold" style={{ color }}>
          {w.workoutName}
        </span>
        <span className="text-sm text-zinc-500">{formatDuration(w.durationSeconds)}</span>
      </div>
      <ul className="space-y-0.5 text-sm">
        {groups.map((list) => (
          <li key={list[0].exerciseId} className="flex justify-between gap-2">
            <span>{list[0].exerciseName}</span>
            <span className="tabular-nums text-zinc-500">{list.map((s) => (s.unit === "seconds" ? `${s.value}s` : s.value)).join(" · ")}</span>
          </li>
        ))}
        {groups.length === 0 && <li className="text-zinc-500">No sets logged.</li>}
      </ul>
    </Link>
  );
}
