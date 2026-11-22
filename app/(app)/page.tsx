import TodayClient from "@/components/TodayClient";
import { requireUser } from "@/lib/auth";
import { exercisesConfig, workoutColors } from "@/lib/exercises";
import { getNextWorkout } from "@/lib/rotation";
import { listWorkoutDates } from "@/lib/stats";

export default async function TodayPage() {
  const user = await requireUser();
  const [next, dates] = await Promise.all([getNextWorkout(user.id), listWorkoutDates(user.id)]);
  return (
    <TodayClient
      userId={user.id}
      username={user.username}
      next={next}
      dates={dates}
      breakAfter={exercisesConfig.settings.streakBreaksAfterRestDays}
      color={workoutColors()[next.key]}
    />
  );
}
