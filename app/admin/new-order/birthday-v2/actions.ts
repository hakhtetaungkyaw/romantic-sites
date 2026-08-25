"use server";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";
import { siteDataToOrderFields } from "@/lib/orderMapper";

import {
  buildBirthdayV2SiteData,
  validateBirthdayV2OrderInput,
  type BirthdayV2OrderInput,
} from "../../_shared/birthdayV2Order";

// Same pattern as every other new-order/*/actions.ts.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string }> {
  await requireAdminSession();

  const trimmed = slug.trim();
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

export type CreateBirthdayOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createBirthdayV2Order(
  input: BirthdayV2OrderInput,
): Promise<CreateBirthdayOrderResult> {
  await requireAdminSession();

  const validationError = validateBirthdayV2OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const slug = input.slug.trim();

  const template = await withRetry(() =>
    prisma.template.findUnique({ where: { componentKey: "birthday-v2" } }),
  );
  if (!template) {
    return {
      ok: false,
      error: 'No Template row found with componentKey "birthday-v2" — seed it first (see prisma/seed.ts).',
    };
  }

  const siteData = buildBirthdayV2SiteData(input);

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
    console.error("Failed to create Birthday V2 order:", error);
    return { ok: false, error: "Something went wrong creating the order. Please try again." };
  }
}
