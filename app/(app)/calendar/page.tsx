import CalendarClient from "@/components/CalendarClient";
import { requireUser } from "@/lib/auth";
import { exercisesConfig, workoutColors } from "@/lib/exercises";
import { listWorkouts } from "@/lib/stats";

export const metadata = { title: "Calendar · Simple Workout" };

export default async function CalendarPage() {
  const user = await requireUser();
  const workouts = await listWorkouts(user.id);
  const names: Record<string, string> = {};
  for (const key of exercisesConfig.settings.rotation) names[key] = exercisesConfig.workouts[key].name;
  return (
    <CalendarClient
      workouts={workouts}
      colors={workoutColors()}
      legend={names}
      breakAfter={exercisesConfig.settings.streakBreaksAfterRestDays}
    />
  );
}
