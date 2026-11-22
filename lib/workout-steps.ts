import type { ActiveWorkout } from "./types";

export interface Step {
  exIdx: number;
  /** set number (sets format) or round number (circuit) */
  setNumber: number;
}

export function buildSteps(w: Pick<ActiveWorkout, "format" | "total" | "exercises">): Step[] {
  const steps: Step[] = [];
  if (w.format === "sets") {
    w.exercises.forEach((_, exIdx) => {
      for (let n = 1; n <= w.total; n++) steps.push({ exIdx, setNumber: n });
    });
  } else {
    for (let n = 1; n <= w.total; n++) w.exercises.forEach((_, exIdx) => steps.push({ exIdx, setNumber: n }));
  }
  return steps;
}

/** First step at or after `from` whose exercise isn't skipped, or -1. */
export function nextActiveStep(w: ActiveWorkout, from: number): number {
  const steps = buildSteps(w);
  for (let i = from; i < steps.length; i++) if (!w.exercises[steps[i].exIdx].skipped) return i;
  return -1;
}
