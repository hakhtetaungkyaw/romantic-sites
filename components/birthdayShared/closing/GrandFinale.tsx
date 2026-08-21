"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useMemo, useState } from "react";

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
// begin with.
//
// This pass adds a word-by-word message reveal (checked message/
// TypedPhrases.tsx (Anniversary V2) for its own char-by-char typewriter
// hydration-safe pattern per this task's own instruction — same "start
// empty/at zero on mount, run the reveal loop only inside a useEffect"
// shape, reimplemented locally for whole words instead of characters,
// since this file stays independent of that one's code) plus a warm
// atmosphere pass (dot-pattern background, a soft bordered panel around
// the message, restrained ambient sparkles) — all reimplemented locally
// from techniques already established elsewhere in this product line
// (interactive/CelebrationHub.tsx's own dot-pattern/AmbientConfetti,
// message/SealedLetter.tsx's own warm-paper panel language), not shared
// imports, per this project's standing file-isolation convention.

// ---- Dot-pattern background — same recipe
// templates/BirthdayV1.tsx's own HUB_PATTERN_BACKGROUND uses for the hub
// screen, reimplemented locally here rather than imported (that constant
// is template-scoped, not exported, and even if it were, this file stays
// independent per this project's isolation convention). Applied to this
// component's own root section — unlike the hub, which needs to cover a
// sibling (interactive/RoomProgress) painted one level up, this component
// IS the entire "finale" view's content (aside from
// templates/BirthdayV1.tsx's own fixed FinaleBackButton overlay), so
// painting it here directly has no seam to worry about. ----
const FINALE_PATTERN_BACKGROUND = {
  backgroundImage:
    "radial-gradient(circle, rgba(217,122,95,0.16) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(212,145,154,0.14) 1.5px, transparent 1.5px), linear-gradient(to bottom, #fdf6ec 0%, #f0dfc0 100%)",
  backgroundSize: "28px 28px, 28px 28px, 100% 100%",
  backgroundPosition: "0 0, 14px 14px, 0 0",
};

// ---- Restrained ambient sparkles — same small-sparkle vocabulary
// interactive/CelebrationHub.tsx's own AmbientConfetti uses (the
// sparklePath bezier construction, an opacity/scale twinkle loop),
// reimplemented locally at a much smaller count and sparkles-only (no
// rect/oval confetti pieces) — this is the emotional climax, meant to read
// as elegant/restrained rather than the hub's own playful "party" density.
// Hand-placed, not generated — same "needs to look deliberately arranged"
// reasoning every other fixed decorative layout in this project's Birthday
// files gives — and kept to the far edges/corners, clear of the centered
// max-w-xl content column and the full-viewport confetti-burst Lottie
// (see this file's own JSX below). ----
function sparklePath(size: number): string {
  const s = size;
  const inner = s * 0.15;
  return `M0,${-s} C${inner},${-inner} ${inner},${-inner} ${s},0 C${inner},${inner} ${inner},${inner} 0,${s} C${-inner},${inner} ${-inner},${inner} ${-s},0 C${-inner},${-inner} ${-inner},${-inner} 0,${-s} Z`;
}

interface FinaleSparkleConfig {
  leftPct: number;
  topPct: number;
  size: number;
  duration: number;
  delay: number;
}

const FINALE_SPARKLES: FinaleSparkleConfig[] = [
  { leftPct: 6, topPct: 12, size: 20, duration: 2.6, delay: 0 },
  { leftPct: 93, topPct: 16, size: 29, duration: 3, delay: 0.6 },
  { leftPct: 4, topPct: 52, size: 62, duration: 2.4, delay: 1.2 },
  { leftPct: 95, topPct: 56, size: 29.5, duration: 2.8, delay: 0.4 },
  { leftPct: 10, topPct: 88, size: 19, duration: 3.2, delay: 1.6 },
  { leftPct: 90, topPct: 90, size: 28.5, duration: 2.6, delay: 0.9 },
];

function FinaleAmbientSparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {FINALE_SPARKLES.map((sparkle, i) => {
        const half = sparkle.size;
        return (
          <motion.svg
            key={i}
            viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
            width={half * 2}
            height={half * 2}
            className="absolute overflow-visible"
            style={{ left: `${sparkle.leftPct}%`, top: `${sparkle.topPct}%` }}
            initial={{ opacity: 0.25, scale: 0.75 }}
            animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.75, 1.05, 0.75] }}
            transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay, ease: "easeInOut" }}
          >
            <path d={sparklePath(half)} fill="#fff3d6" stroke="#f0a05c" strokeWidth={0.5} />
          </motion.svg>
        );
      })}
    </div>
  );
}

// ---- Word-by-word message reveal ------------------------------------------
// Same hydration-safe shape message/TypedPhrases.tsx's own useTypewriter
// documents (empty/zero on both server and first client paint, the actual
// reveal loop only ever starts inside a useEffect) — reimplemented locally
// for whole words rather than characters, and a one-shot forward reveal
// rather than that file's own type/pause/delete/loop cycle, since this is
// a single message shown once, not a repeating rotation of short phrases.
// In practice this component's own "unlocked" branch never exists during
// SSR anyway (`unlocked` is derived from discoveredCount state that always
// starts at 0/false in templates/BirthdayV1.tsx, so the very first render
// — server or client — is always the locked branch), but following the
// same safe pattern here regardless costs nothing and keeps this file
// consistent with the rest of the project's established convention rather
// than relying on that incidental fact.
//
// 110ms per word sits in the middle of this task's own 80-150ms guidance —
// fast enough that a ~100-130 word message finishes in roughly 11-14s
// (reads as a natural, unhurried pace, not a sluggish crawl), slow enough
// that each word is individually noticeable arriving, the same "streaming
// response" quality the task asks for.
const MS_PER_WORD = 110;
const WORD_POP_TRANSITION = { duration: 0.3, ease: "easeOut" as const };

function useWordReveal(message: string, msPerWord: number) {
  const words = useMemo(() => (message.trim().length > 0 ? message.trim().split(/\s+/) : []), [message]);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (words.length === 0) return;

    let count = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      count += 1;
      setRevealedCount(count);
      if (count < words.length) {
        timeoutId = setTimeout(tick, msPerWord);
      }
    };

    timeoutId = setTimeout(tick, msPerWord);
    return () => clearTimeout(timeoutId);
  }, [words, msPerWord]);

  return { words, revealedCount };
}

export default function GrandFinale({ personName, message, unlocked }: GrandFinaleProps) {
  const heading = personName ? `Happy Birthday, ${personName}!` : "Happy Birthday!";
  const { words, revealedCount } = useWordReveal(message, MS_PER_WORD);

  return (
    <section
      className="relative overflow-hidden px-6 py-20 text-center"
      style={FINALE_PATTERN_BACKGROUND}
    >
      <FinaleAmbientSparkles />

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
            className="relative z-10 text-xs uppercase tracking-[0.35em] text-[#6b4332]/45"
          >
            Discover everything above to reveal the grand finale
          </motion.p>
        ) : (
          <motion.div
            key="grand-finale-unlocked"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 mx-auto max-w-xl"
          >
            {/* Confetti burst — standardized to match
                hero/BirthdayGate.tsx's own established treatment (checked
                directly): a viewport-filling container, letting
                confetti.json's own particle choreography read as
                launching from the true bottom edge of the whole screen,
                rather than the small max-w-md box above the heading this
                used to be capped to. `fixed inset-0` here (rather than
                Gate's own `absolute inset-0`) achieves that same
                full-viewport coverage regardless of this view's own
                content height — Gate's ancestor already spans the exact
                viewport, so `absolute` is equivalent there, but this
                component sits inside templates/BirthdayV1.tsx's own
                scrollable view wrapper, where `absolute` would only cover
                this section's own (potentially taller-than-viewport) box;
                `fixed` is the same fix interactive/CakeCustomizer.tsx's
                own save-confetti already uses for the identical reason.
                z-20 matches Gate's own value exactly, putting this in
                front of this branch's own z-10 heading/message — the same
                "confetti bursts over the content" relationship both Gate
                and CakeCustomizer already share, not sitting behind the
                text the way this used to. Mounts (and so only ever plays)
                the moment this branch first renders, i.e. exactly when
                `unlocked` flips true; loop={false} since this is meant to
                read as one discrete "burst" moment, not continuous
                ambient confetti rain. pointer-events-none so it never
                blocks the page beneath it. */}
            <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
              <Lottie animationData={confettiAnimation} loop={false} autoplay />
            </div>

            <h2 className="font-display relative z-10 text-4xl font-normal text-[#4a2f26] sm:text-5xl">
              {heading}
            </h2>

            {/* Soft warm glow + a gentle translucent bordered panel around
                the message — checked message/SealedLetter.tsx /
                interactive/RevealCard.tsx for the established warm-paper
                visual language (cream/rose-gold border, soft warm shadow)
                per this task's own instruction, but deliberately lighter
                than either: no opaque paper fill, no grain texture, no
                ruled lines — just enough frame that the message reads as a
                considered moment rather than plain text floating on the
                background, without becoming a hard modal-style box. The
                dot pattern still shows faintly through the panel's own
                translucent fill. */}
            <div className="relative mt-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-[32px] blur-2xl"
                style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(232,184,105,0.25) 0%, rgba(232,184,105,0) 70%)" }}
              />
              <div className="rounded-[28px] border border-[#c9a68a]/35 bg-[#fffbf2]/50 px-8 py-12 shadow-[0_20px_60px_-20px_rgba(107,67,50,0.25)] backdrop-blur-[2px] sm:px-12 sm:py-14">
                <p className="font-display mx-auto text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">
                  {words.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 6, scale: 0.94 }}
                      animate={
                        i < revealedCount
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 0, y: 6, scale: 0.94 }
                      }
                      transition={WORD_POP_TRANSITION}
                      className="inline-block"
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
