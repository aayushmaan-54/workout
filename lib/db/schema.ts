import { sql } from "drizzle-orm";
import { date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    username: text("username").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_lower_idx").on(sql`lower(${t.username})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Keyed by lowercased username. */
export const loginAttempts = pgTable("login_attempts", {
  username: text("username").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workoutKey: text("workout_key").notNull(),
    workoutName: text("workout_name").notNull(),
    localDate: date("local_date", { mode: "string" }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
  },
  (t) => [index("workouts_user_date_idx").on(t.userId, t.localDate)],
);

export const sets = pgTable(
  "sets",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    exerciseName: text("exercise_name").notNull(),
    slot: text("slot").notNull(),
    setNumber: integer("set_number").notNull(),
    value: integer("value").notNull(),
    unit: text("unit").$type<"reps" | "seconds">().notNull(),
  },
  (t) => [index("sets_workout_idx").on(t.workoutId), index("sets_exercise_idx").on(t.exerciseId)],
);

export const rotationState = pgTable("rotation_state", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  nextWorkoutIndex: integer("next_workout_index").notNull().default(0),
  slotIndexes: jsonb("slot_indexes").$type<Record<string, Record<string, number>>>().notNull().default({}),
});
