"use client";

import { useRouter } from "next/navigation";

import BirthdayV1OrderForm, {
  emptyBirthdayV1FormValues,
} from "../../_shared/BirthdayV1OrderForm";
import { checkSlugAvailable, createBirthdayV1Order } from "./actions";

// Starting point only, not an enforced count — the gallery is now a
// dynamic add/remove list, matching interactive/MemoryFrames.tsx's own
// already-dynamic handling of `photos.length` (checked directly: its
// progress dots, "X / Y" counter, and arrow/swipe navigation all read
// `photos.length` live, with a documented MAX_DOTS=12 fallback for the dot
// row specifically — nothing there assumes exactly 6).
const DEFAULT_PHOTO_COUNT = 2;

export default function NewBirthdayV1OrderPage() {
  const router = useRouter();

  return (
    <BirthdayV1OrderForm
      mode="create"
      eyebrow="Admin · New order"
      heading="Birthday V1 order intake"
      initialValues={emptyBirthdayV1FormValues(DEFAULT_PHOTO_COUNT)}
      submitLabel="Create order"
      pendingLabel="Creating order…"
      onCheckSlug={checkSlugAvailable}
      onSubmit={createBirthdayV1Order}
      onSuccess={(slug) => router.push(`/admin/new-order/birthday-v1/success?slug=${encodeURIComponent(slug)}`)}
      backHref="/admin/orders"
      onCancel={() => router.push("/admin/orders")}
    />
  );
}
