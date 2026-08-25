import type { SiteData } from "@/types/site";

// Shared between app/admin/new-order/anniversary-v2/actions.ts (create) and
// app/admin/orders/[slug]/edit/actions.ts (edit) — same shape/pattern as
// anniversaryV1Order.ts's own split, but for Anniversary V2's own,
// genuinely different field set (confirmed by reading every component
// templates/AnniversaryV2.tsx renders, not assumed from V1's shape): a
// required hero video (V2's own hero/CinematicVideo.tsx only renders at
// all when a videos[] entry with role "hero" exists — V1 has no video
// concept whatsoever), two dedicated reveal photos + a dedicated reveal
// message for interactive/ConstellationGame.tsx and
// interactive/ShootingStarWish.tsx, a places[] list (interactive map pins,
// V1 has no equivalent), and typedPhrases[] (V1 has no equivalent either).
// No AnniversaryV2CustomData type exists — same as V1, this needs nothing
// beyond SiteData's own generic fields plus a handful of flat customData
// keys for fields with no dedicated Order column.

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface AnniversaryV2OrderInput {
  /** At least 1 — lib/people.ts#formatPeopleHeading formats 1 as "For X", 2
   *  as "X & Y", 3+ as "X, Y & Z". */
  people: { name: string }[];
  /** Overrides the computed heading above entirely when set. */
  groupTitle: string;
  /** Italic tagline under the animated name on hero/CinematicVideo.tsx. */
  title: string;
  /** yyyy-mm-dd, from an <input type="date">. */
  specialDate: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  /** Functionally required, not just type-optional: hero/CinematicVideo.tsx
   *  only renders at all when `videos.find(v => v.role === "hero")` finds
   *  something — with no hero video, V2's entire opening section is simply
   *  absent (the page starts at the countdown instead). Becomes
   *  `videos: [{ src, role: "hero" }]` — V2's own template never reads any
   *  other video role, so there's no need for a dynamic multi-video list. */
  heroVideoUrl: string;
  songUrl: string;
  songTitle: string;
  /** message/LetterCard.tsx's own letter text. */
  message: string;
  /** At least 1 — the gallery/Magazine.tsx gallery's full array. Entry 0 is
   *  ALSO reused as hero/CinematicVideo.tsx's own poster frame — unlike
   *  V1's old goldenSkyPhoto coupling, this one IS a deliberate, documented
   *  exception (types/site.ts's own doc comment on `photos`): an
   *  always-visible poster, not a hidden reveal, so reusing a
   *  representative gallery photo is intentional here. */
  photos: { src: string; caption: string }[];
  /** interactive/ConstellationGame.tsx's own reveal-card photo — a
   *  dedicated field, independent of photos[]. Optional. */
  constellationRevealPhoto: string;
  /** interactive/ShootingStarWish.tsx's own reveal-card photo (via
   *  ambient/NightSky.tsx's wishPhotoUrl prop) — a dedicated field,
   *  independent of photos[]. Optional. */
  shootingStarWishPhoto: string;
  /** interactive/ShootingStarWish.tsx's own reveal-card text — a real prop
   *  on that component that nothing ever actually fed a value through
   *  before now (see this field's own doc comment in types/site.ts).
   *  Optional, falls back to that component's own default line. */
  shootingStarWishMessage: string;
  /** Optional — timeline/VerticalLine.tsx. Empty list is valid. Same shape
   *  (date, title, description?, photo?) as V1's own milestones. */
  milestones: { date: string; title: string; description: string; photo: string }[];
  /** Optional — places/PlacesWeveBeen.tsx's own route-line map pins. `x`/`y`
   *  are percentage positions (0-100) on that component's own abstract
   *  spline canvas, not a real map image — plain numbers with no visual
   *  preview available in this admin tool. `caption` is required per
   *  SiteData["places"][number]'s own type (not optional like `photo`). */
  places: { name: string; caption: string; x: string; y: string; photo: string }[];
  /** Optional — message/TypedPhrases.tsx's own rotating typewriter list.
   *  Empty list is valid (that component no-ops with nothing to type). */
  typedPhrases: string[];
  /** interactive/LoveNote.tsx's own reveal text AND
   *  interactive/ConstellationGame.tsx's own revealMessage — the same
   *  field deliberately feeds both (unlike shootingStarWishMessage above,
   *  which was deliberately kept separate). Optional; LoveNote.tsx hides
   *  itself entirely when unset, ConstellationGame.tsx falls back to its
   *  own default line. */
  secretNote: string;
  /** closing/Signature.tsx's own italic line above the closing names —
   *  optional, only rendered when present. */
  closingLine: string;
  /** ambient/NightSky.tsx's own previously-hardcoded caption line —
   *  optional, falls back to that component's own default when left
   *  blank. */
  nightSkyCaption: string;
}

/**
 * Server-side re-validation shared by create and edit — returns the first
 * error message found, or null if the input is valid. Deliberately does NOT
 * check slug uniqueness (matches anniversaryV1Order.ts's own file-level note).
 */
export function validateAnniversaryV2OrderInput(input: AnniversaryV2OrderInput): string | null {
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
  if (!input.heroVideoUrl.trim() || !isUrl(input.heroVideoUrl)) {
    return "A hero video URL (starting with http:// or https://) is required.";
  }
  if (input.songUrl.trim() && !isUrl(input.songUrl)) {
    return "Song URL must start with http:// or https://.";
  }
  if (!input.message.trim()) return "Message is required.";
  if (input.photos.length < 1 || input.photos.some((p) => !p.src.trim())) {
    return "At least 1 photo (with a URL) is required.";
  }
  if (input.constellationRevealPhoto.trim() && !isUrl(input.constellationRevealPhoto)) {
    return "The constellation reveal photo URL must start with http:// or https://.";
  }
  if (input.shootingStarWishPhoto.trim() && !isUrl(input.shootingStarWishPhoto)) {
    return "The shooting-star wish photo URL must start with http:// or https://.";
  }
  for (const milestone of input.milestones) {
    if (!milestone.date.trim() || !milestone.title.trim()) {
      return "Every milestone needs a date and a title.";
    }
    if (milestone.photo.trim() && !isUrl(milestone.photo)) {
      return "A milestone photo URL must start with http:// or https://.";
    }
  }
  for (const place of input.places) {
    if (!place.name.trim() || !place.caption.trim()) {
      return "Every place needs a name and a caption.";
    }
    const x = Number(place.x);
    const y = Number(place.y);
    if (place.x.trim() === "" || Number.isNaN(x) || x < 0 || x > 100) {
      return "Every place needs an X position between 0 and 100.";
    }
    if (place.y.trim() === "" || Number.isNaN(y) || y < 0 || y > 100) {
      return "Every place needs a Y position between 0 and 100.";
    }
    if (place.photo.trim() && !isUrl(place.photo)) {
      return "A place photo URL must start with http:// or https://.";
    }
  }
  return null;
}

/** Builds the SiteData shape shared by create and edit — pass the result to
 *  lib/orderMapper.ts's `siteDataToOrderFields` for the actual Prisma
 *  create/update `data`. */
export function buildAnniversaryV2SiteData(input: AnniversaryV2OrderInput): SiteData {
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

  const places: SiteData["places"] =
    input.places.length > 0
      ? input.places.map((p) => ({
          name: p.name.trim(),
          caption: p.caption.trim(),
          x: Number(p.x),
          y: Number(p.y),
          photo: p.photo.trim() || undefined,
        }))
      : undefined;

  const typedPhrases = input.typedPhrases.map((p) => p.trim()).filter((p) => p.length > 0);

  return {
    people: input.people.map((p) => ({ name: p.name.trim() })),
    groupTitle: input.groupTitle.trim() || undefined,
    title: input.title.trim(),
    message: input.message.trim(),
    specialDate: new Date(input.specialDate).toISOString(),
    photos: input.photos.map((p) => ({ src: p.src.trim(), caption: p.caption.trim() || undefined })),
    videos: [{ src: input.heroVideoUrl.trim(), role: "hero" }],
    milestones,
    places,
    typedPhrases: typedPhrases.length > 0 ? typedPhrases : undefined,
    secretNote: input.secretNote.trim() || undefined,
    closingLine: input.closingLine.trim() || undefined,
    nightSkyCaption: input.nightSkyCaption.trim() || undefined,
    shootingStarWishMessage: input.shootingStarWishMessage.trim() || undefined,
    constellationRevealPhoto: input.constellationRevealPhoto.trim() || undefined,
    shootingStarWishPhoto: input.shootingStarWishPhoto.trim() || undefined,
    songs,
  };
}
