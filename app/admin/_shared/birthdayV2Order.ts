import type { SiteData } from "@/types/site";

// Shared between app/admin/new-order/birthday-v2/actions.ts (create) and
// app/admin/orders/[slug]/edit/actions.ts (edit) — same split as every
// other template's own *Order.ts file.
//
// Phase 1 (entrance sequence) + Phase 5a (photos, for the Phase 5 gallery
// — sphere or grid fallback depending on count, see
// interactive/ArcadeHub.tsx once Phase 5c wires it in) fields live here.
// Do not add fields for the main hub or mini-games until those phases are
// actually built — see this file's own handling of `title` below for how
// the DB's other required-but-unused-yet columns are dealt with instead of
// front-loading speculative future-phase fields.
//
// The Order table's `title`, `message`, `specialDate`, and `photos` columns
// are all NOT NULL (see prisma/schema.prisma), regardless of which phase a
// template is in:
//   - `specialDate` (the birthdate) is genuine baseline order metadata, not
//     a future-phase feature, so it's collected here like every other
//     template's own admin form.
//   - `title` is collected too, but deliberately labeled "not shown yet" in
//     the form below — same as Birthday V1's own "Room title", it's
//     reserved for the future main hub's own heading, just not rendered by
//     anything yet.
//   - `message` has no admin-facing field of its own here — Phase 1 has
//     exactly one meaningful piece of text (the entrance-sequence message),
//     so the server-side build function below fills this required column
//     with the same trimmed value as `birthdayV2Message` rather than asking
//     for two near-identical messages in one form. A later phase is free to
//     repurpose `message` for something else without touching this
//     duplication, since nothing downstream of this file depends on the two
//     staying in sync.
//   - `photos` now has a real admin-facing field (Phase 5a) — same dynamic
//     add/remove list shape every other template's own gallery field
//     already uses (birthdayV1Order.ts's own `photos`, Anniversary
//     V1/V2's). No minimum tied to the Phase 5 sphere-vs-grid threshold
//     (6+) — that's a display concern for whichever component renders the
//     gallery, not a data-collection requirement; the floor here is the
//     same "at least 1" every other template's own photo gallery enforces.

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface BirthdayV2OrderInput {
  /** The birthday person's name — matches Birthday V1's own single-honoree
   *  pattern (birthdayV1Order.ts's own `name` field), not Anniversary's
   *  people[] list. Confirmed with the person: a birthday page is about one
   *  named honoree, same reasoning hero/BirthdayGate.tsx's own doc comment
   *  already gives for V1 ("a birthday page is inherently about ONE named
   *  person, unlike an Anniversary page"). Becomes a fixed 1-entry
   *  `people: [{ name }]` array below, same as birthdayV1Order.ts does, so
   *  SiteData itself doesn't need a template-specific shape. */
  name: string;
  /** Not yet shown anywhere — reserved for the main hub's own heading
   *  (Phase 2). Still required today: prisma/schema.prisma's Order.title
   *  column is NOT NULL regardless of template phase. */
  title: string;
  /** The birthdate. yyyy-mm-dd, from an <input type="date">. */
  specialDate: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  /** hero/CountdownReveal.tsx's own entrance-sequence message — the only
   *  customizable text in Phase 1. Becomes both SiteData.birthdayV2Message
   *  and (see this file's own top comment) the required Order.message
   *  column. */
  message: string;
  /** At least 1 — the Phase 5 gallery's full array (a sphere gallery at 6+
   *  photos, a plain grid fallback below that — see
   *  interactive/ArcadeHub.tsx once Phase 5c wires it in). Same shape as
   *  every other template's own photo gallery field. */
  photos: { src: string; caption: string }[];
  /** How many times each photo repeats around
   *  interactive/PhotoSphereGallery.tsx's own sphere (node count =
   *  `photos.length * multiplier`) — lets a sparse 6-photo order fill the
   *  sphere out (e.g. x3 = 18 nodes) without a 15-photo order also getting
   *  multiplied into an overcrowded 45. String form value (like `age` on
   *  birthdayV1Order.ts) — blank means "auto-calculate a sensible
   *  multiplier from the photo count," which is genuinely different from
   *  0 or 1, so this can't just default to a number here. Optional,
   *  clamped to [1, 5] when a value IS entered — see
   *  `validateBirthdayV2OrderInput` below. */
  galleryRepeatMultiplier: string;
}

export function emptyBirthdayV2Photo(): { src: string; caption: string } {
  return { src: "", caption: "" };
}

/** Blank defaults for the create form. `photoCount` is a starting point
 *  only, not an enforced count — the gallery is a dynamic add/remove list,
 *  same convention every other template's own empty*FormValues uses. */
export function emptyBirthdayV2FormValues(photoCount: number): BirthdayV2OrderInput {
  return {
    name: "",
    title: "",
    specialDate: "",
    slug: "",
    customerName: "",
    customerEmail: "",
    message: "",
    photos: Array.from({ length: photoCount }, emptyBirthdayV2Photo),
    galleryRepeatMultiplier: "",
  };
}

/**
 * Server-side re-validation shared by create and edit — returns the first
 * error message found, or null if the input is valid. Deliberately does NOT
 * check slug uniqueness (matches every other *Order.ts file's own note).
 */
export function validateBirthdayV2OrderInput(input: BirthdayV2OrderInput): string | null {
  const slug = input.slug.trim();
  if (!SLUG_PATTERN.test(slug)) return "Invalid slug format.";
  if (!input.name.trim()) return "The birthday person's name is required.";
  if (!input.title.trim()) return "Title is required.";
  if (!input.specialDate || Number.isNaN(Date.parse(input.specialDate))) {
    return "A valid special date is required.";
  }
  if (!input.customerName.trim()) return "Customer name is required.";
  if (!input.message.trim()) return "A personal message is required.";
  if (input.photos.length < 1 || input.photos.some((p) => !p.src.trim())) {
    return "At least 1 gallery photo (with a URL) is required.";
  }
  for (const photo of input.photos) {
    if (photo.src.trim() && !isUrl(photo.src)) {
      return "Every photo URL must start with http:// or https://.";
    }
  }
  if (input.galleryRepeatMultiplier.trim()) {
    const n = Number(input.galleryRepeatMultiplier);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return "Gallery photo repeat must be a whole number between 1 and 5, or left blank.";
    }
  }
  return null;
}

/** Builds the SiteData shape shared by create and edit — pass the result to
 *  lib/orderMapper.ts's `siteDataToOrderFields` for the actual Prisma
 *  create/update `data`. */
export function buildBirthdayV2SiteData(input: BirthdayV2OrderInput): SiteData {
  const message = input.message.trim();
  const galleryRepeatMultiplier = input.galleryRepeatMultiplier.trim()
    ? Number(input.galleryRepeatMultiplier)
    : undefined;

  return {
    people: [{ name: input.name.trim() }],
    title: input.title.trim(),
    // See this file's own top comment for why `message` is filled from the
    // same value as birthdayV2Message rather than a separate form field.
    message,
    specialDate: new Date(input.specialDate).toISOString(),
    photos: input.photos.map((p) => ({ src: p.src.trim(), caption: p.caption.trim() || undefined })),
    birthdayV2Message: message,
    galleryRepeatMultiplier,
  };
}
