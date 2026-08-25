"use server";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";
import { siteDataToOrderFields } from "@/lib/orderMapper";

import {
  buildAnniversaryV2SiteData,
  validateAnniversaryV2OrderInput,
  type AnniversaryV2OrderInput,
} from "../../_shared/anniversaryV2Order";

// Lowercase letters/digits, single dashes as separators — same pattern
// new-order/anniversary-v1/actions.ts's own checkSlugAvailable uses.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string }> {
  await requireAdminSession();

  const trimmed = slug.trim();
  if (!SLUG_PATTERN.test(trimmed)) {
    return {
      available: false,
      reason: "Lowercase letters, numbers, and single dashes only (e.g. maya-and-alex-3-years).",
    };
  }

  const existing = await withRetry(() =>
    prisma.order.findUnique({ where: { slug: trimmed }, select: { id: true } }),
  );
  return { available: !existing };
}

export type CreateAnniversaryOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createAnniversaryV2Order(
  input: AnniversaryV2OrderInput,
): Promise<CreateAnniversaryOrderResult> {
  await requireAdminSession();

  // Server-side re-validation — the client already checked all of this
  // before ever calling this action, but a Server Action must never trust
  // its own caller.
  const validationError = validateAnniversaryV2OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const slug = input.slug.trim();

  const template = await withRetry(() =>
    prisma.template.findUnique({ where: { componentKey: "anniversary-v2" } }),
  );
  if (!template) {
    return {
      ok: false,
      error:
        'No Template row found with componentKey "anniversary-v2" — seed it first (see prisma/seed.ts).',
    };
  }

  const siteData = buildAnniversaryV2SiteData(input);

  try {
    const order = await withRetry(() =>
      prisma.order.create({
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim() || "(not provided)",
          template: { connect: { id: template.id } },
        },
      }),
    );
    return { ok: true, slug: order.slug };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to create Anniversary V2 order:", error);
    return { ok: false, error: "Something went wrong creating the order. Please try again." };
  }
}
