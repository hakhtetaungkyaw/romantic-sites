"use server";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";
import { siteDataToOrderFields } from "@/lib/orderMapper";
import type { BirthdayCustomData, SiteData } from "@/types/site";

// Lowercase letters/digits, single dashes as separators — no leading/
// trailing/doubled dashes, no uppercase, no underscores or spaces.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string }> {
  await requireAdminSession();

  const trimmed = slug.trim();
  if (!SLUG_PATTERN.test(trimmed)) {
    return {
      available: false,
      reason: "Lowercase letters, numbers, and single dashes only (e.g. maya-turns-25).",
    };
  }

  const existing = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: trimmed }, select: { id: true } }),
  );
  return { available: !existing };
}

export interface CreateBirthdayOrderInput {
  name: string;
  age: number | null;
  /** yyyy-mm-dd, from an <input type="date">. */
  birthdate: string;
  slug: string;
  title: string;
  customerName: string;
  customerEmail: string;
  /** Both optional — matches interactive/BirthdaySongPlayer.tsx's own
   *  established graceful degradation (no songTitle at all renders
   *  nothing; a songTitle with no songUrl renders disabled). Empty
   *  songUrl means no `songs` array is written at all — never an empty
   *  array — see this file's own songs construction below. */
  songUrl: string;
  songTitle: string;
  message: string;
  /** At least 1 — the Memory Frame gallery's full array (dynamic length;
   *  interactive/MemoryFrames.tsx has no hardcoded count assumption, see
   *  this route's own page.tsx for the confirmation). */
  photos: { src: string; caption: string }[];
  /** Independent of `photos[]` above — see types/site.ts's own doc comment
   *  on BirthdayCustomData.balloonCompletionPhoto for why. */
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

export type CreateBirthdayOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createBirthdayV1Order(
  input: CreateBirthdayOrderInput,
): Promise<CreateBirthdayOrderResult> {
  await requireAdminSession();

  // Server-side re-validation — the client already checked all of this
  // before ever calling this action, but a Server Action must never trust
  // its own caller (this project's own node_modules/next/dist/docs/01-app/
  // 02-guides/authentication.md explicitly says to treat Server Actions
  // like public-facing endpoints).
  const slug = input.slug.trim();
  if (!SLUG_PATTERN.test(slug)) return { ok: false, error: "Invalid slug format." };
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  if (!input.birthdate || Number.isNaN(Date.parse(input.birthdate))) {
    return { ok: false, error: "A valid birthdate is required." };
  }
  if (!input.title.trim()) return { ok: false, error: "Room title is required." };
  if (!input.customerName.trim()) return { ok: false, error: "Customer name is required." };
  if (input.songUrl.trim() && !isUrl(input.songUrl)) {
    return { ok: false, error: "Song URL must start with http:// or https://." };
  }
  if (!input.message.trim()) return { ok: false, error: "Grand Finale message is required." };
  if (input.photos.length < 1 || input.photos.some((p) => !p.src.trim())) {
    return { ok: false, error: "At least 1 gallery photo (with a URL) is required." };
  }
  if (!input.balloonCompletionPhoto.trim()) {
    return { ok: false, error: "The balloon completion photo is required." };
  }
  if (!input.cakeWishMessage.trim()) return { ok: false, error: "Cake wish message is required." };
  if (input.balloonMessages.length !== 7 || input.balloonMessages.some((m) => !m.trim())) {
    return { ok: false, error: "Exactly 7 balloon messages are required." };
  }
  if (!input.balloonCompletionMessage.trim()) {
    return { ok: false, error: "Balloon completion message is required." };
  }
  if (!input.giftLayerOneKeyword.trim()) return { ok: false, error: "Gift layer-one keyword is required." };
  if (!input.giftLayerTwoPhrase.trim()) return { ok: false, error: "Gift layer-two phrase is required." };
  if (!input.giftMessage.trim()) return { ok: false, error: "Gift message is required." };
  if (input.giftWheelItems.length !== 7 || input.giftWheelItems.some((i) => !i.trim())) {
    return { ok: false, error: "Exactly 7 gift wheel items are required." };
  }

  const template = await withRetry(() =>
    prisma.template.findUnique({ where: { componentKey: "birthday-v1" } }),
  );
  if (!template) {
    return {
      ok: false,
      error:
        'No Template row found with componentKey "birthday-v1" — seed it first (see prisma/seed.ts).',
    };
  }

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
    // Not currently rendered anywhere: interactive/GiftUnwrap.tsx's own
    // reveal modal had its photo prop removed in an earlier pass (see that
    // file's own trailing usage comment). Still collected here since it's
    // a real field on BirthdayCustomData, for whenever a future object
    // wants it — left undefined if the admin leaves it blank.
    giftPhoto: input.giftPhoto.trim() || undefined,
  };

  // No `songs` array at all when songUrl is blank — never an empty array
  // — so interactive/BirthdaySongPlayer.tsx's own `songs?.[0]` sourcing
  // (templates/BirthdayV1.tsx) sees `undefined` and falls into its
  // already-established disabled/no-song render path, the same as any
  // order created without this section filled in before it existed.
  const songUrl = input.songUrl.trim();
  const songs: SiteData["songs"] = songUrl
    ? [{ url: songUrl, title: input.songTitle.trim() || "Happy Birthday" }]
    : undefined;

  const siteData: SiteData = {
    people: [{ name: input.name.trim() }],
    title: input.title.trim(),
    message: input.message.trim(),
    specialDate: new Date(input.birthdate).toISOString(),
    photos: input.photos.map((p) => ({ src: p.src.trim(), caption: p.caption.trim() || undefined })),
    songs,
    customData: { birthday: birthdayCustomData },
  };

  try {
    const order = await withRetry(() =>
      prisma.order.create({
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          // The Order schema's customerEmail column is required
          // (non-nullable) even though this form treats email as
          // optional per this task's own spec — falls back to a clear
          // placeholder rather than writing an empty string.
          customerEmail: input.customerEmail.trim() || "(not provided)",
          template: { connect: { id: template.id } },
        },
      }),
    );
    return { ok: true, slug: order.slug };
  } catch (error) {
    // P2002 = Prisma's unique-constraint-violation code — the slug's own
    // uniqueness is already checked client-side via checkSlugAvailable
    // above, but a race (two admins submitting the same slug at once)
    // could still slip past that, so this is the authoritative guard.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to create Birthday V1 order:", error);
    return { ok: false, error: "Something went wrong creating the order. Please try again." };
  }
}
