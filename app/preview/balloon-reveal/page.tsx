import BalloonReveal from "@/components/birthdayShared/interactive/BalloonReveal";
import { dummyBirthdayData } from "@/lib/dummyData";
import type { BirthdayCustomData } from "@/types/site";

// Temporary, phase-scoped preview — renders only BalloonReveal in isolation
// so it can be reviewed before the rest of the Birthday V1 "Celebration
// Room" template is built out. Safe to delete once that lands. Same pattern
// as app/preview/birthday-gate/page.tsx.
export default function BalloonRevealPreviewPage() {
  const birthday = dummyBirthdayData.customData?.birthday as BirthdayCustomData;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ECE9E6] py-16">
      <BalloonReveal
        messages={birthday.balloonMessages}
        completionMessage={birthday.balloonCompletionMessage}
        photoUrl={dummyBirthdayData.photos[0]?.src}
      />
    </main>
  );
}
