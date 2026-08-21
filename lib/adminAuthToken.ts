import { createHmac, timingSafeEqual } from "node:crypto";

// Pure token logic — deliberately zero Next.js-specific imports (no
// `next/headers`, no `next/server`) so this same file can be imported from
// BOTH proxy.ts (which only has NextRequest's own `request.cookies` API,
// not the App-Router `cookies()` function from `next/headers`) and from
// Server Actions/Server Components (via lib/adminAuth.ts's own thin
// wrapper below, which DOES use `next/headers`). Splitting it this way
// avoids duplicating the actual HMAC/comparison logic in two places that
// would need to stay in sync.

export const ADMIN_SESSION_COOKIE = "vowx_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so that check happens first — the length check itself isn't
  // timing-sensitive here (knowing a string's length isn't a meaningful
  // leak for this use case, unlike the byte-by-byte content comparison
  // timingSafeEqual protects below).
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Deterministic session token: HMAC-SHA256 of a fixed label, keyed by the
 * caller-supplied secret (ADMIN_SECRET). Not a full auth system — no
 * per-user identity, no expiry baked into the token itself — a basic
 * shared-secret gate for this internal admin tool, per this project's own
 * explicit scope for it ("sufficient for now, not a full auth system").
 * Deterministic on purpose: anyone who enters the correct secret once
 * derives the exact same token, so there's no server-side session store to
 * manage — the session cookie's own Max-Age (ADMIN_SESSION_MAX_AGE_SECONDS)
 * is what bounds how long a login lasts, not the token's own content.
 */
export function computeAdminSessionToken(secret: string): string {
  return createHmac("sha256", secret).update("vowx-admin-session").digest("hex");
}

export function isValidAdminSecret(candidate: string, secret: string): boolean {
  return timingSafeStringEqual(candidate, secret);
}

export function isValidAdminSessionCookie(cookieValue: string | undefined, secret: string): boolean {
  if (!cookieValue) return false;
  return timingSafeStringEqual(cookieValue, computeAdminSessionToken(secret));
}
