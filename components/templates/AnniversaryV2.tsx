"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import CursorGlow from "@/components/shared/ambient/CursorGlow";
import NightSky from "@/components/shared/ambient/NightSky";
import Signature from "@/components/shared/closing/Signature";
import GlassCards from "@/components/shared/countdown/GlassCards";
import Magazine from "@/components/shared/gallery/Magazine";
import CinematicVideo from "@/components/shared/hero/CinematicVideo";
import LoveNote from "@/components/shared/interactive/LoveNote";
import ScrollProgressIndicator from "@/components/shared/interactive/ScrollProgressIndicator";
import SongPlayer, {
  type SongPlayerHandle,
} from "@/components/shared/interactive/SongPlayer";
import UnlockGate from "@/components/shared/interactive/UnlockGate";
import LetterCard from "@/components/shared/message/LetterCard";
import TypedPhrases from "@/components/shared/message/TypedPhrases";
import PlacesWeveBeen from "@/components/shared/places/PlacesWeveBeen";
import VerticalLine from "@/components/shared/timeline/VerticalLine";
import type { SiteData } from "@/types/site";

interface AnniversaryV2Props {
  data: SiteData;
}

export default function AnniversaryV2({ data }: AnniversaryV2Props) {
  const {
    people,
    groupTitle,
    title,
    videos,
    photos,
    specialDate,
    message,
    milestones,
    closingLine,
    songs,
    secretNote,
    places,
    typedPhrases,
  } = data;

  const heroVideo = videos?.find((video) => video.role === "hero");
  const momentVideo = videos?.filter((video) => video.role === "moment")[0];
  const song = songs?.[0];

  const songPlayerRef = useRef<SongPlayerHandle>(null);

  // Page-level scroll progress drives a slow, continuous shift between two
  // burgundy shades, so the background breathes gently instead of cutting
  // abruptly at each section boundary.
  const { scrollYProgress } = useScroll();
  const stopA = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#1a0a12", "#2b0f1a", "#1a0a12"],
  );
  const stopB = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#2b0f1a", "#3a1220", "#2b0f1a"],
  );
  const background = useMotionTemplate`linear-gradient(to bottom, ${stopA}, ${stopB}, ${stopA})`;

  return (
    <>
      {/* Mounted before the gate opens (hidden behind its z-50 overlay) so
          the <audio> element already exists when UnlockGate's onOpen fires —
          play() needs to run synchronously within the click that opens the
          gate, not 550ms later once this would otherwise first mount. */}
      <SongPlayer ref={songPlayerRef} songTitle={song?.title} songUrl={song?.url} />

      <UnlockGate onOpen={() => songPlayerRef.current?.play()}>
        <motion.main
          className="relative min-h-screen overflow-hidden"
          style={{ background }}
        >
          <CursorGlow />
          <ScrollProgressIndicator />
          <LoveNote note={secretNote} />

          <div className="relative z-10">
            {heroVideo ? (
              <CinematicVideo
                videoSrc={heroVideo.src}
                poster={photos[0]?.src}
                people={people}
                groupTitle={groupTitle}
                title={title}
              />
            ) : null}

            <GlassCards specialDate={specialDate} />

            <TypedPhrases phrases={typedPhrases} />

            <LetterCard message={message} />

            <NightSky specialDate={specialDate} />

            <Magazine photos={photos} />

            <VerticalLine milestones={milestones} />

            <PlacesWeveBeen places={places} />

            <Signature
              people={people}
              groupTitle={groupTitle}
              closingLine={closingLine}
            />
          </div>
        </motion.main>
      </UnlockGate>
    </>
  );
}
