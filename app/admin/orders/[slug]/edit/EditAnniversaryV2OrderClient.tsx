"use client";

import { useRouter } from "next/navigation";

import AnniversaryV2OrderForm, { type AnniversaryV2FormValues } from "../../../_shared/AnniversaryV2OrderForm";
import { checkEditSlugAvailable, updateAnniversaryV2Order } from "./actions";

export default function EditAnniversaryV2OrderClient({
  initialValues,
  originalSlug,
}: {
  initialValues: AnniversaryV2FormValues;
  originalSlug: string;
}) {
  const router = useRouter();
  const detailHref = `/admin/orders/${encodeURIComponent(originalSlug)}`;

  return (
    <AnniversaryV2OrderForm
      mode="edit"
      eyebrow="Admin · Edit order"
      heading={`Editing "${originalSlug}"`}
      initialValues={initialValues}
      originalSlug={originalSlug}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onCheckSlug={(candidate) => checkEditSlugAvailable(candidate, originalSlug)}
      onSubmit={(input) => updateAnniversaryV2Order(originalSlug, input)}
      onSuccess={(slug) => router.push(`/admin/orders/${encodeURIComponent(slug)}?updated=1`)}
      backHref={detailHref}
      onCancel={() => router.push(detailHref)}
    />
  );
}
