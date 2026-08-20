import MemoryFrames from "@/components/birthdayShared/interactive/MemoryFrames";
import { dummyBirthdayData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only MemoryFrames in isolation
// so it can be reviewed before the rest of the Birthday V1 "Celebration
// Room" template is built out. Safe to delete once that lands. Same
// pattern as app/preview/birthday-gate/page.tsx,
// app/preview/balloon-reveal/page.tsx, and app/preview/gift-unwrap/page.tsx.
export default function MemoryFramesPreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ECE9E6] py-16">
      <MemoryFrames photos={dummyBirthdayData.photos} />
    </main>
  );
}
