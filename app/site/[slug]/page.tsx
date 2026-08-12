import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AnniversaryV1 from "@/components/templates/AnniversaryV1";
import AnniversaryV2 from "@/components/templates/AnniversaryV2";
import { prisma } from "@/lib/db";
import { orderToSiteData } from "@/lib/orderMapper";
import type { SiteData } from "@/types/site";

const TEMPLATE_COMPONENTS: Record<
  string,
  (props: { data: SiteData }) => React.ReactElement
> = {
  "anniversary-v1": AnniversaryV1,
  "anniversary-v2": AnniversaryV2,
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrderSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const order = await prisma.order.findUnique({
    where: { slug },
    include: { template: true },
  });

  if (!order) {
    notFound();
  }

  const Template = TEMPLATE_COMPONENTS[order.template.componentKey];

  if (!Template) {
    notFound();
  }

  return <Template data={orderToSiteData(order)} />;
}
