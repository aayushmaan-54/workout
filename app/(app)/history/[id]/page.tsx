import { groupBy } from "@/lib/group";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteWorkoutButton from "@/components/DeleteWorkoutButton";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDuration } from "@/lib/dates";
import { db } from "@/lib/db";
import { sets, workouts } from "@/lib/db/schema";
import { workoutColors } from "@/lib/exercises";

export const metadata = { title: "Workout · Simple Workout" };

export default async function HistoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [w] = await db()
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
    .limit(1);
  if (!w) notFound();
  const rows = await db().select().from(sets).where(eq(sets.workoutId, w.id)).orderBy(asc(sets.id));
  const groups = [...groupBy(rows, (s) => `${s.slot}|${s.exerciseId}`).values()];
  const color = workoutColors()[w.workoutKey] ?? "#a1a1aa";

  return (
    <main className="space-y-4 animate-fade-in">
      <Link href="/calendar#history" className="btn-ghost -ml-3 px-3">
        ‹ History
      </Link>
      <header>
        <h1 className="text-3xl font-bold" style={{ color }}>
          {w.workoutName}
        </h1>
        <p className="text-zinc-500">
          {formatDate(w.localDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} ·{" "}
          {formatDuration(w.durationSeconds)}
        </p>
      </header>

      <section className="space-y-2">
        {groups.map((list) => (
          <div key={`${list[0].slot}|${list[0].exerciseId}`} className="card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{list[0].exerciseName}</h2>
              <span className="label">{list[0].slot}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map((s) => (
                <span key={s.id} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm tabular-nums dark:bg-zinc-800">
                  <span className="text-zinc-500">#{s.setNumber}</span>{" "}
                  <span className="font-semibold">
                    {s.value} {s.unit === "seconds" ? "sec" : "reps"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="card text-zinc-500">No sets were logged in this workout.</p>}
      </section>

      <DeleteWorkoutButton id={w.id} />
    </main>
  );
}
