import "dotenv/config";

import { prisma } from "@/lib/db";

const templates = [
  {
    name: "Anniversary V1",
    category: "anniversary",
    componentKey: "anniversary-v1",
    price: 45000,
  },
  {
    name: "Anniversary V2",
    category: "anniversary",
    componentKey: "anniversary-v2",
    price: 65000,
  },
  {
    name: "Birthday V1",
    category: "birthday",
    componentKey: "birthday-v1",
    previewImage: "/template-preview/bdy-v1.png",
    // Placeholder — TemplateCard.tsx doesn't render price anywhere, this
    // only exists to satisfy the required Int column until real pricing
    // is decided.
    price: 0,
  },
  {
    name: "Birthday V2",
    category: "birthday",
    componentKey: "birthday-v2",
    price: 0,
    // Phase 1 build — only the entrance sequence exists, everything past it
    // is a placeholder. `isActive: false` keeps it off the PUBLIC homepage's
    // TemplateShowcase (app/page.tsx queries Template rows with
    // `isActive: true` directly — unrelated to
    // app/admin/_shared/NewOrderPicker.tsx's own hardcoded, always-active
    // entry for this template), so a real customer can't stumble onto it as
    // a purchasable option while the admin can still create orders for it
    // internally. Flip to true once enough phases are done to actually sell
    // this.
    isActive: false,
  },
];

async function main() {
  for (const template of templates) {
    await prisma.template.upsert({
      where: { componentKey: template.componentKey },
      update: template,
      create: template,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
