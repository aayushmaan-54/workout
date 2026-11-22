import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "@/lib/constants";
import { db } from "@/lib/db";
import { loginAttempts, users } from "@/lib/db/schema";

const body = z.object({ username: z.string().trim().min(1).max(50), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter your username and password.", 400);
  const { username, password } = parsed.data;
  const key = username.toLowerCase();

  const [attempt] = await db().select().from(loginAttempts).where(eq(loginAttempts.username, key)).limit(1);
  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    const mins = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 60_000);
    return jsonError(`Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`, 429);
  }

  const [user] = await db()
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = ${key}`)
    .limit(1);

  if (!user || user.password !== password) {
    const result = await db().execute<{ locked: boolean }>(sql`
      insert into login_attempts (username, failed_count, locked_until)
      values (${key}, 1, null)
      on conflict (username) do update set
        failed_count = case when login_attempts.failed_count + 1 >= ${MAX_FAILED_LOGINS} then 0 else login_attempts.failed_count + 1 end,
        locked_until = case when login_attempts.failed_count + 1 >= ${MAX_FAILED_LOGINS}
                            then now() + make_interval(mins => ${LOCK_MINUTES}) else null end
      returning locked_until is not null as locked
    `);
    if (result.rows[0]?.locked) {
      return jsonError(`Too many failed attempts. Login is blocked for ${LOCK_MINUTES} minutes.`, 429);
    }
    return jsonError("Wrong username or password.", 401);
  }

  await db().delete(loginAttempts).where(eq(loginAttempts.username, key));
  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token, expiresAt);
  return res;
}
