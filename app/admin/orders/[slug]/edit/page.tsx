import { notFound } from "next/navigation";

import { prisma, withRetry } from "@/lib/db";
import type { BirthdayCustomData, SiteData, SitePerson, SitePhoto, SiteSong, SiteVideo } from "@/types/site";

import type { AnniversaryV1FormValues } from "../../../_shared/AnniversaryV1OrderForm";
import type { AnniversaryV2FormValues } from "../../../_shared/AnniversaryV2OrderForm";
import type { BirthdayV2OrderInput } from "../../../_shared/birthdayV2Order";
import type { BirthdayV1FormValues } from "../../../_shared/BirthdayV1OrderForm";
import EditAnniversaryV1OrderClient from "./EditAnniversaryV1OrderClient";
import EditAnniversaryV2OrderClient from "./EditAnniversaryV2OrderClient";
import EditBirthdayV1OrderClient from "./EditBirthdayV1OrderClient";
import EditBirthdayV2OrderClient from "./EditBirthdayV2OrderClient";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { slug },
      include: { template: true },
    }),
  );

  // Each edit form only knows its own template's field set — an order for
  // any other template (e.g. anniversary-v2) has no edit form yet, same as
  // before this branch existed. The order detail page's own Edit link is
  // conditional on componentKey too (see app/admin/orders/[slug]/page.tsx),
  // so reaching this route for an unsupported template isn't a normal path
  // — notFound() here is the correct, expected fallback, not a bug.
  if (!order) {
    notFound();
  }

  if (order.template.componentKey === "birthday-v1") {
    const people = (order.people as unknown as SitePerson[] | null) ?? [];
    const photos = (order.photos as unknown as SitePhoto[] | null) ?? [];
    const songs = (order.songs as unknown as SiteSong[] | null) ?? [];
    const birthday = ((order.customData as { birthday?: Partial<BirthdayCustomData> } | null)?.birthday ??
      {}) as Partial<BirthdayCustomData>;

    const initialValues: BirthdayV1FormValues = {
      name: people[0]?.name ?? "",
      age: typeof birthday.age === "number" ? String(birthday.age) : "",
      birthdate: order.specialDate.toISOString().slice(0, 10),
      slug: order.slug,
      title: order.title,
      customerName: order.customerName,
      // Round-trips the create form's own "(not provided)" placeholder back
      // to an empty field — see app/admin/new-order/birthday-v1/actions.ts's
      // own fallback for why that placeholder exists at all.
      customerEmail: order.customerEmail === "(not provided)" ? "" : order.customerEmail,
      songUrl: songs[0]?.url ?? "",
      songTitle: songs[0]?.title ?? "",
      message: order.message,
      photos:
        photos.length > 0
          ? photos.map((p) => ({ src: p.src, caption: p.caption ?? "" }))
          : [{ src: "", caption: "" }],
      balloonCompletionPhoto: birthday.balloonCompletionPhoto ?? "",
      cakeWishMessage: birthday.cakeWishMessage ?? "",
      balloonMessages:
        birthday.balloonMessages && birthday.balloonMessages.length === 7
          ? birthday.balloonMessages
          : Array.from({ length: 7 }, () => ""),
      balloonCompletionMessage: birthday.balloonCompletionMessage ?? "",
      giftLayerOneKeyword: birthday.giftLayerOneKeyword ?? "",
      giftLayerTwoPhrase: birthday.giftLayerTwoPhrase ?? "",
      giftMessage: birthday.giftMessage ?? "",
      giftWheelItems:
        birthday.giftWheelItems && birthday.giftWheelItems.length === 7
          ? birthday.giftWheelItems
          : Array.from({ length: 7 }, () => ""),
      giftPhoto: birthday.giftPhoto ?? "",
    };

    return <EditBirthdayV1OrderClient initialValues={initialValues} originalSlug={order.slug} />;
  }

  if (order.template.componentKey === "anniversary-v1") {
    const people = (order.people as unknown as SitePerson[] | null) ?? [];
    const photos = (order.photos as unknown as SitePhoto[] | null) ?? [];
    const songs = (order.songs as unknown as SiteSong[] | null) ?? [];
    const milestones = (order.milestones as SiteData["milestones"] | null) ?? [];
    // closingLine/goldenSkyCaption/goldenSkyLoveNote/goldenSkyPhoto all ride
    // inside the generic customData escape hatch as flat keys
    // (lib/orderMapper.ts's own OrderCustomData) — there is no
    // "anniversary" namespace the way Birthday has customData.birthday.
    const anniversaryCustomData = order.customData as
      | { closingLine?: string; goldenSkyCaption?: string; goldenSkyLoveNote?: string; goldenSkyPhoto?: string }
      | null;

    const initialValues: AnniversaryV1FormValues = {
      people: people.length > 0 ? people.map((p) => ({ name: p.name })) : [{ name: "" }],
      groupTitle: order.groupTitle ?? "",
      title: order.title,
      specialDate: order.specialDate.toISOString().slice(0, 10),
      slug: order.slug,
      customerName: order.customerName,
      customerEmail: order.customerEmail === "(not provided)" ? "" : order.customerEmail,
      songUrl: songs[0]?.url ?? "",
      songTitle: songs[0]?.title ?? "",
      message: order.message,
      photos:
        photos.length > 0
          ? photos.map((p) => ({ src: p.src, caption: p.caption ?? "" }))
          : [{ src: "", caption: "" }],
      milestones: milestones.map((m) => ({
        date: m.date,
        title: m.title,
        description: m.description ?? "",
        photo: m.photo ?? "",
      })),
      revealMessage: order.secretMessage ?? "",
      closingLine: anniversaryCustomData?.closingLine ?? "",
      goldenSkyCaption: anniversaryCustomData?.goldenSkyCaption ?? "",
      goldenSkyLoveNote: anniversaryCustomData?.goldenSkyLoveNote ?? "",
      goldenSkyPhoto: anniversaryCustomData?.goldenSkyPhoto ?? "",
    };

    return <EditAnniversaryV1OrderClient initialValues={initialValues} originalSlug={order.slug} />;
  }

  if (order.template.componentKey === "anniversary-v2") {
    const people = (order.people as unknown as SitePerson[] | null) ?? [];
    const photos = (order.photos as unknown as SitePhoto[] | null) ?? [];
    const videos = (order.videos as unknown as SiteVideo[] | null) ?? [];
    const songs = (order.songs as unknown as SiteSong[] | null) ?? [];
    const milestones = (order.milestones as SiteData["milestones"] | null) ?? [];
    const places = (order.places as SiteData["places"] | null) ?? [];
    const heroVideo = videos.find((v) => v.role === "hero");
    // closingLine/nightSkyCaption/shootingStarWishMessage/
    // constellationRevealPhoto/shootingStarWishPhoto all ride inside the
    // generic customData escape hatch as flat keys
    // (lib/orderMapper.ts's own OrderCustomData) — there is no
    // "anniversary" namespace the way Birthday has customData.birthday.
    const anniversaryCustomData = order.customData as
      | {
          closingLine?: string;
          nightSkyCaption?: string;
          shootingStarWishMessage?: string;
          constellationRevealPhoto?: string;
          shootingStarWishPhoto?: string;
        }
      | null;

    const initialValues: AnniversaryV2FormValues = {
      people: people.length > 0 ? people.map((p) => ({ name: p.name })) : [{ name: "" }],
      groupTitle: order.groupTitle ?? "",
      title: order.title,
      specialDate: order.specialDate.toISOString().slice(0, 10),
      slug: order.slug,
      customerName: order.customerName,
      customerEmail: order.customerEmail === "(not provided)" ? "" : order.customerEmail,
      heroVideoUrl: heroVideo?.src ?? "",
      songUrl: songs[0]?.url ?? "",
      songTitle: songs[0]?.title ?? "",
      message: order.message,
      photos:
        photos.length > 0
          ? photos.map((p) => ({ src: p.src, caption: p.caption ?? "" }))
          : [{ src: "", caption: "" }],
      constellationRevealPhoto: anniversaryCustomData?.constellationRevealPhoto ?? "",
      shootingStarWishPhoto: anniversaryCustomData?.shootingStarWishPhoto ?? "",
      shootingStarWishMessage: anniversaryCustomData?.shootingStarWishMessage ?? "",
      milestones: milestones.map((m) => ({
        date: m.date,
        title: m.title,
        description: m.description ?? "",
        photo: m.photo ?? "",
      })),
      places: places.map((p) => ({
        name: p.name,
        caption: p.caption,
        x: String(p.x),
        y: String(p.y),
        photo: p.photo ?? "",
      })),
      typedPhrases: (order.customData as { typedPhrases?: string[] } | null)?.typedPhrases ?? [],
      secretNote: order.secretMessage ?? "",
      closingLine: anniversaryCustomData?.closingLine ?? "",
      nightSkyCaption: anniversaryCustomData?.nightSkyCaption ?? "",
    };

    return <EditAnniversaryV2OrderClient initialValues={initialValues} originalSlug={order.slug} />;
  }

  if (order.template.componentKey === "birthday-v2") {
    const people = (order.people as unknown as SitePerson[] | null) ?? [];
    const photos = (order.photos as unknown as SitePhoto[] | null) ?? [];
    // birthdayV2Message/galleryRepeatMultiplier ride inside customData like
    // every other flat template-specific key (see lib/orderMapper.ts) — no
    // dedicated Order column for either.
    const birthdayV2CustomData = order.customData as
      | { birthdayV2Message?: string; galleryRepeatMultiplier?: number }
      | null;

    const initialValues: BirthdayV2OrderInput = {
      name: people[0]?.name ?? "",
      title: order.title,
      specialDate: order.specialDate.toISOString().slice(0, 10),
      slug: order.slug,
      customerName: order.customerName,
      customerEmail: order.customerEmail === "(not provided)" ? "" : order.customerEmail,
      message: birthdayV2CustomData?.birthdayV2Message ?? "",
      photos:
        photos.length > 0
          ? photos.map((p) => ({ src: p.src, caption: p.caption ?? "" }))
          : [{ src: "", caption: "" }],
      galleryRepeatMultiplier:
        typeof birthdayV2CustomData?.galleryRepeatMultiplier === "number"
          ? String(birthdayV2CustomData.galleryRepeatMultiplier)
          : "",
    };

    return <EditBirthdayV2OrderClient initialValues={initialValues} originalSlug={order.slug} />;
  }

  notFound();
}
