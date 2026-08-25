"use server";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";
import { siteDataToOrderFields } from "@/lib/orderMapper";

import {
  buildAnniversaryV1SiteData,
  validateAnniversaryV1OrderInput,
  type AnniversaryV1OrderInput,
} from "../../../_shared/anniversaryV1Order";
import {
  buildAnniversaryV2SiteData,
  validateAnniversaryV2OrderInput,
  type AnniversaryV2OrderInput,
} from "../../../_shared/anniversaryV2Order";
import {
  buildBirthdayV1SiteData,
  validateBirthdayV1OrderInput,
  type BirthdayV1OrderInput,
} from "../../../_shared/birthdayV1Order";
import {
  buildBirthdayV2SiteData,
  validateBirthdayV2OrderInput,
  type BirthdayV2OrderInput,
} from "../../../_shared/birthdayV2Order";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Same shape as new-order/birthday-v1/actions.ts's own checkSlugAvailable,
 * except a candidate equal to the order's own current slug is always
 * reported available without touching the database — editing an order
 * without changing its slug must never come back "taken" against itself.
 * Slug uniqueness has no per-template rule, so this one function is shared
 * by both EditBirthdayV1OrderClient.tsx and EditAnniversaryV1OrderClient.tsx
 * rather than duplicated per template.
 */
export async function checkEditSlugAvailable(
  candidateSlug: string,
  currentSlug: string,
): Promise<{ available: boolean; reason?: string }> {
  await requireAdminSession();

  const trimmed = candidateSlug.trim();
  if (trimmed === currentSlug) return { available: true };

  if (!SLUG_PATTERN.test(trimmed)) {
    return {
      available: false,
      reason: "Lowercase letters, numbers, and single dashes only (e.g. maya-turns-25).",
    };
  }

  const existing = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: trimmed }, select: { id: true } }),
  );
  return { available: !existing };
}

export type UpdateBirthdayOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function updateBirthdayV1Order(
  originalSlug: string,
  input: BirthdayV1OrderInput,
): Promise<UpdateBirthdayOrderResult> {
  await requireAdminSession();

  const validationError = validateBirthdayV1OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const existingOrder = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: originalSlug }, include: { template: true } }),
  );
  if (!existingOrder) {
    return { ok: false, error: "Order not found — it may have been deleted." };
  }
  if (existingOrder.template.componentKey !== "birthday-v1") {
    return { ok: false, error: "This order is not a Birthday V1 order." };
  }

  const slug = input.slug.trim();
  const siteData = buildBirthdayV1SiteData(input);

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug: originalSlug },
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim() || "(not provided)",
        },
      }),
    );
    return { ok: true, slug: updated.slug };
  } catch (error) {
    // P2002 = unique-constraint violation — only reachable here if the
    // slug was actually CHANGED to a value some other order already owns;
    // updating a row to its own already-current slug never violates
    // uniqueness. checkEditSlugAvailable already checks this client-side;
    // this is the authoritative guard against a same-slug submit race.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to update Birthday V1 order:", error);
    return { ok: false, error: "Something went wrong updating the order. Please try again." };
  }
}

export type UpdateAnniversaryOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function updateAnniversaryV1Order(
  originalSlug: string,
  input: AnniversaryV1OrderInput,
): Promise<UpdateAnniversaryOrderResult> {
  await requireAdminSession();

  const validationError = validateAnniversaryV1OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const existingOrder = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: originalSlug }, include: { template: true } }),
  );
  if (!existingOrder) {
    return { ok: false, error: "Order not found — it may have been deleted." };
  }
  if (existingOrder.template.componentKey !== "anniversary-v1") {
    return { ok: false, error: "This order is not an Anniversary V1 order." };
  }

  const slug = input.slug.trim();
  const siteData = buildAnniversaryV1SiteData(input);

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug: originalSlug },
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim() || "(not provided)",
        },
      }),
    );
    return { ok: true, slug: updated.slug };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to update Anniversary V1 order:", error);
    return { ok: false, error: "Something went wrong updating the order. Please try again." };
  }
}

export async function updateAnniversaryV2Order(
  originalSlug: string,
  input: AnniversaryV2OrderInput,
): Promise<UpdateAnniversaryOrderResult> {
  await requireAdminSession();

  const validationError = validateAnniversaryV2OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const existingOrder = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: originalSlug }, include: { template: true } }),
  );
  if (!existingOrder) {
    return { ok: false, error: "Order not found — it may have been deleted." };
  }
  if (existingOrder.template.componentKey !== "anniversary-v2") {
    return { ok: false, error: "This order is not an Anniversary V2 order." };
  }

  const slug = input.slug.trim();
  const siteData = buildAnniversaryV2SiteData(input);

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug: originalSlug },
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim() || "(not provided)",
        },
      }),
    );
    return { ok: true, slug: updated.slug };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to update Anniversary V2 order:", error);
    return { ok: false, error: "Something went wrong updating the order. Please try again." };
  }
}

export type UpdateBirthdayV2OrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function updateBirthdayV2Order(
  originalSlug: string,
  input: BirthdayV2OrderInput,
): Promise<UpdateBirthdayV2OrderResult> {
  await requireAdminSession();

  const validationError = validateBirthdayV2OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const existingOrder = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: originalSlug }, include: { template: true } }),
  );
  if (!existingOrder) {
    return { ok: false, error: "Order not found — it may have been deleted." };
  }
  if (existingOrder.template.componentKey !== "birthday-v2") {
    return { ok: false, error: "This order is not a Birthday V2 order." };
  }

  const slug = input.slug.trim();
  const siteData = buildBirthdayV2SiteData(input);

  try {
    const updated = await withRetry(() =>
      prisma.order.update({
        where: { slug: originalSlug },
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim() || "(not provided)",
        },
      }),
    );
    return { ok: true, slug: updated.slug };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to update Birthday V2 order:", error);
    return { ok: false, error: "Something went wrong updating the order. Please try again." };
  }
}
