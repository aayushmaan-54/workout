"use client";

import { useEffect, useRef, useState } from "react";
import { clock } from "@/lib/dates";
import { beep } from "@/lib/client/sound";

interface Props {
  endsAt: number;
  restSeconds: number;
  nextTitle: string;
  nextDetail: string;
  onAdd: (seconds: number) => void;
  onDone: () => void;
}

export default function RestScreen({ endsAt, restSeconds, nextTitle, nextDetail, onAdd, onDone }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const total = Math.max(restSeconds, remaining, 1);
  const pct = remaining / total;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      beep();
      onDone();
    }
  }, [remaining, onDone]);

  const r = 110;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-6 pt-2 animate-fade-in">
      <p className="label">Rest</p>
      <div className="relative grid size-64 place-items-center">
        <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90">
          <circle cx="120" cy="120" r={r} fill="none" strokeWidth="12" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <circle
            cx="120"
            cy="120"
            r={r}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-emerald-500 transition-[stroke-dashoffset] duration-300 ease-linear"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <span className="text-7xl font-bold tabular-nums">{clock(remaining)}</span>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        <button className="btn-secondary h-14 text-lg" onClick={() => onAdd(5)}>
          +5s
        </button>
        <button className="btn-secondary h-14 text-lg" onClick={() => onAdd(10)}>
          +10s
        </button>
        <button
          className="btn-primary h-14 text-lg"
          onClick={() => {
            fired.current = true;
            onDone();
          }}
        >
          Skip
        </button>
      </div>
      <div className="card w-full">
        <p className="label">Up next</p>
        <p className="text-xl font-bold">{nextTitle}</p>
        <p className="text-sm text-zinc-500">{nextDetail}</p>
      </div>
    </div>
  );
}
