import type { SiteData } from "@/types/site";

// Shared between app/admin/new-order/anniversary-v1/actions.ts (create) and
// app/admin/orders/[slug]/edit/actions.ts (edit) — same shape/pattern as
// birthdayV1Order.ts's own split, but for Anniversary V1's own, genuinely
// different field set (confirmed by reading every component
// templates/AnniversaryV1.tsx renders, not assumed from Birthday's shape):
// a `people[]` list instead of a single name (Anniversary supports couples/
// groups via lib/people.ts#formatPeopleHeading), no age/cake/balloon/gift
// custom-data block at all (Anniversary V1 needs nothing beyond SiteData's
// own generic fields plus one flat `closingLine` — there is no
// AnniversaryV1CustomData type), and an optional milestones list instead.

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface AnniversaryV1OrderInput {
  /** At least 1 — lib/people.ts#formatPeopleHeading formats 1 as "For X", 2
   *  as "X & Y", 3+ as "X, Y & Z". */
  people: { name: string }[];
  /** Overrides the computed heading above entirely when set (e.g. "The
   *  Smith Family") — same field every V1 heading-bearing section reads. */
  groupTitle: string;
  /** Italic subtitle under the names on hero/SunsetHero.tsx, e.g. "3 Years
   *  of Us". */
  title: string;
  /** yyyy-mm-dd, from an <input type="date">. */
  specialDate: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  songUrl: string;
  songTitle: string;
  /** message/SealedLetter.tsx's own letter text. */
  message: string;
  /** At least 1 — the SunlitPolaroids gallery's full array. No longer tied
   *  to ambient/GoldenSkySection.tsx's own accent photo (see
   *  goldenSkyPhoto below) — that used to be photos[0], coupling the two;
   *  they're now fully independent fields. */
  photos: { src: string; caption: string }[];
  /** Optional — timeline/SunsetTimeline.tsx. Empty list is valid (that
   *  section simply doesn't render). Each entry's `photo` is optional too —
   *  `SiteData["milestones"][number].photo` and
   *  timeline/SunsetTimeline.tsx's own MilestoneCard already supported this
   *  (see that component's own doc comment confirming `photo` is a real,
   *  already-typed field), the admin form just didn't expose it until now. */
  milestones: { date: string; title: string; description: string; photo: string }[];
  /** interactive/PetalOracle.tsx's own reveal-card text (SiteData.secretNote
   *  under the hood) — optional, that component already falls back to its
   *  own DEFAULT_REVEAL_MESSAGE when unset. */
  revealMessage: string;
  /** closing/SunsetSignature.tsx's own italic line above the closing names
   *  — optional, only rendered when present. Rides inside
   *  SiteData.customData.closingLine (a flat key, not nested under any
   *  "anniversary" key — there is no such namespace). */
  closingLine: string;
  /** ambient/GoldenSkySection.tsx's own previously-hardcoded caption/
   *  love-note copy — optional, each falls back to that component's own
   *  default string when left blank. Same customData.<flatKey> shape as
   *  closingLine (see types/site.ts's own doc comment on these two
   *  fields). */
  goldenSkyCaption: string;
  goldenSkyLoveNote: string;
  /** ambient/GoldenSkySection.tsx's own standalone accent photo — a single
   *  URL, optional. When blank, that section's accent-photo slot simply
   *  doesn't render (no fallback to photos[0] — see this field's own doc
   *  comment in types/site.ts for why that fallback was removed). */
  goldenSkyPhoto: string;
}

/**
 * Server-side re-validation shared by create and edit — returns the first
 * error message found, or null if the input is valid. Deliberately does NOT
 * check slug uniqueness (matches birthdayV1Order.ts's own file-level note).
 */
export function validateAnniversaryV1OrderInput(input: AnniversaryV1OrderInput): string | null {
  const slug = input.slug.trim();
  if (!SLUG_PATTERN.test(slug)) return "Invalid slug format.";
  if (input.people.length < 1 || input.people.some((p) => !p.name.trim())) {
    return "At least 1 person (with a name) is required.";
  }
  if (!input.specialDate || Number.isNaN(Date.parse(input.specialDate))) {
    return "A valid special date is required.";
  }
  if (!input.title.trim()) return "Title is required.";
  if (!input.customerName.trim()) return "Customer name is required.";
  if (input.songUrl.trim() && !isUrl(input.songUrl)) {
    return "Song URL must start with http:// or https://.";
  }
  if (!input.message.trim()) return "Message is required.";
  if (input.photos.length < 1 || input.photos.some((p) => !p.src.trim())) {
    return "At least 1 photo (with a URL) is required.";
  }
  if (input.goldenSkyPhoto.trim() && !isUrl(input.goldenSkyPhoto)) {
    return "The opening-section photo URL must start with http:// or https://.";
  }
  for (const milestone of input.milestones) {
    if (!milestone.date.trim() || !milestone.title.trim()) {
      return "Every milestone needs a date and a title.";
    }
    if (milestone.photo.trim() && !isUrl(milestone.photo)) {
      return "A milestone photo URL must start with http:// or https://.";
    }
  }
  return null;
}

/** Builds the SiteData shape shared by create and edit — pass the result to
 *  lib/orderMapper.ts's `siteDataToOrderFields` for the actual Prisma
 *  create/update `data`. */
export function buildAnniversaryV1SiteData(input: AnniversaryV1OrderInput): SiteData {
  // No `songs` array at all when songUrl is blank — never an empty array —
  // same reasoning birthdayV1Order.ts's own buildBirthdayV1SiteData
  // documents for interactive/BirthdaySongPlayer.tsx's `songs?.[0]`
  // sourcing, here for audio/V1SongPlayer.tsx's identical optional-song
  // degradation.
  const songUrl = input.songUrl.trim();
  const songs: SiteData["songs"] = songUrl
    ? [{ url: songUrl, title: input.songTitle.trim() || "Our Song" }]
    : undefined;

  const milestones: SiteData["milestones"] =
    input.milestones.length > 0
      ? input.milestones.map((m) => ({
          date: m.date.trim(),
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          photo: m.photo.trim() || undefined,
        }))
      : undefined;

  return {
    people: input.people.map((p) => ({ name: p.name.trim() })),
    groupTitle: input.groupTitle.trim() || undefined,
    title: input.title.trim(),
    message: input.message.trim(),
    specialDate: new Date(input.specialDate).toISOString(),
    photos: input.photos.map((p) => ({ src: p.src.trim(), caption: p.caption.trim() || undefined })),
    milestones,
    secretNote: input.revealMessage.trim() || undefined,
    closingLine: input.closingLine.trim() || undefined,
    goldenSkyCaption: input.goldenSkyCaption.trim() || undefined,
    goldenSkyLoveNote: input.goldenSkyLoveNote.trim() || undefined,
    goldenSkyPhoto: input.goldenSkyPhoto.trim() || undefined,
    songs,
  };
}
