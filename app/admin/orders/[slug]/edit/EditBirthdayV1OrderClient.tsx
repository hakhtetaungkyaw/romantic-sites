"use client";

import { useRouter } from "next/navigation";

import BirthdayV1OrderForm, { type BirthdayV1FormValues } from "../../../_shared/BirthdayV1OrderForm";
import { checkEditSlugAvailable, updateBirthdayV1Order } from "./actions";

export default function EditBirthdayV1OrderClient({
  initialValues,
  originalSlug,
}: {
  initialValues: BirthdayV1FormValues;
  originalSlug: string;
}) {
  const router = useRouter();
  const detailHref = `/admin/orders/${encodeURIComponent(originalSlug)}`;

  return (
    <BirthdayV1OrderForm
      mode="edit"
      eyebrow="Admin · Edit order"
      heading={`Editing "${originalSlug}"`}
      initialValues={initialValues}
      originalSlug={originalSlug}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onCheckSlug={(candidate) => checkEditSlugAvailable(candidate, originalSlug)}
      onSubmit={(input) => updateBirthdayV1Order(originalSlug, input)}
      onSuccess={(slug) => router.push(`/admin/orders/${encodeURIComponent(slug)}?updated=1`)}
      backHref={detailHref}
      onCancel={() => router.push(detailHref)}
    />
  );
}
