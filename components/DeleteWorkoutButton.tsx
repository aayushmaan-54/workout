"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteWorkoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.replace("/calendar");
      router.refresh();
    } catch {
      setError("Couldn't delete. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button className="btn-ghost w-full text-red-600 dark:text-red-400" onClick={() => setConfirming(true)}>
        Delete this workout
      </button>
    );
  }
  return (
    <div className="card space-y-3 border-red-500/40">
      <p className="font-semibold">Delete this workout and all its sets?</p>
      <p className="text-sm text-zinc-500">This can&apos;t be undone. It won&apos;t change your rotation.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>
          Cancel
        </button>
        <button className="btn-danger" onClick={remove} disabled={busy}>
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
