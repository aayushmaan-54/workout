"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/dates";

interface Option {
  id: string;
  name: string;
  unit: "reps" | "seconds";
  removed: boolean;
}

interface Data {
  unit: "reps" | "seconds";
  points: { date: string; best: number }[];
  best: number | null;
  sessions: number;
}

const STORAGE_KEY = "sw:progress-exercise";

export default function ProgressClient({ options }: { options: Option[] }) {
  const [selected, setSelected] = useState<string>("");
  const [data, setData] = useState<Data | "loading" | "error" | null>(null);

  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {}
    setSelected(options.some((o) => o.id === saved) ? saved : (options[0]?.id ?? ""));
  }, [options]);

  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(STORAGE_KEY, selected);
    } catch {}
    let cancelled = false;
    setData("loading");
    fetch(`/api/progress?exerciseId=${encodeURIComponent(selected)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) => !cancelled && setData(d))
      .catch(() => !cancelled && setData("error"));
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const d = data && typeof data === "object" ? data : null;
  const unitLabel = d?.unit === "seconds" ? "seconds" : "reps";
  const chartData = d?.points.map((p, i) => ({ i, date: p.date, best: p.best })) ?? [];

  return (
    <main className="space-y-4 animate-fade-in">
      <h1 className="pt-2 text-3xl font-bold tracking-tight">Progress</h1>

      {options.length === 0 ? (
        <div className="card text-center text-zinc-500">
          <div className="mb-2 text-4xl">📈</div>
          Finish a workout and your progress graphs will appear here.
        </div>
      ) : (
        <>
          <label className="block space-y-1.5">
            <span className="label px-1">Exercise</span>
            <select className="input font-semibold" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.removed ? " (removed)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="label">All-time best</p>
              <p className="text-3xl font-bold tabular-nums">
                {d?.best ?? "–"}
                <span className="ml-1 text-base font-medium text-zinc-500">{d?.best != null ? (d.unit === "seconds" ? "sec" : "reps") : ""}</span>
              </p>
            </div>
            <div className="card">
              <p className="label">Sessions</p>
              <p className="text-3xl font-bold tabular-nums">{d?.sessions ?? "–"}</p>
            </div>
          </div>

          <section className="card">
            <p className="mb-3 text-sm font-semibold">
              Best set per session <span className="font-normal text-zinc-500">({unitLabel})</span>
            </p>
            <div className="h-64 text-zinc-500">
              {data === "loading" && <p className="grid h-full place-items-center">Loading…</p>}
              {data === "error" && <p className="grid h-full place-items-center text-red-500">Couldn&apos;t load data.</p>}
              {d && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
                    <XAxis
                      dataKey="i"
                      type="number"
                      domain={[0, Math.max(chartData.length - 1, 1)]}
                      allowDecimals={false}
                      tickFormatter={(i: number) => (chartData[i] ? formatDate(chartData[i].date, { day: "numeric", month: "short" }) : "")}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, "auto"]}
                      label={{ value: unitLabel, angle: -90, position: "insideLeft", offset: 16, fill: "currentColor", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                      content={({ active, payload }) => {
                        const p = active && payload?.[0]?.payload;
                        if (!p) return null;
                        return (
                          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="text-zinc-500">{formatDate(p.date)}</div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {p.best} {unitLabel}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="best"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#10b981", stroke: "var(--dot-ring)", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "var(--dot-ring)", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
