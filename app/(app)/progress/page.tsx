import ProgressClient from "@/components/ProgressClient";
import { requireUser } from "@/lib/auth";
import { allExercises } from "@/lib/exercises";
import { listLoggedExercises } from "@/lib/stats";

export const metadata = { title: "Progress · Simple Workout" };

export default async function ProgressPage() {
  const user = await requireUser();
  const logged = await listLoggedExercises(user.id);
  const inFile = new Map(allExercises().map((e) => [e.id, e.name]));
  const options = logged
    .map((e) => ({ id: e.id, name: inFile.get(e.id) ?? e.name, unit: e.unit, removed: !inFile.has(e.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return <ProgressClient options={options} />;
}
