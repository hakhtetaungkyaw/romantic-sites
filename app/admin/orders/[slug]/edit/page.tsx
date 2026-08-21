import { notFound } from "next/navigation";

import { prisma, withRetry } from "@/lib/db";
import type { BirthdayCustomData, SitePerson, SitePhoto, SiteSong } from "@/types/site";

import type { BirthdayV1FormValues } from "../../../_shared/BirthdayV1OrderForm";
import EditBirthdayV1OrderClient from "./EditBirthdayV1OrderClient";

export default async function EditBirthdayV1OrderPage({
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

  // This edit form only knows the Birthday V1 field set — an order for any
  // other template has no edit form yet (the order detail page only links
  // here for birthday-v1 orders in the first place, see that page's own
  // conditional Edit link).
  if (!order || order.template.componentKey !== "birthday-v1") {
    notFound();
  }

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
