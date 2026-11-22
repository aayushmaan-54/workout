export type ExerciseType = "reps" | "time";
export type Unit = "reps" | "seconds";

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  perSide?: boolean;
  target?: string;
  note?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  detail?: string;
}

export interface PlannedExercise {
  slot: string;
  exercise: Exercise;
  skipped: boolean;
}

export interface NextWorkout {
  key: string;
  name: string;
  format: "sets" | "circuit";
  /** sets per exercise (sets format) or number of rounds (circuit) */
  total: number;
  restSeconds: number;
  /** slot name → option index used for this session */
  plan: Record<string, number>;
  exercises: { slot: string; exercise: Exercise }[];
}

export interface LoggedSet {
  exerciseId: string;
  exerciseName: string;
  slot: string;
  setNumber: number;
  value: number;
  unit: Unit;
}

export interface ExerciseStat {
  best: number | null;
  last: number[];
}

export interface PR {
  exerciseId: string;
  exerciseName: string;
  value: number;
  unit: Unit;
}

export interface ActiveWorkout {
  version: 1;
  id: string;
  workoutKey: string;
  workoutName: string;
  format: "sets" | "circuit";
  total: number;
  restSeconds: number;
  startedAt: string;
  localDate: string;
  plan: Record<string, number>;
  exercises: PlannedExercise[];
  phase: "warmup" | "main" | "rest" | "stretch";
  step: number;
  restEndsAt: number | null;
  warmupDone: string[];
  stretchDone: string[];
  sets: LoggedSet[];
  prs: PR[];
}

export interface FinishedWorkoutPayload {
  id: string;
  workoutKey: string;
  workoutName: string;
  localDate: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  plan: Record<string, number>;
  sets: LoggedSet[];
}

export interface WorkoutSummary {
  id: string;
  workoutKey: string;
  workoutName: string;
  localDate: string;
  startedAt: string;
  durationSeconds: number;
}

export const unitFor = (type: ExerciseType): Unit => (type === "time" ? "seconds" : "reps");
