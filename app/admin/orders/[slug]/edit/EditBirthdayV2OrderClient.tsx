"use client";

import { useRouter } from "next/navigation";

import BirthdayV2OrderForm from "../../../_shared/BirthdayV2OrderForm";
import type { BirthdayV2OrderInput } from "../../../_shared/birthdayV2Order";
import { checkEditSlugAvailable, updateBirthdayV2Order } from "./actions";

export default function EditBirthdayV2OrderClient({
  initialValues,
  originalSlug,
}: {
  initialValues: BirthdayV2OrderInput;
  originalSlug: string;
}) {
  const router = useRouter();
  const detailHref = `/admin/orders/${encodeURIComponent(originalSlug)}`;

  return (
    <BirthdayV2OrderForm
      mode="edit"
      eyebrow="Admin · Edit order"
      heading={`Editing "${originalSlug}"`}
      initialValues={initialValues}
      originalSlug={originalSlug}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onCheckSlug={(candidate) => checkEditSlugAvailable(candidate, originalSlug)}
      onSubmit={(input) => updateBirthdayV2Order(originalSlug, input)}
      onSuccess={(slug) => router.push(`/admin/orders/${encodeURIComponent(slug)}?updated=1`)}
      backHref={detailHref}
      onCancel={() => router.push(detailHref)}
    />
  );
}
