"use client";

import type { Exercise } from "@/lib/types";

interface Props {
  current: Exercise;
  sameSlot: Exercise[];
  others: Exercise[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}

export default function SwapSheet({ current, sameSlot, others, onPick, onClose }: Props) {
  const Group = ({ title, list }: { title: string; list: Exercise[] }) =>
    list.length ? (
      <div className="space-y-2">
        <p className="label px-1">{title}</p>
        {list.map((ex) => (
          <button key={ex.id} onClick={() => onPick(ex)} className="card flex w-full items-center justify-between gap-3 text-left active:scale-[0.99]">
            <span>
              <span className="block font-medium">{ex.name}</span>
              {ex.perSide && <span className="text-xs text-zinc-500">per side</span>}
            </span>
            <span className="text-sm text-zinc-500">{ex.target}</span>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-zinc-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Swap exercise</h3>
            <p className="text-sm text-zinc-500">Replacing {current.name} for this session only</p>
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-5">
          <Group title="Same slot" list={sameSlot} />
          <Group title={`Other ${current.type === "time" ? "timed" : "rep"} exercises`} list={others} />
          {!sameSlot.length && !others.length && <p className="text-zinc-500">No other options available.</p>}
        </div>
      </div>
    </div>
  );
}
