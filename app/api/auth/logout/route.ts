import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await db().delete(sessions).where(eq(sessions.token, token));
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
