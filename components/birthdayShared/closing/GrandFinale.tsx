"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";

import confettiAnimation from "@/public/animations/confetti.json";

interface GrandFinaleProps {
  personName?: string;
  message: string;
  /** True once every Celebration Room object has been discovered — see
   *  templates/BirthdayV1.tsx for how that's derived. This component owns
   *  no discovery-tracking logic itself, it just renders whichever of its
   *  two states this flag says to. */
  unlocked: boolean;
}

// Birthday V1's own closing beat — checked Anniversary's own two closing
// components for a reference pattern (closing/Signature.tsx's V2 gold-heart
// draw-in, closing/SunsetSignature.tsx's V1 sunflower-Lottie centerpiece)
// per this task's own instruction, but this is a genuinely new,
// Birthday-specific implementation, not a shared/ported file — neither
// Anniversary closing component gates on a completion condition the way
// this one does (both play unconditionally once scrolled into view), and
// Birthday's own "confetti burst" concept has no Anniversary equivalent to
// begin with. Kept deliberately simpler than either of those two files for
// this first pass (a single fade/scale entrance + a one-shot confetti
// burst, not a whole choreographed multi-layer sequence with ambient
// petals/butterflies/glow) — per this task's own explicit "enhance later"
// scope.
export default function GrandFinale({ personName, message, unlocked }: GrandFinaleProps) {
  const heading = personName ? `Happy Birthday, ${personName}!` : "Happy Birthday!";

  return (
    <section className="relative overflow-hidden px-6 py-20 text-center">
      {/* Standing convention for any text/content transition in this
          project: AnimatePresence mode="wait" so the locked prompt and the
          unlocked finale can never crossfade/overlap. */}
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.p
            key="grand-finale-locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-[0.35em] text-[#6b4332]/45"
          >
            Discover everything above to reveal the grand finale
          </motion.p>
        ) : (
          <motion.div
            key="grand-finale-unlocked"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mx-auto max-w-xl"
          >
            {/* Confetti burst — mounts (and so only ever plays) the moment
                this branch first renders, i.e. exactly when `unlocked`
                flips true; loop={false} since this is meant to read as one
                discrete "burst" moment, not continuous ambient confetti
                rain. Sits behind the text (z-0 vs. the text's own z-10),
                pointer-events-none so it never blocks the page beneath it. */}
            <div className="pointer-events-none absolute inset-x-0 -top-10 z-0 mx-auto h-72 w-full max-w-md" aria-hidden="true">
              <Lottie animationData={confettiAnimation} loop={false} autoplay />
            </div>

            <h2 className="font-display relative z-10 text-4xl font-normal text-[#4a2f26] sm:text-5xl">
              {heading}
            </h2>

            <p className="font-display relative z-10 mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
