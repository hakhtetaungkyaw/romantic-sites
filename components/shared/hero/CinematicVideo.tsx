"use client";

import { motion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

import FloatingHearts from "@/components/shared/ambient/FloatingHearts";
import { formatPeopleHeading } from "@/lib/people";
import { fadeUpVariant, staggerContainerVariant, viewportRepeat } from "@/lib/v2ScrollReveal";
import type { SitePerson } from "@/types/site";

interface CinematicHeroProps {
  videoSrc: string;
  poster?: string;
  people: SitePerson[];
  groupTitle?: string;
  title: string;
}

const letterContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035, delayChildren: 0.3 },
  },
};

const letterChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function AnimatedName({ text }: { text: string }) {
  return (
    <motion.span
      variants={letterContainer}
      initial="hidden"
      animate="visible"
      aria-label={text}
      className="inline"
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={i}
          variants={letterChild}
          aria-hidden="true"
          className={
            char === "&" ? "inline-block text-[#d4af7a]" : "inline-block"
          }
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function CinematicHero({
  videoSrc,
  poster,
  people,
  groupTitle,
  title,
}: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heading = formatPeopleHeading(people, groupTitle);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Some browsers ignore the JSX `muted` attribute on initial paint, which
    // silently blocks autoplay — setting the property directly guarantees it.
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={videoSrc}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#1a0a12]/75 via-[#2b0f1a]/50 to-[#1a0a12]" />

      <div className="absolute inset-0 z-[2]">
        <FloatingHearts count={10} color="#e8b4bc" />
      </div>

      <div className="relative z-10">
        {/* AnimatedName (the couple-names heading below) is its own
            letter-by-letter typing-style reveal — per the task spec, that
            stays untouched and isn't wrapped in the shared system. Only the
            secondary static text (this eyebrow + the tagline below) gets
            the shared staggerContainerVariant/fadeUpVariant treatment. Note
            this does shift their timing from the original hand-tuned
            sequence (eyebrow at 0s, tagline at a 1.3s delay, after the
            divider finished drawing at 1.1s) to firing together, near-
            immediately, via the shared stagger — since this hero is the
            first thing visible on load anyway (nothing to scroll into), the
            practical effect is minor, but the tagline may now appear
            slightly before the divider finishes drawing instead of after. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={staggerContainerVariant}
        >
          <motion.p
            variants={fadeUpVariant}
            className="mb-5 text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/80 sm:text-sm"
          >
            A love story
          </motion.p>

          <h1 className="font-display text-5xl font-medium text-[#faf5f0] sm:text-6xl md:text-7xl">
            <AnimatedName text={heading} />
          </h1>

          <motion.div
            className="mx-auto mt-7 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <svg width="120" height="2" viewBox="0 0 120 2" fill="none">
              <motion.line
                x1="0"
                y1="1"
                x2="120"
                y2="1"
                stroke="#d4af7a"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 1.1 }}
              />
            </svg>
          </motion.div>

          <motion.h2
            variants={fadeUpVariant}
            className="font-display mt-7 max-w-xl text-xl italic text-[#faf5f0]/80 sm:text-2xl"
          >
            {title}
          </motion.h2>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[#faf5f0]/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}
