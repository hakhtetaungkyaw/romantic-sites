import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AnniversaryV1 from "@/components/templates/AnniversaryV1";
import AnniversaryV2 from "@/components/templates/AnniversaryV2";
import BirthdayV1 from "@/components/templates/BirthdayV1";
import BirthdayV2 from "@/components/templates/BirthdayV2";
import { prisma, withRetry } from "@/lib/db";
import { orderToSiteData } from "@/lib/orderMapper";
import type { SiteData } from "@/types/site";

const TEMPLATE_COMPONENTS: Record<
  string,
  (props: { data: SiteData }) => React.ReactElement
> = {
  "anniversary-v1": AnniversaryV1,
  "anniversary-v2": AnniversaryV2,
  "birthday-v1": BirthdayV1,
  "birthday-v2": BirthdayV2,
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Shown in place of the real template when an order has been archived (see
// app/admin/orders/[slug]/ArchiveOrderButton.tsx) — a deliberate 200 with a
// distinct message, not `notFound()`. The person hitting this link is
// almost always the actual gift recipient a real customer sent it to, not
// a stranger probing for valid slugs, so treating "archived" the same as
// "never existed" would read as a broken link/technical failure rather
// than what it is: an intentional removal. A plain 404 is still exactly
// right for a slug that never existed at all (see the `!order` branch
// below, unchanged) — this branch only ever applies to a real order an
// admin chose to take down, which is closer to HTTP 410 Gone in spirit
// than 404 Not Found, even though a page component has no simple hook to
// send a literal 410 status the way `notFound()` sends a 404. Deliberately
// generic (no order-specific detail leaked) and template-agnostic — this
// sits before the TEMPLATE_COMPONENTS lookup below, so it applies to every
// category/template (Birthday and Anniversary alike), not just birthday-v1.
function ArchivedExperience() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ background: "linear-gradient(to bottom, #fdf6ec 0%, #f0dfc0 100%)" }}
    >
      <p className="font-display text-2xl text-[#4a2f26] sm:text-3xl">This experience is no longer available</p>
      <p className="max-w-sm text-sm text-[#6b4332]/70">
        The link you followed has been taken down. If you think this is a mistake, reach out to whoever shared it
        with you.
      </p>
    </main>
  );
}

export default async function OrderSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { slug },
      include: { template: true },
    }),
  );

  if (!order) {
    notFound();
  }

  if (order.isArchived) {
    return <ArchivedExperience />;
  }

  const Template = TEMPLATE_COMPONENTS[order.template.componentKey];

  if (!Template) {
    notFound();
  }

  return <Template data={orderToSiteData(order)} />;
}
