import BirthdayGate from "@/components/birthdayShared/hero/BirthdayGate";
import { dummyBirthdayData } from "@/lib/dummyData";
import type { BirthdayCustomData } from "@/types/site";

// Temporary, phase-scoped preview — renders only BirthdayGate in isolation
// so it can be reviewed before the rest of the Birthday V1 "Celebration
// Room" template is built out. Safe to delete once that lands. Same pattern
// as Anniversary V1's own per-component previews (e.g.
// app/preview/sealed-letter/page.tsx, app/preview/sunflower-countdown/page.tsx).
export default function BirthdayGatePreviewPage() {
  const birthday = dummyBirthdayData.customData?.birthday as BirthdayCustomData;

  return (
    <BirthdayGate age={birthday.age} personName={dummyBirthdayData.people[0]?.name}>
      <main className="flex min-h-screen items-center justify-center bg-[#ECE9E6] px-6 text-center">
        <p className="font-sans text-base text-[#4a2f26]">
          Celebration Room — not built yet. The gate above has opened.
        </p>
      </main>
    </BirthdayGate>
  );
}
