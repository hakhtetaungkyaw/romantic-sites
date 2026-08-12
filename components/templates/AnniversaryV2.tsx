"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";

import CursorGlow from "@/components/shared/ambient/CursorGlow";
import NightSky from "@/components/shared/ambient/NightSky";
import Signature from "@/components/shared/closing/Signature";
import GlassCards from "@/components/shared/countdown/GlassCards";
import Magazine from "@/components/shared/gallery/Magazine";
import Video from "@/components/shared/gallery/Video";
import CinematicVideo from "@/components/shared/hero/CinematicVideo";
import LoveNote from "@/components/shared/interactive/LoveNote";
import ScrollProgressIndicator from "@/components/shared/interactive/ScrollProgressIndicator";
import SongPlayer from "@/components/shared/interactive/SongPlayer";
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
    <UnlockGate>
      <motion.main
        className="relative min-h-screen overflow-hidden"
        style={{ background }}
      >
        <CursorGlow />
        <ScrollProgressIndicator />
        <SongPlayer songTitle={song?.title} songUrl={song?.url} />
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

          <Video videoSrc={momentVideo?.src} caption={momentVideo?.caption} />

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
  );
}
