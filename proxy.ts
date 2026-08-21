import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, isValidAdminSessionCookie } from "@/lib/adminAuthToken";

// Gates every /admin/* route behind a shared-secret session cookie (see
// lib/adminAuthToken.ts / lib/adminAuth.ts). A full-codebase search before
// building this confirmed there was no existing auth/middleware/admin-route
// infrastructure anywhere in this project — this is genuinely new, not a
// gap in an existing system. Deliberately basic (a single shared
// ADMIN_SECRET, no per-user accounts, no role system) per this task's own
// explicit scope for it: "sufficient for now, not a full auth system."
//
// Named `proxy.ts`, not `middleware.ts` — this project's own copy of the
// Next.js docs (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/proxy.md) confirms `middleware` was renamed to
// `proxy` in this version; there is no middleware.md in these docs at all,
// only proxy.md, which is what first surfaced the rename.
//
// This is an OPTIMISTIC check only (cookie presence/validity against the
// same HMAC token lib/adminAuth.ts's own createAdminSession sets — no
// database round-trip) — exactly the "Proxy alone is not your only line of
// defense" guidance this project's own node_modules/next/dist/docs/01-app/
// 02-guides/authentication.md documents. Every admin Server Action also
// calls requireAdminSession() itself (lib/adminAuth.ts) before touching
// the database, so a matcher mistake or a future refactor that moves a
// Server Action to an unprotected path can't silently become a real
// security hole.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;
  // Fails CLOSED (redirects to login) if ADMIN_SECRET itself is unset,
  // rather than silently letting every request through — an unset secret
  // is a deploy misconfiguration, not a reason to leave /admin/* open.
  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = Boolean(secret) && isValidAdminSessionCookie(cookieValue, secret ?? "");

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
