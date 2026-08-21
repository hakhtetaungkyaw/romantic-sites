import type { BirthdayCustomData, SiteData } from "@/types/site";

// Shared between app/admin/new-order/birthday-v1/actions.ts (create) and
// app/admin/orders/[slug]/edit/actions.ts (edit) — the two routes' input
// shape and field-level validation rules are identical; only what happens
// with a validated input differs (prisma.order.create vs .update), and only
// slug UNIQUENESS checking differs (create always checks; edit must allow
// keeping its own current slug) — that stays in each action file instead of
// here.

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface BirthdayV1OrderInput {
  name: string;
  age: number | null;
  /** yyyy-mm-dd, from an <input type="date">. */
  birthdate: string;
  slug: string;
  title: string;
  customerName: string;
  customerEmail: string;
  songUrl: string;
  songTitle: string;
  message: string;
  /** At least 1 — the Memory Frame gallery's full array. */
  photos: { src: string; caption: string }[];
  balloonCompletionPhoto: string;
  cakeWishMessage: string;
  /** Exactly 7. */
  balloonMessages: string[];
  balloonCompletionMessage: string;
  giftLayerOneKeyword: string;
  giftLayerTwoPhrase: string;
  giftMessage: string;
  /** Exactly 7. */
  giftWheelItems: string[];
  giftPhoto: string;
}

/**
 * Server-side re-validation shared by create and edit — returns the first
 * error message found, or null if the input is valid. Deliberately does NOT
 * check slug uniqueness (see file-level comment above).
 */
export function validateBirthdayV1OrderInput(input: BirthdayV1OrderInput): string | null {
  const slug = input.slug.trim();
  if (!SLUG_PATTERN.test(slug)) return "Invalid slug format.";
  if (!input.name.trim()) return "Name is required.";
  if (!input.birthdate || Number.isNaN(Date.parse(input.birthdate))) {
    return "A valid birthdate is required.";
  }
  if (!input.title.trim()) return "Room title is required.";
  if (!input.customerName.trim()) return "Customer name is required.";
  if (input.songUrl.trim() && !isUrl(input.songUrl)) {
    return "Song URL must start with http:// or https://.";
  }
  if (!input.message.trim()) return "Grand Finale message is required.";
  if (input.photos.length < 1 || input.photos.some((p) => !p.src.trim())) {
    return "At least 1 gallery photo (with a URL) is required.";
  }
  if (!input.balloonCompletionPhoto.trim()) return "The balloon completion photo is required.";
  if (!input.cakeWishMessage.trim()) return "Cake wish message is required.";
  if (input.balloonMessages.length !== 7 || input.balloonMessages.some((m) => !m.trim())) {
    return "Exactly 7 balloon messages are required.";
  }
  if (!input.balloonCompletionMessage.trim()) return "Balloon completion message is required.";
  if (!input.giftLayerOneKeyword.trim()) return "Gift layer-one keyword is required.";
  if (!input.giftLayerTwoPhrase.trim()) return "Gift layer-two phrase is required.";
  if (!input.giftMessage.trim()) return "Gift message is required.";
  if (input.giftWheelItems.length !== 7 || input.giftWheelItems.some((i) => !i.trim())) {
    return "Exactly 7 gift wheel items are required.";
  }
  return null;
}

/** Builds the SiteData shape shared by create and edit — pass the result to
 *  lib/orderMapper.ts's `siteDataToOrderFields` for the actual Prisma
 *  create/update `data`. */
export function buildBirthdayV1SiteData(input: BirthdayV1OrderInput): SiteData {
  const birthdayCustomData: BirthdayCustomData = {
    age: input.age ?? undefined,
    cakeWishMessage: input.cakeWishMessage.trim(),
    balloonMessages: input.balloonMessages.map((m) => m.trim()),
    balloonCompletionMessage: input.balloonCompletionMessage.trim(),
    balloonCompletionPhoto: input.balloonCompletionPhoto.trim(),
    giftLayerOneKeyword: input.giftLayerOneKeyword.trim(),
    giftLayerTwoPhrase: input.giftLayerTwoPhrase.trim(),
    giftWheelItems: input.giftWheelItems.map((i) => i.trim()),
    giftMessage: input.giftMessage.trim(),
    // Not currently rendered anywhere — see interactive/GiftUnwrap.tsx's own
    // trailing usage comment. Still collected for future-proofing.
    giftPhoto: input.giftPhoto.trim() || undefined,
  };

  // No `songs` array at all when songUrl is blank — never an empty array —
  // so interactive/BirthdaySongPlayer.tsx's own `songs?.[0]` sourcing sees
  // `undefined` and falls into its already-established disabled/no-song
  // render path.
  const songUrl = input.songUrl.trim();
  const songs: SiteData["songs"] = songUrl
    ? [{ url: songUrl, title: input.songTitle.trim() || "Happy Birthday" }]
    : undefined;

  return {
    people: [{ name: input.name.trim() }],
    title: input.title.trim(),
    message: input.message.trim(),
    specialDate: new Date(input.birthdate).toISOString(),
    photos: input.photos.map((p) => ({ src: p.src.trim(), caption: p.caption.trim() || undefined })),
    songs,
    customData: { birthday: birthdayCustomData },
  };
}
