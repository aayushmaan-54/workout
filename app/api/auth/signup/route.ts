import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { USERNAME_RE, USERNAME_RULE } from "@/lib/constants";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const body = z.object({
  username: z.string().trim().regex(USERNAME_RE, USERNAME_RULE),
  password: z.string().min(4, "Password must be at least 4 characters.").max(200, "Password is too long."),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  const { username, password } = parsed.data;

  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
    .limit(1);
  if (existing.length) return jsonError("That username is taken.", 409);

  let userId: number;
  try {
    const [row] = await db().insert(users).values({ username, password }).returning({ id: users.id });
    userId = row.id;
  } catch {
    return jsonError("That username is taken.", 409);
  }

  const { token, expiresAt } = await createSession(userId);
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token, expiresAt);
  return res;
}
