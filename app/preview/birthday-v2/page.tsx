import type { Metadata } from "next";

import BirthdayV2 from "@/components/templates/BirthdayV2";
import { dummyBirthdayV2Data } from "@/lib/dummyData";

// Dev-only visual QA route — renders the full Birthday V2 template (today,
// that's entirely hero/CountdownReveal.tsx's entrance sequence plus its
// placeholder) against hardcoded dummyBirthdayV2Data, no DB/admin-form round
// trip needed to see it. Same pattern as every other app/preview/* page
// (e.g. app/preview/birthday-v1/page.tsx).
//
// Unlike every existing app/preview/* page, this one sets its own
// noindex/nofollow metadata directly — app/robots.ts only disallows /site/
// and /admin/, not /preview/, and no sitemap.ts exists, so none of the
// existing preview routes are actually excluded from indexing today. That's
// a pre-existing gap across all of them, not something new to this route;
// fixing it project-wide is out of scope here, but there's no reason this
// one new page should ship with the same gap when the fix is one export,
// the same one app/site/[slug]/page.tsx already uses for the same reason
// (an internal-only route with no reason to ever appear in search results).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BirthdayV2PreviewPage() {
  return <BirthdayV2 data={dummyBirthdayV2Data} />;
}
