import { groupBy } from "@/lib/group";
import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { sets, workouts } from "@/lib/db/schema";
import { localDateString } from "@/lib/dates";

export async function GET() {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;

  const ws = await db().select().from(workouts).where(eq(workouts.userId, user.id)).orderBy(asc(workouts.startedAt));
  const allSets = ws.length
    ? await db().select().from(sets).where(inArray(sets.workoutId, ws.map((w) => w.id))).orderBy(asc(sets.id))
    : [];
  const bySet = groupBy(allSets, (s) => s.workoutId);

  const data = {
    app: "Simple Workout",
    exportedAt: new Date().toISOString(),
    username: user.username,
    workouts: ws.map((w) => ({
      id: w.id,
      workoutKey: w.workoutKey,
      workoutName: w.workoutName,
      localDate: w.localDate,
      startedAt: w.startedAt.toISOString(),
      finishedAt: w.finishedAt.toISOString(),
      durationSeconds: w.durationSeconds,
      sets: (bySet.get(w.id) ?? []).map(({ exerciseId, exerciseName, slot, setNumber, value, unit }) => ({ exerciseId, exerciseName, slot, setNumber, value, unit })),
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="simple-workout-${user.username}-${localDateString()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
