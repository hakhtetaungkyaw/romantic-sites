"use client";

import { useRouter } from "next/navigation";

import BirthdayV2OrderForm from "../../_shared/BirthdayV2OrderForm";
import { emptyBirthdayV2FormValues } from "../../_shared/birthdayV2Order";
import { checkSlugAvailable, createBirthdayV2Order } from "./actions";

// 6, not the usual 2 other templates default to — a starting point only,
// not enforced, but a helpful nudge toward the Phase 5 sphere gallery's own
// 6-photo threshold (ArcadeHub.tsx falls back to a plain grid below that)
// rather than an admin having to already know that number exists.
const DEFAULT_PHOTO_COUNT = 6;

export default function NewBirthdayV2OrderPage() {
  const router = useRouter();

  return (
    <BirthdayV2OrderForm
      mode="create"
      eyebrow="Admin · New order"
      heading="Birthday V2 order intake"
      initialValues={emptyBirthdayV2FormValues(DEFAULT_PHOTO_COUNT)}
      submitLabel="Create order"
      pendingLabel="Creating order…"
      onCheckSlug={checkSlugAvailable}
      onSubmit={createBirthdayV2Order}
      onSuccess={(slug) => router.push(`/admin/new-order/birthday-v2/success?slug=${encodeURIComponent(slug)}`)}
      backHref="/admin/orders"
      onCancel={() => router.push("/admin/orders")}
    />
  );
}
