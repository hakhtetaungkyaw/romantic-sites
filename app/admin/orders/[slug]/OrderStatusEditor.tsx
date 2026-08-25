"use client";

import { useState, useTransition } from "react";

import { DeliveryStatusBadge, PaymentStatusBadge } from "../StatusBadge";
import { setOrderStatus } from "./actions";

// Exact enum values live on Order.paymentStatus/deliveryStatus in
// prisma/schema.prisma (as inline comments, since these are plain String
// columns, not real Prisma enums) — duplicated here as literal option lists
// rather than a shared constants import, same "small enum list re-typed
// per file rather than added cross-file coupling" precedent
// ../StatusBadge.tsx's own PAYMENT_STYLES/DELIVERY_STYLES keys already set.
const PAYMENT_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const DELIVERY_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
];

const selectClass =
  "rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#d97a5f] disabled:opacity-60";

// Template-agnostic (no template.componentKey check anywhere here or in
// the setOrderStatus action it calls) — lives on the order detail page
// every order type renders, unlike app/admin/_shared/BirthdayV1OrderForm.tsx
// (birthday-v1 only, no Anniversary equivalent exists), so this is what
// actually makes payment/delivery status editable for every order, not
// just Birthday V1's.
//
// Auto-saves on change (no separate Save button) — a status flip is a
// single, easily-reversible field, not a destructive action like
// ArchiveOrderButton's own archive/restore, so it doesn't need that
// component's window.confirm gate.
export default function OrderStatusEditor({
  slug,
  initialPaymentStatus,
  initialDeliveryStatus,
}: {
  slug: string;
  initialPaymentStatus: string;
  initialDeliveryStatus: string;
}) {
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [deliveryStatus, setDeliveryStatus] = useState(initialDeliveryStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePaymentChange(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(slug, { paymentStatus: value });
      if (result.ok) {
        setPaymentStatus(result.paymentStatus);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDeliveryChange(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(slug, { deliveryStatus: value });
      if (result.ok) {
        setDeliveryStatus(result.deliveryStatus);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment status</p>
        <div className="mt-1.5 flex items-center gap-2">
          <select
            value={paymentStatus}
            onChange={(event) => handlePaymentChange(event.target.value)}
            disabled={isPending}
            aria-label="Payment status"
            className={selectClass}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PaymentStatusBadge status={paymentStatus} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Delivery status</p>
        <div className="mt-1.5 flex items-center gap-2">
          <select
            value={deliveryStatus}
            onChange={(event) => handleDeliveryChange(event.target.value)}
            disabled={isPending}
            aria-label="Delivery status"
            className={selectClass}
          >
            {DELIVERY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <DeliveryStatusBadge status={deliveryStatus} />
        </div>
      </div>

      {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}
    </>
  );
}
