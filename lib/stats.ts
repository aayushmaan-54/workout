import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { workouts } from "./db/schema";
import type { ExerciseStat, WorkoutSummary } from "./types";

/** Best single set and most recent session's values for every exercise the user has logged. */
export async function getExerciseStats(userId: number): Promise<Record<string, ExerciseStat>> {
  const result = await db().execute<{ exercise_id: string; value: number; r: number; best: number }>(sql`
    select exercise_id, value, r, best from (
      select s.exercise_id, s.value, s.id,
             dense_rank() over (partition by s.exercise_id order by w.finished_at desc, w.id) as r,
             max(s.value) over (partition by s.exercise_id) as best
      from sets s join workouts w on w.id = s.workout_id
      where w.user_id = ${userId}
    ) t
    where r = 1
    order by exercise_id, id
  `);
  const out: Record<string, ExerciseStat> = {};
  for (const row of result.rows) {
    const stat = (out[row.exercise_id] ??= { best: Number(row.best), last: [] });
    stat.last.push(Number(row.value));
  }
  return out;
}

export async function listWorkouts(userId: number): Promise<WorkoutSummary[]> {
  const rows = await db()
    .select({
      id: workouts.id,
      workoutKey: workouts.workoutKey,
      workoutName: workouts.workoutName,
      localDate: workouts.localDate,
      startedAt: workouts.startedAt,
      durationSeconds: workouts.durationSeconds,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.localDate), desc(workouts.startedAt));
  return rows.map((r) => ({ ...r, startedAt: r.startedAt.toISOString() }));
}

export async function listWorkoutDates(userId: number): Promise<string[]> {
  const rows = await db().selectDistinct({ d: workouts.localDate }).from(workouts).where(eq(workouts.userId, userId));
  return rows.map((r) => r.d);
}

/** Every exercise the user has ever logged (including ones removed from the file). */
export async function listLoggedExercises(userId: number) {
  const result = await db().execute<{ exercise_id: string; name: string; unit: "reps" | "seconds" }>(sql`
    select s.exercise_id,
           (array_agg(s.exercise_name order by w.finished_at desc))[1] as name,
           (array_agg(s.unit order by w.finished_at desc))[1] as unit
    from sets s join workouts w on w.id = s.workout_id
    where w.user_id = ${userId}
    group by s.exercise_id
    order by name
  `);
  return result.rows.map((r) => ({ id: r.exercise_id, name: r.name, unit: r.unit }));
}
