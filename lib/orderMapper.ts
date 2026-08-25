import type { InputJsonValue } from "@prisma/client/runtime/client";

import type { OrderModel } from "@/lib/generated/prisma/models/Order";
import type {
  SiteData,
  SitePerson,
  SitePhoto,
  SiteVideo,
  SiteSong,
} from "@/types/site";

/**
 * Fields with no dedicated Order column ride inside `customData`, the
 * schema's escape hatch for template-specific fields — flat keys, never
 * nested under a per-template namespace (confirmed neither V1 nor V2 has
 * one). `constellationRevealPhoto`/`shootingStarWishPhoto` (V2) join this
 * list here for the first time — despite being real, already-typed
 * SiteData fields consumed by interactive/ConstellationGame.tsx and
 * interactive/ShootingStarWish.tsx, neither had ever actually been wired
 * into this mapper, so no code path (not even lib/scripts/createOrder.ts)
 * could persist them before now.
 */
interface OrderCustomData {
  closingLine?: string;
  typedPhrases?: string[];
  goldenSkyCaption?: string;
  goldenSkyLoveNote?: string;
  goldenSkyPhoto?: string;
  nightSkyCaption?: string;
  shootingStarWishMessage?: string;
  constellationRevealPhoto?: string;
  shootingStarWishPhoto?: string;
  birthdayV2Message?: string;
  galleryRepeatMultiplier?: number;
  [key: string]: unknown;
}

export function orderToSiteData(order: OrderModel): SiteData {
  const customData = (order.customData as OrderCustomData | null) ?? {};
  const {
    closingLine,
    typedPhrases,
    goldenSkyCaption,
    goldenSkyLoveNote,
    goldenSkyPhoto,
    nightSkyCaption,
    shootingStarWishMessage,
    constellationRevealPhoto,
    shootingStarWishPhoto,
    birthdayV2Message,
    galleryRepeatMultiplier,
    ...restCustomData
  } = customData;

  return {
    people: order.people as unknown as SitePerson[],
    groupTitle: order.groupTitle ?? undefined,
    title: order.title,
    message: order.message,
    specialDate: order.specialDate.toISOString(),
    photos: order.photos as unknown as SitePhoto[],
    videos: (order.videos as SiteVideo[] | null) ?? undefined,
    songs: (order.songs as SiteSong[] | null) ?? undefined,
    milestones: (order.milestones as SiteData["milestones"]) ?? undefined,
    closingLine: typeof closingLine === "string" ? closingLine : undefined,
    goldenSkyCaption: typeof goldenSkyCaption === "string" ? goldenSkyCaption : undefined,
    goldenSkyLoveNote: typeof goldenSkyLoveNote === "string" ? goldenSkyLoveNote : undefined,
    goldenSkyPhoto: typeof goldenSkyPhoto === "string" ? goldenSkyPhoto : undefined,
    nightSkyCaption: typeof nightSkyCaption === "string" ? nightSkyCaption : undefined,
    shootingStarWishMessage: typeof shootingStarWishMessage === "string" ? shootingStarWishMessage : undefined,
    constellationRevealPhoto: typeof constellationRevealPhoto === "string" ? constellationRevealPhoto : undefined,
    shootingStarWishPhoto: typeof shootingStarWishPhoto === "string" ? shootingStarWishPhoto : undefined,
    birthdayV2Message: typeof birthdayV2Message === "string" ? birthdayV2Message : undefined,
    galleryRepeatMultiplier: typeof galleryRepeatMultiplier === "number" ? galleryRepeatMultiplier : undefined,
    secretNote: order.secretMessage ?? undefined,
    places: (order.places as SiteData["places"]) ?? undefined,
    typedPhrases: Array.isArray(typedPhrases) ? typedPhrases : undefined,
    customData:
      Object.keys(restCustomData).length > 0 ? restCustomData : undefined,
  };
}

/**
 * Reverse of `orderToSiteData` — used when writing a new Order row from a
 * SiteData-shaped object (e.g. `lib/scripts/createOrder.ts`).
 */
export function siteDataToOrderFields(data: SiteData) {
  const customData: OrderCustomData = { ...(data.customData ?? {}) };
  if (data.closingLine !== undefined) customData.closingLine = data.closingLine;
  if (data.typedPhrases !== undefined) customData.typedPhrases = data.typedPhrases;
  if (data.goldenSkyCaption !== undefined) customData.goldenSkyCaption = data.goldenSkyCaption;
  if (data.goldenSkyLoveNote !== undefined) customData.goldenSkyLoveNote = data.goldenSkyLoveNote;
  if (data.goldenSkyPhoto !== undefined) customData.goldenSkyPhoto = data.goldenSkyPhoto;
  if (data.nightSkyCaption !== undefined) customData.nightSkyCaption = data.nightSkyCaption;
  if (data.shootingStarWishMessage !== undefined) {
    customData.shootingStarWishMessage = data.shootingStarWishMessage;
  }
  if (data.constellationRevealPhoto !== undefined) {
    customData.constellationRevealPhoto = data.constellationRevealPhoto;
  }
  if (data.shootingStarWishPhoto !== undefined) customData.shootingStarWishPhoto = data.shootingStarWishPhoto;
  if (data.birthdayV2Message !== undefined) customData.birthdayV2Message = data.birthdayV2Message;
  if (data.galleryRepeatMultiplier !== undefined) {
    customData.galleryRepeatMultiplier = data.galleryRepeatMultiplier;
  }

  return {
    people: data.people as unknown as InputJsonValue,
    groupTitle: data.groupTitle ?? null,
    title: data.title,
    message: data.message,
    specialDate: new Date(data.specialDate),
    photos: data.photos as unknown as InputJsonValue,
    videos: (data.videos as unknown as InputJsonValue) ?? undefined,
    songs: (data.songs as unknown as InputJsonValue) ?? undefined,
    secretMessage: data.secretNote ?? null,
    milestones: (data.milestones as unknown as InputJsonValue) ?? undefined,
    places: (data.places as unknown as InputJsonValue) ?? undefined,
    customData:
      Object.keys(customData).length > 0
        ? (customData as unknown as InputJsonValue)
        : undefined,
  };
}
