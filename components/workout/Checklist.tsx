"use client";

import type { ChecklistItem } from "@/lib/types";

interface Props {
  title: string;
  subtitle: string;
  items: ChecklistItem[];
  done: string[];
  onToggle: (id: string) => void;
  actionLabel: string;
  onAction: () => void;
  busy?: boolean;
}

export default function Checklist({ title, subtitle, items, done, onToggle, actionLabel, onAction, busy }: Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const checked = done.includes(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={checked}
                className={`card flex w-full items-center gap-4 text-left transition active:scale-[0.99] ${checked ? "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10" : ""}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${
                    checked ? "border-emerald-500 bg-emerald-500 text-white dark:text-zinc-950" : "border-zinc-300 dark:border-zinc-600"
                  }`}
                  aria-hidden
                >
                  {checked && (
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                </span>
                <span className="flex-1">
                  <span className={`block font-medium ${checked ? "text-zinc-500 line-through" : ""}`}>{item.name}</span>
                </span>
                {item.detail && <span className="text-sm text-zinc-500">{item.detail}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <button className="btn-primary h-16 w-full text-xl" onClick={onAction} disabled={busy}>
        {actionLabel}
      </button>
    </div>
  );
}
