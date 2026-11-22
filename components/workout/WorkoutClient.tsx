"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clock, localDateString } from "@/lib/dates";
import { addPending, loadActive, loadPending, saveActive } from "@/lib/client/storage";
import { syncPending } from "@/lib/client/sync";
import { unlockAudio } from "@/lib/client/sound";
import { useWakeLock } from "@/lib/client/useWakeLock";
import { uuid } from "@/lib/client/uuid";
import { buildSteps, nextActiveStep } from "@/lib/workout-steps";
import {
  unitFor,
  type ActiveWorkout,
  type ChecklistItem,
  type Exercise,
  type ExerciseStat,
  type FinishedWorkoutPayload,
  type NextWorkout,
} from "@/lib/types";
import Checklist from "./Checklist";
import ExerciseCard from "./ExerciseCard";
import RestScreen from "./RestScreen";
import Summary from "./Summary";
import SwapSheet from "./SwapSheet";

interface Props {
  userId: number;
  next: NextWorkout;
  stats: Record<string, ExerciseStat>;
  warmup: ChecklistItem[];
  stretches: ChecklistItem[];
  allExercises: Exercise[];
  slotOptions: Record<string, Record<string, Exercise[]>>;
}

function newWorkout(next: NextWorkout): ActiveWorkout {
  return {
    version: 1,
    id: uuid(),
    workoutKey: next.key,
    workoutName: next.name,
    format: next.format,
    total: next.total,
    restSeconds: next.restSeconds,
    startedAt: new Date().toISOString(),
    localDate: localDateString(),
    plan: next.plan,
    exercises: next.exercises.map((e) => ({ ...e, skipped: false })),
    phase: "warmup",
    step: 0,
    restEndsAt: null,
    warmupDone: [],
    stretchDone: [],
    sets: [],
    prs: [],
  };
}

interface Finished {
  payload: FinishedWorkoutPayload;
  prs: ActiveWorkout["prs"];
  synced: boolean | null;
}

export default function WorkoutClient({ userId, next, stats, warmup, stretches, allExercises, slotOptions }: Props) {
  const router = useRouter();
  const [w, setW] = useState<ActiveWorkout | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Load an in-progress workout, or start the next one.
  useEffect(() => {
    const existing = loadActive(userId);
    const workout = existing ?? newWorkout(next);
    if (!existing) saveActive(userId, workout);
    setW(workout);
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useWakeLock(!!w && !finished);

  /** Apply a change and persist it to localStorage immediately. */
  const update = useCallback(
    (fn: (prev: ActiveWorkout) => ActiveWorkout) => {
      setW((prev) => {
        if (!prev) return prev;
        const nextState = fn(prev);
        saveActive(userId, nextState);
        return nextState;
      });
    },
    [userId],
  );

  const steps = useMemo(() => (w ? buildSteps(w) : []), [w]);

  const bestFor = useCallback(
    (exerciseId: string, workout: ActiveWorkout): number | null => {
      const values = workout.sets.filter((s) => s.exerciseId === exerciseId).map((s) => s.value);
      const hist = stats[exerciseId]?.best;
      if (hist != null) values.push(hist);
      return values.length ? Math.max(...values) : null;
    },
    [stats],
  );

  const finishRest = useCallback(() => update((p) => ({ ...p, phase: "main", restEndsAt: null })), [update]);

  if (finished) {
    return (
      <main className="mx-auto max-w-lg pb-8">
        <Summary
          workoutName={finished.payload.workoutName}
          durationSeconds={finished.payload.durationSeconds}
          sets={finished.payload.sets}
          prs={finished.prs}
          synced={finished.synced}
          onSync={async () => {
            setFinished((f) => f && { ...f, synced: null });
            await syncPending(userId);
            setFinished((f) => f && { ...f, synced: !loadPending(userId).some((p) => p.id === f.payload.id) });
          }}
          onDone={() => {
            router.replace("/");
            router.refresh();
          }}
        />
      </main>
    );
  }

  if (!w) return <div className="grid min-h-[60dvh] place-items-center text-zinc-500">Loading…</div>;

  const step = steps[w.step];
  const current = step ? w.exercises[step.exIdx] : null;
  const elapsed = Math.max(0, Math.floor((now - new Date(w.startedAt).getTime()) / 1000));
  const progress = w.phase === "warmup" ? 0 : w.phase === "stretch" ? 1 : steps.length ? w.step / steps.length : 1;
  const stepLabel = (setNumber: number) =>
    w.format === "sets" ? `Set ${setNumber} of ${w.total}` : `Round ${setNumber} of ${w.total}`;

  function toggle(list: "warmupDone" | "stretchDone", id: string) {
    update((p) => ({ ...p, [list]: p[list].includes(id) ? p[list].filter((x) => x !== id) : [...p[list], id] }));
  }

  function startMain() {
    unlockAudio();
    update((p) => {
      const first = nextActiveStep(p, 0);
      return first === -1 ? { ...p, phase: "stretch" } : { ...p, phase: "main", step: first };
    });
  }

  function saveSet(value: number) {
    if (!w || !step || !current) return;
    const ex = current.exercise;
    const prevBest = bestFor(ex.id, w);
    const isPR = stats[ex.id]?.best != null && prevBest !== null && value > prevBest;
    if (isPR) {
      setPrFlash(ex.name);
      setTimeout(() => setPrFlash(null), 1700);
    }
    update((p) => {
      const unit = unitFor(ex.type);
      const sets = [...p.sets, { exerciseId: ex.id, exerciseName: ex.name, slot: current.slot, setNumber: step.setNumber, value, unit }];
      const prs = isPR ? [...p.prs.filter((x) => x.exerciseId !== ex.id), { exerciseId: ex.id, exerciseName: ex.name, value, unit }] : p.prs;
      const nextIdx = nextActiveStep(p, p.step + 1);
      if (nextIdx === -1) return { ...p, sets, prs, phase: "stretch", restEndsAt: null };
      return { ...p, sets, prs, step: nextIdx, phase: "rest", restEndsAt: Date.now() + p.restSeconds * 1000 };
    });
  }

  function skipExercise() {
    if (!step) return;
    update((p) => {
      const exercises = p.exercises.map((e, i) => (i === step.exIdx ? { ...e, skipped: true } : e));
      const updated = { ...p, exercises };
      const nextIdx = nextActiveStep(updated, p.step);
      return nextIdx === -1 ? { ...updated, phase: "stretch" } : { ...updated, step: nextIdx, phase: "main" };
    });
  }

  function swapTo(ex: Exercise) {
    if (!step) return;
    update((p) => ({ ...p, exercises: p.exercises.map((e, i) => (i === step.exIdx ? { ...e, exercise: ex } : e)) }));
    setSwapOpen(false);
  }

  function endEarly() {
    if (confirm("End the exercises now and go to stretches?")) update((p) => ({ ...p, phase: "stretch", restEndsAt: null }));
  }

  async function finish() {
    if (!w) return;
    const finishedAt = new Date();
    const payload: FinishedWorkoutPayload = {
      id: w.id,
      workoutKey: w.workoutKey,
      workoutName: w.workoutName,
      localDate: w.localDate,
      startedAt: w.startedAt,
      finishedAt: finishedAt.toISOString(),
      durationSeconds: Math.min(86_400, Math.max(0, Math.round((finishedAt.getTime() - new Date(w.startedAt).getTime()) / 1000))),
      plan: w.plan,
      sets: w.sets,
    };
    // Save locally first so nothing is lost if the request fails.
    addPending(userId, payload);
    saveActive(userId, null);
    setFinished({ payload, prs: w.prs, synced: null });
    await syncPending(userId);
    const synced = !loadPending(userId).some((p) => p.id === payload.id);
    setFinished((f) => f && { ...f, synced });
  }

  // Swap candidates: same slot first, then every other exercise of the same type.
  let sameSlot: Exercise[] = [];
  let others: Exercise[] = [];
  if (current) {
    const ex = current.exercise;
    sameSlot = (slotOptions[w.workoutKey]?.[current.slot] ?? []).filter((o) => o.id !== ex.id);
    const taken = new Set([ex.id, ...sameSlot.map((o) => o.id)]);
    others = allExercises.filter((o) => o.type === ex.type && !taken.has(o.id));
  }

  return (
    <main className="mx-auto max-w-lg pb-8">
      <header className="sticky top-0 z-20 -mx-4 mb-4 bg-zinc-50/90 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur dark:bg-zinc-950/90">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="btn-ghost -ml-3 px-3" aria-label="Leave workout (progress is kept)">
            ←
          </Link>
          <div className="text-center">
            <p className="font-semibold leading-tight">{w.workoutName}</p>
            <p className="text-xs tabular-nums text-zinc-500">{clock(elapsed)}</p>
          </div>
          {w.phase === "main" || w.phase === "rest" ? (
            <button className="btn-ghost -mr-3 px-3 text-sm" onClick={endEarly}>
              End
            </button>
          ) : (
            <span className="w-12" />
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {w.phase === "warmup" && (
        <Checklist
          title="Warm-up"
          subtitle="Tap each one as you go. Ticking is optional."
          items={warmup}
          done={w.warmupDone}
          onToggle={(id) => toggle("warmupDone", id)}
          actionLabel="Continue"
          onAction={startMain}
        />
      )}

      {w.phase === "main" && step && current && (
        <ExerciseCard
          key={`${w.step}-${current.exercise.id}`}
          slot={current.slot}
          exercise={current.exercise}
          progressLabel={stepLabel(step.setNumber)}
          last={stats[current.exercise.id]?.last ?? []}
          best={bestFor(current.exercise.id, w)}
          onSave={saveSet}
          onSwap={() => setSwapOpen(true)}
          onSkip={skipExercise}
        />
      )}

      {w.phase === "rest" && step && current && w.restEndsAt && (
        <RestScreen
          endsAt={w.restEndsAt}
          restSeconds={w.restSeconds}
          nextTitle={current.exercise.name}
          nextDetail={`${stepLabel(step.setNumber)} · ${current.exercise.target}${current.exercise.perSide ? " per side" : ""}`}
          onAdd={(s) => update((p) => ({ ...p, restEndsAt: (p.restEndsAt ?? Date.now()) + s * 1000 }))}
          onDone={finishRest}
        />
      )}

      {w.phase === "stretch" && (
        <Checklist
          title="Stretches"
          subtitle="Cool down. Tap each one as you go."
          items={stretches}
          done={w.stretchDone}
          onToggle={(id) => toggle("stretchDone", id)}
          actionLabel="Finish workout"
          onAction={finish}
        />
      )}

      {swapOpen && current && (
        <SwapSheet current={current.exercise} sameSlot={sameSlot} others={others} onPick={swapTo} onClose={() => setSwapOpen(false)} />
      )}

      {prFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
          <div className="animate-pop rounded-3xl bg-amber-400 px-8 py-6 text-center text-zinc-950 shadow-2xl shadow-amber-500/40">
            <div className="text-5xl">🏆</div>
            <div className="text-3xl font-black">New PR!</div>
            <div className="text-sm font-semibold">{prFlash}</div>
          </div>
        </div>
      )}
    </main>
  );
}
