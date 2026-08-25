import GoldenSkySection from "@/components/shared/ambient/GoldenSkySection";
import { V1SongProvider } from "@/components/shared/audio/V1SongPlayer";
import SunsetSignature from "@/components/shared/closing/SunsetSignature";
import SunflowerCountdown from "@/components/shared/countdown/SunflowerCountdown";
import SunlitPolaroids from "@/components/shared/gallery/SunlitPolaroids";
import GiftBoxUnlock from "@/components/shared/hero/GiftBoxUnlock";
import SunsetHero from "@/components/shared/hero/SunsetHero";
import PetalOracle from "@/components/shared/interactive/PetalOracle";
import SealedLetter from "@/components/shared/message/SealedLetter";
import SunsetTimeline from "@/components/shared/timeline/SunsetTimeline";
import { V1_BACKGROUND_GRADIENT } from "@/lib/v1SectionGradients";
import type { SiteData } from "@/types/site";

interface AnniversaryV1Props {
  data: SiteData;
}

// V1 "Golden Hour Sunflower" — full replacement of the old rose/burgundy
// template.
//
// V1_BACKGROUND_GRADIENT (lib/v1SectionGradients.ts, "Sand & Dusty Rose") is
// painted exactly ONCE, here, on this <main> — every one of the 7 sections
// below has a fully transparent background of its own. This is the only
// architecture that can produce zero hard edges: the gradient is a 4-stop
// light-to-dark slide (soft sand at the top down to a deeper dusty rose at
// the bottom), and restarting that same slide independently inside each
// section — which an earlier pass on this file did, after briefly trying
// the correct single-gradient version first — still produces a hard seam at
// every section boundary even when the gradient VALUE is identical across
// sections, because each section's own bottom (the gradient's darkest
// stop) sits directly above the next section's own top (the gradient's
// lightest stop). Painting it once here instead means this <main>'s real
// rendered height (the full stacked height of all 7 sections — min-h-screen
// is a floor, not a cap) is what the gradient spans, so there's no boundary
// for a seam to occur at in the first place. Each section's OTHER layers
// (glow effects, falling petals, sunflower/butterfly motifs, cards, text,
// the gallery lightbox, the timeline's own scroll-progress line) are
// unrelated to this and render on top of it exactly as before.
export default function AnniversaryV1({ data }: AnniversaryV1Props) {
  const {
    people,
    groupTitle,
    title,
    message,
    specialDate,
    photos,
    closingLine,
    milestones,
    songs,
    secretNote,
    goldenSkyCaption,
    goldenSkyLoveNote,
    goldenSkyPhoto,
  } = data;
  const song = songs?.[0];

  return (
    <V1SongProvider songUrl={song?.url} songTitle={song?.title}>
      <main
        className="relative min-h-screen overflow-hidden"
        style={{ background: V1_BACKGROUND_GRADIENT }}
      >
        <GiftBoxUnlock people={people} groupTitle={groupTitle}>
          <GoldenSkySection
            people={people}
            groupTitle={groupTitle}
            specialDate={specialDate}
            caption={goldenSkyCaption}
            loveNote={goldenSkyLoveNote}
            photo={goldenSkyPhoto}
          />
          <SunsetHero people={people} groupTitle={groupTitle} title={title} />

          <SealedLetter message={message} />

          <SunlitPolaroids photos={photos} />

          <SunsetTimeline milestones={milestones} />

          <SunflowerCountdown specialDate={specialDate} />

          <PetalOracle revealMessage={secretNote} />

          <SunsetSignature people={people} groupTitle={groupTitle} closingLine={closingLine} />
        </GiftBoxUnlock>
      </main>
    </V1SongProvider>
  );
}
