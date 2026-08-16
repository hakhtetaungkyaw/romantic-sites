import { V1SongProvider } from "@/components/shared/audio/V1SongPlayer";
import SealedLetter from "@/components/shared/message/SealedLetter";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only SealedLetter in isolation
// so it can be reviewed before the rest of the V1 "Golden Hour" redesign is
// integrated into AnniversaryV1.tsx. Safe to delete once that lands.
//
// SealedLetter now calls useV1Song() (see audio/V1SongPlayer.tsx) to trigger
// the site's song on first open, so it needs a V1SongProvider ancestor here
// too — without one, useV1Song() throws since there's no context to read.
export default function SealedLetterPreviewPage() {
  const { message, songs } = dummySiteData;
  const song = songs?.[0];
  return (
    <V1SongProvider songUrl={song?.url} songTitle={song?.title}>
      <SealedLetter message={message} />
    </V1SongProvider>
  );
}
