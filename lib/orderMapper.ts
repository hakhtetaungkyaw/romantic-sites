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
 * `closingLine` and `typedPhrases` have no dedicated Order column — they ride
 * inside `customData`, the schema's escape hatch for template-specific fields.
 */
interface OrderCustomData {
  closingLine?: string;
  typedPhrases?: string[];
  [key: string]: unknown;
}

export function orderToSiteData(order: OrderModel): SiteData {
  const customData = (order.customData as OrderCustomData | null) ?? {};
  const { closingLine, typedPhrases, ...restCustomData } = customData;

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
