"use client";

import { useRouter } from "next/navigation";

import AnniversaryV2OrderForm, {
  emptyAnniversaryV2FormValues,
} from "../../_shared/AnniversaryV2OrderForm";
import { checkSlugAvailable, createAnniversaryV2Order } from "./actions";

// Starting point only, not an enforced count — same reasoning
// new-order/anniversary-v1/page.tsx's own DEFAULT_PHOTO_COUNT documents.
const DEFAULT_PHOTO_COUNT = 2;

export default function NewAnniversaryV2OrderPage() {
  const router = useRouter();

  return (
    <AnniversaryV2OrderForm
      mode="create"
      eyebrow="Admin · New order"
      heading="Anniversary V2 order intake"
      initialValues={emptyAnniversaryV2FormValues(DEFAULT_PHOTO_COUNT)}
      submitLabel="Create order"
      pendingLabel="Creating order…"
      onCheckSlug={checkSlugAvailable}
      onSubmit={createAnniversaryV2Order}
      onSuccess={(slug) => router.push(`/admin/new-order/anniversary-v2/success?slug=${encodeURIComponent(slug)}`)}
      backHref="/admin/orders"
      onCancel={() => router.push("/admin/orders")}
    />
  );
}
