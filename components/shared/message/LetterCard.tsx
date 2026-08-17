"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StoryLetterProps {
  message: string;
}

// ---- Ambient star/glow background — own local reimplementation of the
// enriched star technique built earlier this session for
// gallery/Magazine.tsx's AmbientStars and interactive/UnlockGate.tsx's
// GateStars (same mulberry32 PRNG, same globals.css `twinkle` keyframe via
// CSS custom properties, same "featured star" tier — a brighter/bigger/
// glowing minority among plainer stars — same warm-white/gold color mix),
// not imported from either: per this project's architecture convention V2
// files stay independent of each other's component code. Fully
// deterministic from a fixed seed, computed once at module scope — no
// Math.random() anywhere in this file. Untouched by this pass. ----
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface LetterStar {
  x: number;
  y: number;
  size: number;
  minOpacity: number;
  maxOpacity: number;
  glow: number;
  glowOpacity: number;
  duration: number;
  delay: number;
  color: string;
}

const LETTER_STAR_COUNT = 56;
const LETTER_STAR_WARM_WHITE = "#f7f2e7";
const LETTER_STAR_GOLD = "#f2dfb0";

const LETTER_STARS: LetterStar[] = (() => {
  const rand = mulberry32(3391);
  return Array.from({ length: LETTER_STAR_COUNT }, () => {
    const featured = rand() < 0.2;
    return {
      x: rand() * 100,
      y: rand() * 100,
      size: featured ? 2.2 + rand() * 1.6 : 1 + rand() * 1.4,
      minOpacity: 0.18 + rand() * 0.1,
      maxOpacity: featured ? 0.85 + rand() * 0.15 : 0.5 + rand() * 0.3,
      glow: featured ? 3 + rand() * 3 : rand() * 1.5,
      glowOpacity: featured ? 0.55 + rand() * 0.3 : rand() * 0.2,
      duration: 2.2 + rand() * 2.6,
      delay: rand() * 5,
      color: rand() < 0.35 ? LETTER_STAR_GOLD : LETTER_STAR_WARM_WHITE,
    };
  });
})();

function LetterAmbientStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LETTER_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              opacity: star.minOpacity,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              "--min-opacity": star.minOpacity,
              "--max-opacity": star.maxOpacity,
              "--min-scale": 0.85,
              "--max-scale": 1.2,
              "--glow": `${star.glow}px`,
              "--glow-opacity": star.glowOpacity,
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-[70vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:w-[55vw]"
        style={{ background: "radial-gradient(circle, rgba(212,175,122,0.14) 0%, rgba(212,175,122,0) 70%)" }}
      />
    </div>
  );
}

// A small gold diamond accent for each corner of the open paper — same
// color/glow language as gallery/Magazine.tsx's CornerOrnament, reimplemented
// fresh here rather than imported. Now a motion.span with its own mount
// fade/scale — it's only ever rendered once `contentReady` is true (see the
// component below), so its own initial->animate plays exactly when it's
// meant to "arrive."
function CornerAccent({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const placement: Record<typeof position, string> = {
    tl: "-left-1 -top-1",
    tr: "-right-1 -top-1",
    bl: "-left-1 -bottom-1",
    br: "-right-1 -bottom-1",
  };
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.7, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className={`pointer-events-none absolute ${placement[position]} h-2 w-2 rotate-45 bg-[#f2dfb0] shadow-[0_0_5px_rgba(212,175,122,0.6)]`}
    />
  );
}

// Unique id so this file's grain filter can never collide with another SVG
// <filter> elsewhere on the page.
const GRAIN_FILTER_ID = "story-letter-grain";

// ---- Scroll roller — the wooden/gold dowel end-cap at each side of the
// paper. One component, reused for both the small closed state and the
// tall open state (only the size classes passed in differ) — sharing a
// `layoutId` between those two renders is what lets Framer Motion smoothly
// FLIP-morph the compact closed roller into the tall open one (and back)
// based on each render's own measured position/size, rather than needing
// hand-computed pixel translate values that would break across viewport
// widths.
//
// Redesigned this pass to read as a turned rod rather than a plain rounded
// pill:
//   - The fill is now a horizontal (left-to-right, across the rod's own
//     WIDTH) multi-stop gradient — dark bronze at each edge, rising through
//     gold to a bright near-white highlight at the center — rather than the
//     previous vertical (top-to-bottom) fade, which couldn't suggest
//     roundness at all since it faded along the wrong axis. A horizontal
//     dark-light-dark sweep is what actually reads as "light wrapping
//     around a cylinder."
//   - `clipPath` chamfers all four corners by a small FIXED 3px (not a
//     percentage) so the facet reads as a consistent corner detail at both
//     the tiny closed size and the much taller open size, rather than
//     scaling into an exaggerated wedge on the tall version.
//   - A repeating horizontal band pattern suggests turned/lathed ridges
//     down the rod's length.
//   - Lighter/darker end-cap gradients at the very top and bottom suggest
//     the rod's own tip catching (or falling out of) the light.
function ScrollRoller({
  layoutId,
  className,
}: {
  layoutId: string;
  className: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ duration: UNROLL_DURATION, ease: "easeInOut" }}
      className={`relative shrink-0 overflow-hidden shadow-lg shadow-black/40 ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #4a3620 0%, #a67c3d 16%, #e0c084 38%, #fdf3df 50%, #e0c084 62%, #a67c3d 84%, #4a3620 100%)",
        clipPath:
          "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
      }}
    >
      {/* Turned/lathed ridge bands down the rod's length. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(0,0,0,0.16) 6px, rgba(0,0,0,0.16) 7px)",
        }}
      />

      {/* End-cap shading — a bright catch-light at the very top, a soft
          shadow at the very bottom. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: "linear-gradient(180deg, rgba(255,250,235,0.6) 0%, rgba(255,250,235,0) 100%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)" }}
      />

      {/* Central specular highlight, aligned with the gradient's own
          brightest stop. */}
      <span aria-hidden="true" className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-white/45" />
    </motion.div>
  );
}

// ---- Letter-by-letter reveal — V2's own fresh build, structurally similar
// to V1's message/SealedLetter.tsx TypewriterText (split into characters,
// each its own motion.span staggered via transition.delay, first character
// floated/enlarged as a drop cap) but not imported — different color token
// (V2's gold #d4af7a, not V1's terracotta), different timing constants, and
// V2's own drop-cap sizing (already tuned for this exact card's width in an
// earlier pass: text-6xl -> sm:text-7xl). Only ever mounted once
// `contentReady` is true, so it starts revealing right as the paper/border/
// ornaments have settled, not before. ----
const CHAR_DELAY = 0.014;
const REVEAL_BASE_DELAY = 0.3;

function TypedMessage({ text }: { text: string }) {
  const characters = Array.from(text);
  return (
    <p className="font-display relative text-lg leading-relaxed text-[#faf5f0]/90 sm:text-xl">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: REVEAL_BASE_DELAY + i * CHAR_DELAY }}
          className={
            i === 0
              ? "float-left mr-3 text-6xl font-medium leading-[0.8] text-[#d4af7a] sm:text-7xl"
              : undefined
          }
        >
          {char}
        </motion.span>
      ))}
    </p>
  );
}

const ROLLER_LEFT_ID = "story-scroll-roller-left";
const ROLLER_RIGHT_ID = "story-scroll-roller-right";
const PAPER_ID = "story-scroll-paper";

// Seconds — the shared layoutId FLIP's own duration (applied to the
// ScrollRoller/paper transitions below) and the delay before the settled
// border/corner-ornament/quote-mark/text group mounts. Both read off this
// single constant so the "arrives once the paper is fully expanded" timing
// can't drift out of sync with the FLIP animation it's meant to follow.
const UNROLL_DURATION = 0.9;
const UNROLL_DURATION_MS = UNROLL_DURATION * 1000;

// V2's counterpart to V1's message/SealedLetter.tsx — now a closed-scroll-
// to-unroll interaction rather than a static always-visible quote card
// (this file's own prior pass). Deliberately still not the SAME kind of
// interaction as interactive/UnlockGate.tsx's envelope-opening moment or
// LoveNote.tsx's wax-seal popover — a rolled paper scroll, not another
// envelope — so the template's three "unwrap something" beats (the entry
// gate, this card, and the later love note) each read as a distinct motif
// rather than the same gesture three times.
//
// STATE MACHINE:
//   - `unrolled` (false initially): drives which of the two blocks below is
//     mounted (wrapped in AnimatePresence, mode="popLayout" so the outgoing
//     closed block clears layout immediately and doesn't fight the
//     incoming open block's own FLIP). ScrollRoller and the paper element
//     share layoutIds across both blocks, so toggling this smoothly morphs
//     the compact rolled scroll into the full-width open card (and back)
//     via Framer Motion's shared-layout animation — no hand-computed
//     pixel translate values, so it holds up across viewport widths.
//   - `contentReady` (false initially): gates the gold border ring, corner
//     diamonds, quote marks, and the letter-by-letter text — all mounted
//     together, timed to arrive UNROLL_DURATION_MS after the paper starts
//     expanding, i.e. once it has actually reached its full size, matching
//     the brief's "fade/scale in as the paper reaches its full expanded
//     width." The paper's own base texture (inner glow gradient + faint
//     grain) is treated as intrinsic to the paper itself, not part of this
//     "arrives after" group — it's present (and grows with the paper)
//     throughout the unroll, not just once contentReady flips.
//
// RE-ROLL: two ways in, both calling the same handleReroll — clicking
// either roller end (a "grab the handle" affordance, kept from the prior
// pass), and a small "Tap to roll up" caption beneath the open paper
// (added this pass, mirroring the closed state's own "Tap to unroll"
// caption). Deliberately NOT click-anywhere-on-the-paper: the paper holds
// the quote text, and making the whole area a reroll trigger would fight
// with actually selecting/copying that text. Re-rolling is a direct
// snap-back (contentReady clears immediately, no bespoke reverse
// choreography for the border/ornaments/text — they simply unmount) while
// the roller/paper shared-layout FLIP reverses smoothly on its own, the
// same mechanism that opened it.
//
// No scroll-triggered reveal on this component at all (removed this pass,
// along with the now-unused scaleBlurVariant/viewportRepeat imports) — the
// prior pass's viewportRepeat (once: false) wrapper was replaying this
// section's entrance every time it scrolled in/out of view, layering an
// unwanted extra animation on top of the click-driven unroll/reroll, which
// is meant to be the only animation here. The section now just renders
// normally; idle sway/glow-pulse (closed state) and the unroll/reroll FLIP
// are the only motion.
export default function StoryLetter({ message }: StoryLetterProps) {
  const [unrolled, setUnrolled] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const contentReadyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (contentReadyTimeoutRef.current !== null) {
        window.clearTimeout(contentReadyTimeoutRef.current);
      }
    };
  }, []);

  const handleUnroll = () => {
    if (unrolled) return;
    setUnrolled(true);
    contentReadyTimeoutRef.current = window.setTimeout(() => setContentReady(true), UNROLL_DURATION_MS);
  };

  const handleReroll = () => {
    if (contentReadyTimeoutRef.current !== null) {
      window.clearTimeout(contentReadyTimeoutRef.current);
      contentReadyTimeoutRef.current = null;
    }
    setContentReady(false);
    setUnrolled(false);
  };

  return (
    <section className="relative overflow-hidden px-6 py-[120px]">
      <LetterAmbientStars />

      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="popLayout">
          {!unrolled ? (
            <motion.div key="closed" exit={{ opacity: 0 }} className="flex flex-col items-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Idle glow pulse, inviting interaction — reduced this
                    pass (was rgba(...,0.35) with -inset-4/blur-2xl and an
                    opacity range up to 0.8, reading as a dominant wash over
                    the starfield rather than a soft accent). */}
                <motion.span
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-full blur-xl"
                  style={{ background: "radial-gradient(circle, rgba(212,175,122,0.18) 0%, rgba(212,175,122,0) 70%)" }}
                  animate={{ opacity: [0.25, 0.5, 0.25] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <button
                  type="button"
                  onClick={handleUnroll}
                  aria-label="Unroll the letter"
                  className="relative flex items-center focus:outline-none"
                >
                  {/* Widened this pass: overall icon width was ~80px
                      (roller w-3/12px x2 + paper w-14/56px); now ~124px
                      (roller w-3.5/14px x2 + paper w-24/96px) — a ~1.55x
                      increase, within the requested 1.4-1.6x range. Height
                      bumped h-16->h-20 (64px->80px, 1.25x) alongside it —
                      width alone growing 1.55x while height stayed flat
                      would have read as the same icon simply stretched
                      wider; a smaller proportional height increase keeps
                      it reading as one cohesive, slightly larger object
                      instead. Roller width grew only modestly (12px->14px)
                      since the ask was for the PAPER to read as
                      substantially wider, with the rollers scaled up just
                      enough not to look undersized next to it — not
                      matching the paper's own 1.7x growth 1:1. */}
                  <ScrollRoller layoutId={ROLLER_LEFT_ID} className="h-20 w-3.5" />

                  <motion.div
                    layoutId={PAPER_ID}
                    transition={{ duration: UNROLL_DURATION, ease: "easeInOut" }}
                    className="relative h-20 w-24 shadow-inner shadow-black/20"
                    style={{
                      // Light in the vertical middle, darker toward the top
                      // and bottom edges — the paper's own surface curving
                      // away from view at a rolled cylinder's top/bottom,
                      // rather than the previous flat top-to-bottom fade.
                      background:
                        "linear-gradient(180deg, #c9a877 0%, #f7ecd2 14%, #fdf6ea 50%, #f2dfb8 86%, #c9a877 100%)",
                    }}
                  >
                    {/* Fold shading right at the top/bottom edges — where
                        the paper wraps around the roller underneath.
                        h-2 -> h-2.5, matching the paper's own 1.25x height
                        increase so the band keeps the same proportional
                        weight rather than looking thinner on the taller
                        paper. */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-2.5"
                      style={{ background: "linear-gradient(180deg, rgba(90,60,30,0.4) 0%, rgba(90,60,30,0) 100%)" }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2.5"
                      style={{ background: "linear-gradient(0deg, rgba(90,60,30,0.4) 0%, rgba(90,60,30,0) 100%)" }}
                    />

                    {/* Faint aged-paper grain — thin repeating horizontal
                        lines, low opacity. */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-[0.16]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(180deg, rgba(120,90,50,0.5) 0px, rgba(120,90,50,0.5) 1px, transparent 1px, transparent 4px)",
                      }}
                    />

                    {/* Thin gold ribbon tied around the rolled paper, with
                        a small embossed gold knot at the center — untied
                        as the scroll opens. Ribbon w-2->w-2.5 and knot
                        h-3/w-3->h-4/w-4 this pass — at the previous 56px-
                        wide paper a 12px knot read as a deliberate focal
                        accent, but on the new 96px-wide paper that same
                        12px knot would look small and lost rather than
                        scaling with the surface it sits on. */}
                    <motion.div
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-y-0 left-1/2 w-2.5 -translate-x-1/2"
                      style={{ background: "linear-gradient(90deg, #9c7a45 0%, #f2dfb0 45%, #d4af7a 55%, #8a6a3c 100%)" }}
                    >
                      {/* Ribbon fold crease down its own center. */}
                      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/20" />

                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 35% 30%, #fdf3df 0%, #d4af7a 45%, #8a6a3c 100%)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.45)",
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  <ScrollRoller layoutId={ROLLER_RIGHT_ID} className="h-20 w-3.5" />
                </button>
              </motion.div>

              {/* "Tap to unroll" — same tone/capitalization convention as
                  interactive/UnlockGate.tsx's "Tap to open" caption. */}
              <motion.span
                exit={{ opacity: 0 }}
                className="mt-5 text-xs uppercase tracking-[0.35em] text-[#d4af7a]/80"
              >
                Tap to unroll
              </motion.span>
            </motion.div>
          ) : (
            <motion.div key="open" className="flex w-full max-w-[720px] flex-col items-center">
            <div className="flex w-full items-stretch">
              <button
                type="button"
                onClick={handleReroll}
                aria-label="Roll the letter back up"
                className="shrink-0 cursor-pointer focus:outline-none"
              >
                <ScrollRoller layoutId={ROLLER_LEFT_ID} className="w-4 sm:w-5" />
              </button>

              <motion.div
                layoutId={PAPER_ID}
                transition={{ duration: UNROLL_DURATION, ease: "easeInOut" }}
                className="relative flex-1 bg-gradient-to-b from-[#2b0f1a]/70 via-[#1a0a12]/80 to-[#0d0509]/85 px-8 py-14 backdrop-blur-sm sm:px-12 sm:py-16"
              >
                {/* Paper's own intrinsic texture — present throughout the
                    unroll (grows with the paper), not gated behind
                    contentReady. Wrapped in its own inset-0 overflow-hidden
                    layer (rather than putting overflow-hidden on the paper
                    itself, as before) — the CornerAccent diamonds below
                    intentionally straddle the paper's edge via negative
                    offsets, and overflow-hidden on the paper was clipping
                    them away entirely, which is why they read as "missing." */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-0 h-1/2"
                    style={{ background: "radial-gradient(ellipse at top, rgba(212,175,122,0.14) 0%, rgba(212,175,122,0) 70%)" }}
                  />
                  <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
                    <filter id={GRAIN_FILTER_ID}>
                      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
                      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.6 0" />
                    </filter>
                    <rect width="100%" height="100%" filter={`url(#${GRAIN_FILTER_ID})`} />
                  </svg>
                </div>

                {contentReady && (
                  <>
                    <motion.div
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#d4af7a]/60"
                    />

                    <CornerAccent position="tl" />
                    <CornerAccent position="tr" />
                    <CornerAccent position="bl" />
                    <CornerAccent position="br" />

                    <motion.span
                      aria-hidden="true"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="font-display pointer-events-none absolute left-4 top-0 select-none text-8xl leading-none text-[#d4af7a]/20 sm:left-6 sm:text-9xl"
                    >
                      &ldquo;
                    </motion.span>

                    <TypedMessage text={message} />

                    <motion.span
                      aria-hidden="true"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="font-display pointer-events-none absolute bottom-0 right-4 select-none text-8xl leading-none text-[#d4af7a]/20 sm:right-6 sm:text-9xl"
                    >
                      &rdquo;
                    </motion.span>
                  </>
                )}
              </motion.div>

              <button
                type="button"
                onClick={handleReroll}
                aria-label="Roll the letter back up"
                className="shrink-0 cursor-pointer focus:outline-none"
              >
                <ScrollRoller layoutId={ROLLER_RIGHT_ID} className="w-4 sm:w-5" />
              </button>
            </div>

              {/* "Tap to roll up" — mirrors the closed state's own "Tap to
                  unroll" caption exactly (same size/tracking/color, same
                  position beneath the content), and is the primary
                  discoverable way to re-roll (the roller-end buttons above
                  still work too). Gated behind `contentReady` — previously
                  this faded in immediately when the unroll started, so it
                  appeared while the paper was still visibly mid-expansion
                  rather than once the letter had actually settled open,
                  which is likely why it didn't read as connected/
                  discoverable. Small px-3/py-1 padding widens the tap
                  target without changing how the text itself looks. */}
              {contentReady && (
                <motion.button
                  type="button"
                  onClick={handleReroll}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-5 -mx-3 -my-1 cursor-pointer rounded-full px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#d4af7a]/80 transition-colors hover:text-[#d4af7a] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d4af7a]/60"
                >
                  Tap to roll up
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
