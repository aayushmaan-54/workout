import { z } from "zod";

const id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids must be lowercase letters/numbers separated by dashes (e.g. \"pike-pushups\")");
const text = z.string().trim().min(1, "must not be empty");

const checklistItem = z.strictObject({ id, name: text, detail: text.optional() });

const exercise = z.strictObject({
  id,
  name: text,
  type: z.enum(["reps", "time"], { error: 'type must be "reps" or "time"' }),
  perSide: z.boolean().optional(),
  target: text.optional(),
  note: text.optional(),
});

const slot = z.strictObject({
  slot: text,
  options: z.array(exercise).min(1, "each slot needs at least one option"),
});

const workoutBase = {
  name: text,
  restSeconds: z.number().int().min(0).max(900),
  slots: z.array(slot).min(1, "a workout needs at least one slot"),
};

const workout = z.discriminatedUnion(
  "format",
  [
    z.strictObject({ ...workoutBase, format: z.literal("sets"), sets: z.number().int().min(1).max(20) }),
    z.strictObject({ ...workoutBase, format: z.literal("circuit"), rounds: z.number().int().min(1).max(20) }),
  ],
  { error: 'format must be "sets" (needs "sets") or "circuit" (needs "rounds")' },
);

export const exercisesFileSchema = z
  .strictObject({
    settings: z.strictObject({
      rotation: z.array(z.string()).min(1, "rotation needs at least one workout key"),
      streakBreaksAfterRestDays: z.number().int().min(0).max(30),
      defaultRepTarget: text,
      defaultTimeTarget: text,
    }),
    warmup: z.array(checklistItem),
    stretches: z.array(checklistItem),
    workouts: z.record(z.string().regex(/^[A-Za-z0-9_]+$/, "workout keys: letters, numbers, underscore"), workout),
  })
  .superRefine((file, ctx) => {
    file.settings.rotation.forEach((key, i) => {
      if (!file.workouts[key]) {
        ctx.addIssue({
          code: "custom",
          path: ["settings", "rotation", i],
          message: `rotation refers to "${key}" but there is no workouts.${key}`,
        });
      }
    });

    for (const listName of ["warmup", "stretches"] as const) {
      const seen = new Set<string>();
      file[listName].forEach((item, i) => {
        if (seen.has(item.id)) ctx.addIssue({ code: "custom", path: [listName, i, "id"], message: `duplicate id "${item.id}"` });
        seen.add(item.id);
      });
    }

    const byId = new Map<string, { name: string; type: string; where: string }>();
    for (const [key, w] of Object.entries(file.workouts)) {
      const slotNames = new Set<string>();
      w.slots.forEach((s, si) => {
        if (slotNames.has(s.slot)) {
          ctx.addIssue({ code: "custom", path: ["workouts", key, "slots", si, "slot"], message: `duplicate slot name "${s.slot}" in ${key}` });
        }
        slotNames.add(s.slot);
        s.options.forEach((ex, oi) => {
          const path = ["workouts", key, "slots", si, "options", oi, "id"];
          const prev = byId.get(ex.id);
          const where = `workouts.${key} → ${s.slot}`;
          if (prev && (prev.name !== ex.name || prev.type !== ex.type)) {
            ctx.addIssue({
              code: "custom",
              path,
              message: `exercise id "${ex.id}" is used for different exercises ("${prev.name}" in ${prev.where} and "${ex.name}" in ${where}). Ids must be unique.`,
            });
          } else if (prev && prev.where === where) {
            ctx.addIssue({ code: "custom", path, message: `exercise id "${ex.id}" appears twice in ${where}` });
          }
          if (!prev) byId.set(ex.id, { name: ex.name, type: ex.type, where });
        });
      });
    }
  });

export type ExercisesFile = z.infer<typeof exercisesFileSchema>;
export type WorkoutDef = ExercisesFile["workouts"][string];

/** Parses the exercises file; throws an Error with a readable message on failure. */
export function parseExercisesFile(raw: unknown): ExercisesFile {
  const result = exercisesFileSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`data/exercises.json is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
