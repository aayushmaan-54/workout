import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { workouts } from "@/lib/db/schema";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError("Not found", 404);
  const deleted = await db()
    .delete(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
    .returning({ id: workouts.id });
  if (!deleted.length) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
}
