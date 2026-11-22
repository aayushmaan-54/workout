import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { rotationState, sets, workouts } from "@/lib/db/schema";
import { exercisesConfig } from "@/lib/exercises";
import { advanceRotation, getRotation } from "@/lib/rotation";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

const payload = z.object({
  id: z.uuid(),
  workoutKey: z.string().min(1).max(100),
  workoutName: z.string().min(1).max(200),
  localDate: z.string().regex(dateRe),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  durationSeconds: z.number().int().min(0).max(86_400),
  plan: z.record(z.string(), z.number().int().min(0)),
  sets: z
    .array(
      z.object({
        exerciseId: z.string().min(1).max(100),
        exerciseName: z.string().min(1).max(200),
        slot: z.string().min(1).max(100),
        setNumber: z.number().int().min(1).max(100),
        value: z.number().int().min(0).max(100_000),
        unit: z.enum(["reps", "seconds"]),
      }),
    )
    .max(500),
});

/** Save a finished workout (idempotent on id) and advance the rotation. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;

  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid workout data", 400);
  const w = parsed.data;

  const [existing] = await db().select({ userId: workouts.userId }).from(workouts).where(eq(workouts.id, w.id)).limit(1);
  if (existing) {
    if (existing.userId !== user.id) return jsonError("Conflict", 409);
    return NextResponse.json({ ok: true, alreadySaved: true });
  }

  const state = await getRotation(user.id);
  const next = exercisesConfig.workouts[w.workoutKey] ? advanceRotation(state, w.workoutKey, w.plan) : state;

  const insertWorkout = db()
    .insert(workouts)
    .values({
      id: w.id,
      userId: user.id,
      workoutKey: w.workoutKey,
      workoutName: w.workoutName,
      localDate: w.localDate,
      startedAt: new Date(w.startedAt),
      finishedAt: new Date(w.finishedAt),
      durationSeconds: w.durationSeconds,
    });
  const upsertRotation = db()
    .insert(rotationState)
    .values({ userId: user.id, ...next })
    .onConflictDoUpdate({ target: rotationState.userId, set: next });

  if (w.sets.length) {
    const insertSets = db().insert(sets).values(w.sets.map((s) => ({ ...s, workoutId: w.id })));
    await db().batch([insertWorkout, insertSets, upsertRotation]);
  } else {
    await db().batch([insertWorkout, upsertRotation]);
  }
  return NextResponse.json({ ok: true });
}

/** Workouts (with sets) for one local date: GET /api/workouts?date=YYYY-MM-DD */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!dateRe.test(date)) return jsonError("Invalid date", 400);

  const ws = await db()
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, user.id), eq(workouts.localDate, date)))
    .orderBy(asc(workouts.startedAt));
  const allSets = ws.length
    ? await db().select().from(sets).where(inArray(sets.workoutId, ws.map((w) => w.id))).orderBy(asc(sets.id))
    : [];
  return NextResponse.json({
    workouts: ws.map((w) => ({
      id: w.id,
      workoutKey: w.workoutKey,
      workoutName: w.workoutName,
      durationSeconds: w.durationSeconds,
      startedAt: w.startedAt.toISOString(),
      sets: allSets.filter((s) => s.workoutId === w.id).map(({ exerciseId, exerciseName, slot, setNumber, value, unit }) => ({ exerciseId, exerciseName, slot, setNumber, value, unit })),
    })),
  });
}
