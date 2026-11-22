import { loadPending, savePending } from "./storage";

/** Try to upload every locally-saved finished workout. Returns how many are still unsynced. */
export async function syncPending(userId: number): Promise<number> {
  const pending = loadPending(userId);
  const remaining = [];
  for (const w of pending) {
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(w),
      });
      // 400 = permanently invalid; drop it so it doesn't block forever.
      if (!res.ok && res.status !== 400) remaining.push(w);
    } catch {
      remaining.push(w);
    }
  }
  // Keep anything added while we were syncing.
  const latest = loadPending(userId).filter((p) => !pending.some((q) => q.id === p.id));
  savePending(userId, [...remaining, ...latest]);
  return remaining.length + latest.length;
}
