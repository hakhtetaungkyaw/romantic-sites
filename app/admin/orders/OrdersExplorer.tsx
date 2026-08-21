"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { formatDateTime } from "@/lib/format";

import { DeliveryStatusBadge, PaymentStatusBadge } from "./StatusBadge";

export interface OrderRow {
  id: string;
  slug: string;
  customerName: string;
  templateName: string;
  templateCategory: string;
  paymentStatus: string;
  deliveryStatus: string;
  /** ISO string — Dates don't need to cross the server/client boundary here,
   *  and a plain string sidesteps ever having to think about whether they
   *  would serialize correctly if they did. */
  createdAt: string;
}

const selectClass =
  "rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d97a5f]";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "anniversary", label: "Anniversary" },
  { value: "birthday", label: "Birthday" },
];

export default function OrdersExplorer({
  orders,
  initialCategory,
  initialPayment,
  initialDelivery,
  initialQ,
}: {
  orders: OrderRow[];
  initialCategory: string;
  initialPayment: string;
  initialDelivery: string;
  initialQ: string;
}) {
  const pathname = usePathname();

  // All filtering below runs against this already-fetched `orders` array —
  // no server round-trip per keystroke/click. The order count for this
  // internal tool is expected to stay in the tens-to-low-hundreds range
  // (custom digital gift orders, not a high-volume storefront), so filtering
  // the full list in memory on every render is cheap; this would need to
  // become a real server-paginated/searched list well before that stops
  // being true.
  const [category, setCategory] = useState(initialCategory);
  const [payment, setPayment] = useState(initialPayment);
  const [delivery, setDelivery] = useState(initialDelivery);
  const [q, setQ] = useState(initialQ);

  const urlSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keeps the URL bookmarkable/shareable, but via the plain History API —
  // NOT next/navigation's router.replace. page.tsx (a Server Component)
  // reads `searchParams` to compute this component's `initial*` props, so
  // going through the Next.js router here would re-trigger a server
  // round-trip for the new searchParams on every single filter interaction,
  // exactly the problem this component exists to avoid — even though that
  // round-trip's result would just be discarded (this component owns
  // filtering entirely client-side once mounted). `history.replaceState`
  // updates the address bar with zero network activity.
  function syncUrl(next: { category: string; payment: string; delivery: string; q: string }) {
    const params = new URLSearchParams();
    if (next.category !== "all") params.set("category", next.category);
    if (next.payment !== "all") params.set("payment", next.payment);
    if (next.delivery !== "all") params.set("delivery", next.delivery);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    syncUrl({ category: value, payment, delivery, q });
  }

  function handlePaymentChange(value: string) {
    setPayment(value);
    syncUrl({ category, payment: value, delivery, q });
  }

  function handleDeliveryChange(value: string) {
    setDelivery(value);
    syncUrl({ category, payment, delivery: value, q });
  }

  function handleSearchChange(value: string) {
    setQ(value);
    // The filtering itself is instant (see `filtered` below) — this
    // debounce only throttles how often the URL's own `?q=` param gets
    // rewritten, so rapid typing doesn't spam browser history entries.
    if (urlSyncDebounceRef.current) clearTimeout(urlSyncDebounceRef.current);
    urlSyncDebounceRef.current = setTimeout(
      () => syncUrl({ category, payment, delivery, q: value.trim() }),
      300,
    );
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((order) => {
      if (category !== "all" && order.templateCategory !== category) return false;
      if (payment !== "all" && order.paymentStatus !== payment) return false;
      if (delivery !== "all" && order.deliveryStatus !== delivery) return false;
      if (needle) {
        const haystack = `${order.slug} ${order.customerName}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [orders, category, payment, delivery, q]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-400">
        {filtered.length} order{filtered.length === 1 ? "" : "s"} matching current filters.
      </p>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#232326] p-4 shadow-sm shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full border border-white/15 bg-[#1e1e21] p-1">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleCategoryChange(option.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === option.value
                  ? "bg-gradient-to-b from-[#e8916f] to-[#c05e3d] text-white shadow-sm"
                  : "text-gray-400 hover:bg-[#d97a5f]/10 hover:text-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search slug or customer name…"
            className={`${selectClass} w-56`}
          />
          <select
            value={payment}
            onChange={(event) => handlePaymentChange(event.target.value)}
            className={selectClass}
          >
            <option value="all">Any payment status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={delivery}
            onChange={(event) => handleDeliveryChange(event.target.value)}
            className={selectClass}
          >
            <option value="all">Any delivery status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#232326] shadow-sm shadow-black/20">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Live site</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${encodeURIComponent(order.slug)}`}
                    className="font-medium text-[#e8916f] hover:underline"
                  >
                    {order.slug}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-100">{order.customerName}</td>
                <td className="px-4 py-3 text-gray-300">{order.templateName}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <DeliveryStatusBadge status={order.deliveryStatus} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                  {formatDateTime(new Date(order.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/site/${encodeURIComponent(order.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[#e8916f] hover:underline"
                  >
                    Open live site ↗
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No orders match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
