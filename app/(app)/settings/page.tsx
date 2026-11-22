import SettingsClient from "@/components/SettingsClient";
import { requireUser } from "@/lib/auth";
import { exercisesConfig } from "@/lib/exercises";
import { getNextWorkout } from "@/lib/rotation";

export const metadata = { title: "Settings · Simple Workout" };

export default async function SettingsPage() {
  const user = await requireUser();
  const next = await getNextWorkout(user.id);
  const { settings, workouts } = exercisesConfig;
  return (
    <SettingsClient
      userId={user.id}
      username={user.username}
      rotation={settings.rotation.map((k) => ({ key: k, name: workouts[k].name, isNext: k === next.key }))}
      breakAfter={settings.streakBreaksAfterRestDays}
    />
  );
}
