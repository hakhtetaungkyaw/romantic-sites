import { prisma, withRetry } from "@/lib/db";

import NewOrderPicker from "../_shared/NewOrderPicker";
import OrdersExplorer, { type OrderRow } from "./OrdersExplorer";

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialCategory = firstParam(params.category) || "all";
  const initialPayment = firstParam(params.payment) || "all";
  const initialDelivery = firstParam(params.delivery) || "all";
  const initialQ = firstParam(params.q).trim();

  // Fetched once, unfiltered — OrdersExplorer (client) does every
  // category/status/search filter itself against this array in memory, so
  // clicking a tab or typing a search never waits on another server
  // round-trip (see that file's own comment on why this is safe at this
  // order-count scale).
  const orders = await withRetry(() =>
    prisma.order.findMany({
      include: { template: true },
      orderBy: { createdAt: "desc" },
    }),
  );

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    slug: order.slug,
    customerName: order.customerName,
    templateName: order.template.name,
    templateCategory: order.template.category,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[#1a1a1a] px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Admin</p>
            <h1 className="font-display mt-1 text-3xl text-white">Orders</h1>
          </div>
          <NewOrderPicker />
        </div>

        <OrdersExplorer
          orders={rows}
          initialCategory={initialCategory}
          initialPayment={initialPayment}
          initialDelivery={initialDelivery}
          initialQ={initialQ}
        />
      </div>
    </main>
  );
}
