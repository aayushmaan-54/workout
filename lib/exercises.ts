import raw from "@/data/exercises.json";
import { parseExercisesFile } from "./exercises-schema";
import type { ChecklistItem, Exercise } from "./types";

/** The validated exercises file. Server-side only. */
export const exercisesConfig = parseExercisesFile(raw);

export function targetFor(ex: Exercise): string {
  return ex.target ?? (ex.type === "time" ? exercisesConfig.settings.defaultTimeTarget : exercisesConfig.settings.defaultRepTarget);
}

/** Every distinct exercise in the file, with its target filled in. */
export function allExercises(): Exercise[] {
  const map = new Map<string, Exercise>();
  for (const w of Object.values(exercisesConfig.workouts)) {
    for (const s of w.slots) {
      for (const ex of s.options) if (!map.has(ex.id)) map.set(ex.id, { ...ex, target: targetFor(ex) });
    }
  }
  return [...map.values()];
}

export const warmup: ChecklistItem[] = exercisesConfig.warmup;
export const stretches: ChecklistItem[] = exercisesConfig.stretches;

/** Workout key → color, ordered by rotation. */
const PALETTE = ["#0ea5e9", "#8b5cf6", "#f97316", "#10b981", "#ec4899", "#eab308"];
export function workoutColors(): Record<string, string> {
  const keys = [...exercisesConfig.settings.rotation, ...Object.keys(exercisesConfig.workouts)];
  const out: Record<string, string> = {};
  for (const k of keys) if (!(k in out)) out[k] = PALETTE[Object.keys(out).length % PALETTE.length];
  return out;
}

/** workout key → slot → options (with targets), used for swapping. */
export function slotOptions(): Record<string, Record<string, Exercise[]>> {
  const out: Record<string, Record<string, Exercise[]>> = {};
  for (const [key, w] of Object.entries(exercisesConfig.workouts)) {
    out[key] = {};
    for (const s of w.slots) out[key][s.slot] = s.options.map((ex) => ({ ...ex, target: targetFor(ex) }));
  }
  return out;
}
