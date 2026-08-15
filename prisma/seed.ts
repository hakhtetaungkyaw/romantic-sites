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
