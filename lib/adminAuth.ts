import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  computeAdminSessionToken,
  isValidAdminSecret,
  isValidAdminSessionCookie,
} from "@/lib/adminAuthToken";

// Server-only wrapper around lib/adminAuthToken.ts's pure token logic,
// using the App Router `cookies()` API (next/headers) — for use in Server
// Components and Server Actions, NOT proxy.ts (which uses NextRequest's
// own separate `request.cookies` API instead; see proxy.ts's own imports
// straight from adminAuthToken.ts for why the split exists).
//
// A full-codebase search before building this confirmed there was no
// existing auth/middleware/admin-route infrastructure anywhere in this
// project — this is genuinely new, not a gap in an existing system.

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET is not set — required to protect /admin routes. Add it to .env (see .env.example).",
    );
  }
  return secret;
}

export function checkAdminSecret(candidate: string): boolean {
  return isValidAdminSecret(candidate, getAdminSecret());
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, computeAdminSessionToken(getAdminSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, getAdminSecret());
}

/**
 * Throws if there's no valid admin session — call at the top of every
 * admin Server Action before touching the database. proxy.ts's own gate is
 * an OPTIMISTIC check only (cookie presence/validity, no per-request work);
 * this is the authoritative one, matching this project's own copy of the
 * standard Next.js guidance (node_modules/next/dist/docs/01-app/02-guides/
 * authentication.md) that a Proxy matcher mistake or refactor must never
 * be the only thing standing between a mutation and the outside world.
 */
export async function requireAdminSession(): Promise<void> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Not authenticated — please log in at /admin/login before retrying.");
  }
}
