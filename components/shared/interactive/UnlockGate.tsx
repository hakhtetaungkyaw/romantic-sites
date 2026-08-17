"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

interface UnlockGateProps {
  children: React.ReactNode;
  /**
   * Fired synchronously inside the click handler (before the opening
   * animation's setTimeout) so callers can start something like audio
   * playback within the same user-gesture call stack — required for browser
   * autoplay policies to treat it as user-initiated.
   */
  onOpen?: () => void;
}

// ---- Ambient star background — own local reimplementation of the enriched
// star technique built for gallery/Magazine.tsx's AmbientStars (same
// mulberry32 PRNG, same globals.css `twinkle` keyframe via CSS custom
// properties, same "featured star" tier — a brighter/bigger/glowing
// minority among plainer stars — and the same warm-white/gold color mix),
// not imported from it: per this project's architecture convention V2
// files stay independent of each other's component code. Fully
// deterministic from a fixed seed, computed once at module scope (same
// pattern ambient/NightSky.tsx's own top-level STARS array already uses) —
// identical on server and client, so no useSyncExternalStore/client-only
// gating is needed for this to be hydration-safe. ----
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

interface GateStar {
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

const GATE_STAR_COUNT = 80;
const GATE_STAR_WARM_WHITE = "#f7f2e7";
const GATE_STAR_GOLD = "#f2dfb0";

const GATE_STARS: GateStar[] = (() => {
  const rand = mulberry32(8821);
  return Array.from({ length: GATE_STAR_COUNT }, () => {
    // ~20% "featured" — bigger, brighter-peaking, visibly glowing — so the
    // eye catches specific sparkles rather than a uniform dim shimmer.
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
      color: rand() < 0.35 ? GATE_STAR_GOLD : GATE_STAR_WARM_WHITE,
    };
  });
})();

function GateStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {GATE_STARS.map((star, i) => (
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
    </div>
  );
}

// ---- Constellation heart — replaces the previous solid filled heart icon.
// Ten star points traced along the same heart silhouette the old
// HEART_PATH described, connected in sequence by straight gold line
// segments (closing back to the first point) rather than one continuous
// filled/stroked curve, so it genuinely reads as a constellation — discrete
// stars joined by connecting lines — rather than a smooth heart outline
// with a couple of accent points. Line color/glow (rgba(212,175,122,...)
// via drop-shadow, gold stroke, round caps) and the two-layer "one-time
// appear, then continuous breathing pulse" technique for each star point
// both mirror ambient/NightSky.tsx's own constellation heart (that file's
// HEART_GLINTS: an outer wrapper doing a one-time scale/opacity reveal,
// with an inner circle running its own independent infinite pulse) —
// matched conceptually, not imported, per V2's file-independence
// convention; NightSky draws one continuous curve with a few glint accents
// on it, this builds a genuine point-to-point network from scratch. ----
const CONSTELLATION_POINTS: { x: number; y: number }[] = [
  { x: 50, y: 10 }, // top-center dip
  { x: 27, y: -2 }, // left lobe peak
  { x: 4, y: 15 }, // left upper outer
  { x: 0, y: 32 }, // left widest outer
  { x: 14, y: 55 }, // left lower descent
  { x: 50, y: 88 }, // bottom tip
  { x: 86, y: 55 }, // right lower descent
  { x: 100, y: 32 }, // right widest outer
  { x: 96, y: 15 }, // right upper outer
  { x: 73, y: -2 }, // right lobe peak
];

const CONSTELLATION_SEGMENTS = CONSTELLATION_POINTS.map((point, i) => {
  const next = CONSTELLATION_POINTS[(i + 1) % CONSTELLATION_POINTS.length];
  return { x1: point.x, y1: point.y, x2: next.x, y2: next.y };
});

// Draw-in pacing: each segment's own pathLength animation is 0.5s, starting
// SEGMENT_STAGGER apart, so the lines connect one at a time rather than all
// snapping in together — the "constellation forming" beat the brief asks
// for. A given point's star "pops in" right as the segment reaching it
// would have just finished drawing.
const SEGMENT_STAGGER = 0.15;
const SEGMENT_DRAW_DURATION = 0.5;

function ConstellationHeart() {
  return (
    <>
      {CONSTELLATION_SEGMENTS.map((segment, i) => (
        <motion.line
          key={i}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke="#d4af7a"
          strokeWidth={0.8}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: SEGMENT_DRAW_DURATION, delay: i * SEGMENT_STAGGER, ease: "easeInOut" }}
          style={{
            filter: "drop-shadow(0 0 3px rgba(212,175,122,0.55)) drop-shadow(0 0 7px rgba(212,175,122,0.3))",
          }}
        />
      ))}

      {CONSTELLATION_POINTS.map((point, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * SEGMENT_STAGGER + SEGMENT_DRAW_DURATION * 0.6, ease: "easeOut" }}
          style={{ transformOrigin: `${point.x}px ${point.y}px` }}
        >
          {/* Continuous gentle breathing pulse, independent of the
              one-time appear animation on the wrapping <g> above — same
              two-layer technique NightSky's own heart glints use. */}
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={2.4}
            fill="#fdf3df"
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2.4 + (i % 4) * 0.3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              transformOrigin: `${point.x}px ${point.y}px`,
              filter: "drop-shadow(0 0 3px rgba(253,243,223,0.85))",
            }}
          />
        </motion.g>
      ))}
    </>
  );
}

const heartVariants: Variants = {
  idle: {
    scale: [1, 1.07, 1],
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  opening: {
    scale: [1, 1.35, 0.85],
    rotate: [0, -8, 6, 0],
    opacity: [1, 1, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

export default function UnlockGate({ children, onOpen }: UnlockGateProps) {
  // No Math.random()/time-based values anywhere in this file — GATE_STARS
  // above is a fixed-seed deterministic array computed once at module
  // scope, so the initial (unopened) render stays identical on server and
  // client. Hydration-safe by construction, same as before this pass.
  const [opened, setOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Fired synchronously within this click handler — not after the
    // setTimeout below — so it still counts as user-initiated for browser
    // autoplay policies.
    onOpen?.();
    // Let the burst animation play before the overlay itself fades, so the
    // "opening" feels like a distinct beat rather than an instant cut.
    window.setTimeout(() => setOpened(true), 550);
  };

  return (
    <>
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="unlock-gate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0a12] via-[#150f30] to-[#0d0a1a] px-6 text-center"
          >
            <GateStars />

            <button
              type="button"
              onClick={handleOpen}
              aria-label="Open your gift"
              className="group relative flex flex-col items-center gap-8 focus:outline-none"
            >
              <span className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
                <motion.svg
                  viewBox="0 0 100 90"
                  className="relative h-14 w-14 overflow-visible sm:h-16 sm:w-16"
                  variants={heartVariants}
                  animate={isOpening ? "opening" : "idle"}
                >
                  <ConstellationHeart />
                </motion.svg>
              </span>

              <span>
                <span className="font-display block text-2xl text-[#faf5f0] sm:text-3xl">
                  A gift is waiting for you
                </span>
                <span className="mt-3 block text-xs uppercase tracking-[0.35em] text-[#d4af7a]/80">
                  Tap to open
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {opened && children}
    </>
  );
}
