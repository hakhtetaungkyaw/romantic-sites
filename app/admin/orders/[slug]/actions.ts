"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";

export type SetOrderArchivedResult = { ok: true; isArchived: boolean } | { ok: false; error: string };

// Same exact values as Order.paymentStatus/deliveryStatus's own inline
// comments in prisma/schema.prisma (they're plain String columns, not real
// Prisma enums, so nothing generates these for us) — this is the
// authoritative server-side allow-list; OrderStatusEditor.tsx's own option
// lists are the client-side copy of the same values, not the source of
// truth. A Server Action must never trust its own caller for a value like
// this (per node_modules/next/dist/docs/01-app/02-guides/server-actions.md's
// own "Validate inputs" guidance), so an unrecognized value is rejected
// here regardless of what the client sent.
const PAYMENT_STATUSES = ["pending", "verified", "rejected"];
const DELIVERY_STATUSES = ["pending", "in_progress", "delivered"];

export type SetOrderStatusResult =
  | { ok: true; paymentStatus: string; deliveryStatus: string }
  | { ok: false; error: string };

/**
 * Soft-delete toggle, not a real delete — flips Order.isArchived, which
 * hides the order from the default admin list (OrdersExplorer's own
 * `showArchived` filter) and swaps its live /site/[slug] page for a
 * distinct "no longer available" notice (see that route's own
 * ArchivedExperience) rather than removing any row. Works identically for
 * every template/category since it's a plain Order-level column, not
 * gated on template.componentKey anywhere.
 */
export async function setOrderArchived(slug: string, archived: boolean): Promise<SetOrderArchivedResult> {
  await requireAdminSession();

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug },
        data: { isArchived: archived },
        select: { isArchived: true },
      }),
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${encodeURIComponent(slug)}`);
    revalidatePath(`/site/${encodeURIComponent(slug)}`);

    return { ok: true, isArchived: updated.isArchived };
  } catch (error) {
    console.error(`Failed to ${archived ? "archive" : "restore"} order "${slug}":`, error);
    return {
      ok: false,
      error: `Something went wrong ${archived ? "archiving" : "restoring"} the order. Please try again.`,
    };
  }
}

/**
 * Updates payment and/or delivery status for any order, regardless of
 * template — the only place either field can be changed after creation
 * (previously Prisma Studio only). Partial: OrderStatusEditor.tsx calls
 * this once per select change, passing just the one field that changed, so
 * either key here is optional; whichever is provided gets validated
 * against its own allow-list above and persisted.
 */
export async function setOrderStatus(
  slug: string,
  data: { paymentStatus?: string; deliveryStatus?: string },
): Promise<SetOrderStatusResult> {
  await requireAdminSession();

  if (data.paymentStatus !== undefined && !PAYMENT_STATUSES.includes(data.paymentStatus)) {
    return { ok: false, error: "Invalid payment status." };
  }
  if (data.deliveryStatus !== undefined && !DELIVERY_STATUSES.includes(data.deliveryStatus)) {
    return { ok: false, error: "Invalid delivery status." };
  }

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug },
        data,
        select: { paymentStatus: true, deliveryStatus: true },
      }),
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${encodeURIComponent(slug)}`);

    return { ok: true, paymentStatus: updated.paymentStatus, deliveryStatus: updated.deliveryStatus };
  } catch (error) {
    console.error(`Failed to update status for order "${slug}":`, error);
    return { ok: false, error: "Something went wrong updating the status. Please try again." };
  }
}
