import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseExercisesFile } from "../lib/exercises-schema";

const file = join(process.cwd(), "data", "exercises.json");

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, "utf8"));
} catch (err) {
  console.error(`\n✖ data/exercises.json is not valid JSON:\n  ${(err as Error).message}\n`);
  process.exit(1);
}

try {
  const parsed = parseExercisesFile(raw);
  const count = Object.values(parsed.workouts).reduce(
    (n, w) => n + w.slots.reduce((m, s) => m + s.options.length, 0),
    0,
  );
  console.log(`✓ data/exercises.json is valid (${Object.keys(parsed.workouts).length} workouts, ${count} exercise options)`);
} catch (err) {
  console.error(`\n✖ ${(err as Error).message}\n`);
  process.exit(1);
}
