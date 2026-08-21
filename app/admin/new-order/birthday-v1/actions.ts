"use server";

import { requireAdminSession } from "@/lib/adminAuth";
import { prisma, withRetry } from "@/lib/db";
import { siteDataToOrderFields } from "@/lib/orderMapper";

import {
  buildBirthdayV1SiteData,
  validateBirthdayV1OrderInput,
  type BirthdayV1OrderInput,
} from "../../_shared/birthdayV1Order";

// Lowercase letters/digits, single dashes as separators — no leading/
// trailing/doubled dashes, no uppercase, no underscores or spaces.
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

export type CreateBirthdayOrderInput = BirthdayV1OrderInput;
export type CreateBirthdayOrderResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createBirthdayV1Order(
  input: CreateBirthdayOrderInput,
): Promise<CreateBirthdayOrderResult> {
  await requireAdminSession();

  // Server-side re-validation — the client already checked all of this
  // before ever calling this action, but a Server Action must never trust
  // its own caller (this project's own node_modules/next/dist/docs/01-app/
  // 02-guides/authentication.md explicitly says to treat Server Actions
  // like public-facing endpoints).
  const validationError = validateBirthdayV1OrderInput(input);
  if (validationError) return { ok: false, error: validationError };

  const slug = input.slug.trim();

  const template = await withRetry(() =>
    prisma.template.findUnique({ where: { componentKey: "birthday-v1" } }),
  );
  if (!template) {
    return {
      ok: false,
      error:
        'No Template row found with componentKey "birthday-v1" — seed it first (see prisma/seed.ts).',
    };
  }

  const siteData = buildBirthdayV1SiteData(input);

  try {
    const order = await withRetry(() =>
      prisma.order.create({
        data: {
          ...siteDataToOrderFields(siteData),
          slug,
          customerName: input.customerName.trim(),
          // The Order schema's customerEmail column is required
          // (non-nullable) even though this form treats email as
          // optional per this task's own spec — falls back to a clear
          // placeholder rather than writing an empty string.
          customerEmail: input.customerEmail.trim() || "(not provided)",
          template: { connect: { id: template.id } },
        },
      }),
    );
    return { ok: true, slug: order.slug };
  } catch (error) {
    // P2002 = Prisma's unique-constraint-violation code — the slug's own
    // uniqueness is already checked client-side via checkSlugAvailable
    // above, but a race (two admins submitting the same slug at once)
    // could still slip past that, so this is the authoritative guard.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "That slug is already taken — choose a different one." };
    }
    console.error("Failed to create Birthday V1 order:", error);
    return { ok: false, error: "Something went wrong creating the order. Please try again." };
  }
}
