"use client";

import { useRouter } from "next/navigation";

import AnniversaryV1OrderForm, {
  emptyAnniversaryV1FormValues,
} from "../../_shared/AnniversaryV1OrderForm";
import { checkSlugAvailable, createAnniversaryV1Order } from "./actions";

// Starting point only, not an enforced count — same reasoning
// new-order/birthday-v1/page.tsx's own DEFAULT_PHOTO_COUNT documents.
const DEFAULT_PHOTO_COUNT = 2;

export default function NewAnniversaryV1OrderPage() {
  const router = useRouter();

  return (
    <AnniversaryV1OrderForm
      mode="create"
      eyebrow="Admin · New order"
      heading="Anniversary V1 order intake"
      initialValues={emptyAnniversaryV1FormValues(DEFAULT_PHOTO_COUNT)}
      submitLabel="Create order"
      pendingLabel="Creating order…"
      onCheckSlug={checkSlugAvailable}
      onSubmit={createAnniversaryV1Order}
      onSuccess={(slug) => router.push(`/admin/new-order/anniversary-v1/success?slug=${encodeURIComponent(slug)}`)}
      backHref="/admin/orders"
      onCancel={() => router.push("/admin/orders")}
    />
  );
}
