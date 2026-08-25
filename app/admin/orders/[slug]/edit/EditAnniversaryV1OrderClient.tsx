"use client";

import { useRouter } from "next/navigation";

import AnniversaryV1OrderForm, { type AnniversaryV1FormValues } from "../../../_shared/AnniversaryV1OrderForm";
import { checkEditSlugAvailable, updateAnniversaryV1Order } from "./actions";

export default function EditAnniversaryV1OrderClient({
  initialValues,
  originalSlug,
}: {
  initialValues: AnniversaryV1FormValues;
  originalSlug: string;
}) {
  const router = useRouter();
  const detailHref = `/admin/orders/${encodeURIComponent(originalSlug)}`;

  return (
    <AnniversaryV1OrderForm
      mode="edit"
      eyebrow="Admin · Edit order"
      heading={`Editing "${originalSlug}"`}
      initialValues={initialValues}
      originalSlug={originalSlug}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onCheckSlug={(candidate) => checkEditSlugAvailable(candidate, originalSlug)}
      onSubmit={(input) => updateAnniversaryV1Order(originalSlug, input)}
      onSuccess={(slug) => router.push(`/admin/orders/${encodeURIComponent(slug)}?updated=1`)}
      backHref={detailHref}
      onCancel={() => router.push(detailHref)}
    />
  );
}
