import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "./auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** For API routes: returns the user, or a 401 response. */
export async function apiUser(): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  return user ?? jsonError("Not logged in", 401);
}
