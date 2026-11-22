import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { db } from "@/lib/db";

/** Best set per session for one exercise: GET /api/progress?exerciseId=pushups */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const exerciseId = new URL(req.url).searchParams.get("exerciseId") ?? "";
  if (!exerciseId || exerciseId.length > 100) return jsonError("Missing exerciseId", 400);

  const result = await db().execute<{ local_date: string; best: number; unit: string }>(sql`
    select to_char(w.local_date, 'YYYY-MM-DD') as local_date, max(s.value) as best, max(s.unit) as unit
    from sets s join workouts w on w.id = s.workout_id
    where w.user_id = ${user.id} and s.exercise_id = ${exerciseId}
    group by w.id, w.local_date, w.finished_at
    order by w.local_date, w.finished_at
  `);
  const points = result.rows.map((r) => ({ date: r.local_date, best: Number(r.best) }));
  return NextResponse.json({
    unit: result.rows.at(-1)?.unit ?? "reps",
    points,
    best: points.length ? Math.max(...points.map((p) => p.best)) : null,
    sessions: points.length,
  });
}
