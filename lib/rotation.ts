import { eq } from "drizzle-orm";
import { db } from "./db";
import { rotationState } from "./db/schema";
import { exercisesConfig, targetFor } from "./exercises";
import type { NextWorkout } from "./types";

type SlotIndexes = Record<string, Record<string, number>>;
interface RotationRow {
  nextWorkoutIndex: number;
  slotIndexes: SlotIndexes;
}

export async function getRotation(userId: number): Promise<RotationRow> {
  const rows = await db().select().from(rotationState).where(eq(rotationState.userId, userId)).limit(1);
  return rows[0] ?? { nextWorkoutIndex: 0, slotIndexes: {} };
}

/** Build a session from a workout key and the current slot indexes. */
export function buildWorkout(key: string, slotIndexes: SlotIndexes): NextWorkout {
  const w = exercisesConfig.workouts[key];
  const plan: Record<string, number> = {};
  const exercises = w.slots.map((s) => {
    const idx = (slotIndexes[key]?.[s.slot] ?? 0) % s.options.length;
    plan[s.slot] = idx;
    const ex = s.options[idx];
    return { slot: s.slot, exercise: { ...ex, target: targetFor(ex) } };
  });
  return {
    key,
    name: w.name,
    format: w.format,
    total: w.format === "sets" ? w.sets : w.rounds,
    restSeconds: w.restSeconds,
    plan,
    exercises,
  };
}

export async function getNextWorkout(userId: number): Promise<NextWorkout> {
  const state = await getRotation(userId);
  const { rotation } = exercisesConfig.settings;
  const key = rotation[state.nextWorkoutIndex % rotation.length];
  return buildWorkout(key, state.slotIndexes);
}

/** New rotation state after finishing `key` with the given slot plan. */
export function advanceRotation(state: RotationRow, key: string, plan: Record<string, number>): RotationRow {
  const { rotation } = exercisesConfig.settings;
  const w = exercisesConfig.workouts[key];
  const pos = rotation.indexOf(key);
  const nextWorkoutIndex = pos >= 0 ? (pos + 1) % rotation.length : state.nextWorkoutIndex;
  const slotIndexes: SlotIndexes = { ...state.slotIndexes };
  if (w) {
    const current = { ...(slotIndexes[key] ?? {}) };
    for (const s of w.slots) {
      const used = plan[s.slot] ?? current[s.slot] ?? 0;
      current[s.slot] = (used + 1) % s.options.length;
    }
    slotIndexes[key] = current;
  }
  return { nextWorkoutIndex, slotIndexes };
}
