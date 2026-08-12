/**
 * Manually inserts one Order into the database — run with:
 *
 *   npx tsx lib/scripts/createOrder.ts
 *
 * We're taking orders via DM for now: edit `orderInput` below with the
 * customer's details (and their site content, in place of `dummySiteData`),
 * then run the script. It prints the generated slug / URL on success.
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { dummySiteData } from "@/lib/dummyData";
import { siteDataToOrderFields } from "@/lib/orderMapper";
import { generateSlug } from "@/lib/slug";
import type { SiteData } from "@/types/site";

interface OrderInput {
  templateComponentKey: string;
  customerName: string;
  customerEmail: string;
  accessPin?: string;
  data: SiteData;
}

// EDIT THIS for each new order.
const orderInput: OrderInput = {
  templateComponentKey: "anniversary-v1",
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  data: dummySiteData,
};

async function createOrder(input: OrderInput) {
  const template = await prisma.template.findUniqueOrThrow({
    where: { componentKey: input.templateComponentKey },
  });

  const order = await prisma.order.create({
    data: {
      ...siteDataToOrderFields(input.data),
      slug: generateSlug(),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      accessPin: input.accessPin ?? null,
      template: { connect: { id: template.id } },
    },
  });

  return order;
}

createOrder(orderInput)
  .then(async (order) => {
    console.log("Order created:", order.slug);
    console.log("URL: /site/" + order.slug);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
