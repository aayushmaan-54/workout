import type { ActiveWorkout, FinishedWorkoutPayload } from "../types";

const activeKey = (userId: number) => `sw:active:${userId}`;
const pendingKey = (userId: number) => `sw:pending:${userId}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export const loadActive = (userId: number) => {
  const w = read<ActiveWorkout>(activeKey(userId));
  return w && w.version === 1 ? w : null;
};
export const saveActive = (userId: number, w: ActiveWorkout | null) => write(activeKey(userId), w);

export const loadPending = (userId: number) => read<FinishedWorkoutPayload[]>(pendingKey(userId)) ?? [];
export const savePending = (userId: number, list: FinishedWorkoutPayload[]) =>
  write(pendingKey(userId), list.length ? list : null);

export function addPending(userId: number, w: FinishedWorkoutPayload) {
  const list = loadPending(userId).filter((p) => p.id !== w.id);
  savePending(userId, [...list, w]);
}
