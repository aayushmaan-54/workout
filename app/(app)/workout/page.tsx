import WorkoutClient from "@/components/workout/WorkoutClient";
import { requireUser } from "@/lib/auth";
import { allExercises, slotOptions, stretches, warmup } from "@/lib/exercises";
import { getNextWorkout } from "@/lib/rotation";
import { getExerciseStats } from "@/lib/stats";

export const metadata = { title: "Workout · Simple Workout" };

export default async function WorkoutPage() {
  const user = await requireUser();
  const [next, stats] = await Promise.all([getNextWorkout(user.id), getExerciseStats(user.id)]);
  return (
    <WorkoutClient
      userId={user.id}
      next={next}
      stats={stats}
      warmup={warmup}
      stretches={stretches}
      allExercises={allExercises()}
      slotOptions={slotOptions()}
    />
  );
}
