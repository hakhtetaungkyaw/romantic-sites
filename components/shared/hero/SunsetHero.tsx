"use client";

import { motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useRef, useSyncExternalStore } from "react";

import { formatPeopleHeading } from "@/lib/people";
import type { SitePerson } from "@/types/site";

import butterflyAnimation from "@/public/animations/butterfly.json";

// V1 "Golden Hour / Sunset" design system — establishing this here, reused
// across all V1 components in later phases. Deliberately distinct from V2's
// dark "Night Sky" palette; no file here is shared with or imported by
// AnniversaryV2.tsx.
//   Background : muted peach -> dusty rose-tan -> warm cream,
//                #f5ddd0 -> #e8c4b0 -> #f0e0d0 (desaturated — no pure
//                orange/coral; reads as soft elegant light, not "candy")
//   Primary    : terracotta/coral #d97a5f
//   Secondary  : dusty rose #d4919a
//   Metallic   : rose gold #c9a68a (distinct from V2's champagne gold #d4af7a)
//   Text       : warm dark brown #4a2f26

interface SunsetHeroProps {
  people: SitePerson[];
  groupTitle?: string;
  title: string;
}

interface LightMote {
  id: number;
  left: number;
  size: number;
  glow: number;
  baseOpacity: number;
  driftDuration: number;
  driftDelay: number;
  pulseDuration: number;
}

const MOTE_COUNT = 22;

// ~35% are larger, more visibly glowing motes; the rest are tiny, barely-
// there specks — that split (not a uniform random range) is what gives the
// field depth instead of a flat scatter of same-ish dots.
function randomMote(id: number): LightMote {
  const isLarger = Math.random() < 0.35;
  const size = isLarger ? 3.5 + Math.random() * 3 : 1 + Math.random() * 1.8;
  return {
    id,
    left: Math.random() * 100,
    size,
    glow: isLarger ? 8 + Math.random() * 6 : 2 + Math.random() * 2,
    baseOpacity: isLarger ? 0.4 + Math.random() * 0.25 : 0.14 + Math.random() * 0.18,
    driftDuration: 12 + Math.random() * 12,
    driftDelay: -(Math.random() * 14),
    pulseDuration: 3 + Math.random() * 3,
  };
}

const EMPTY_MOTES: LightMote[] = [];

function noopSubscribe() {
  return () => { };
}

// Drifting warm light motes — same useSyncExternalStore pattern as
// ambient/FloatingHeartsV1.tsx: an empty, deterministic snapshot on the
// server and first client paint (so there's nothing for hydration to
// mismatch on), then the randomized client-only layout swaps in right after.
function LightMotes() {
  const cacheRef = useRef<LightMote[] | null>(null);

  const motes = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (!cacheRef.current) {
        cacheRef.current = Array.from({ length: MOTE_COUNT }, (_, i) => randomMote(i));
      }
      return cacheRef.current;
    },
    () => EMPTY_MOTES,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((mote) => (
        <motion.span
          key={mote.id}
          className="absolute rounded-full bg-[#f0d4a8]"
          style={{
            left: `${mote.left}%`,
            width: mote.size,
            height: mote.size,
            boxShadow: `0 0 ${mote.glow}px ${mote.glow * 0.4}px rgba(240,212,168,0.55)`,
          }}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{
            y: "-10vh",
            // Independent pulse layered on top of the drift — a slower,
            // separate loop (own duration/repeat) so motes visibly glow
            // brighter and dimmer as they rise, not just fade in once.
            opacity: [
              mote.baseOpacity * 0.4,
              mote.baseOpacity,
              mote.baseOpacity * 0.4,
            ],
          }}
          transition={{
            y: {
              duration: mote.driftDuration,
              delay: mote.driftDelay,
              repeat: Infinity,
              ease: "linear",
            },
            opacity: {
              duration: mote.pulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
}

interface ButterflyConfig {
  size: number;
  filter: string;
  duration: number;
  delay: number;
  ease: "easeInOut" | "easeOut" | "circInOut";
  opacity: number;
  // Waypoints span the FULL hero (0-100% of width/height), not a thin
  // strip — arrays must be the same length and close the loop (last entry
  // equal to the first) so repeat: Infinity restarts with no visible jump.
  // A waypoint repeated back-to-back (same x/y, two entries) creates a
  // genuine pause — the interpolation has nowhere to go during that span —
  // used for the one butterfly that "hovers" briefly before moving on.
  waypointsX: number[];
  waypointsY: number[];
  times: number[];
}

// public/animations/butterfly.json ships in deep blue/indigo (~hue 230°,
// like a Morpho butterfly) — off-palette for this warm sunset template. CSS
// hue-rotate() is NOT a plain HSL hue shift; browsers implement it as the
// SVG feColorMatrix luma-preserving matrix, so a naive "target - source"
// degree estimate lands noticeably off. Values below were derived by
// simulating that exact matrix (plus the saturate()/brightness() that
// follow it in the chain) against the animation's actual sampled fill
// colors (#3a4280, #6978b5, #2e376d) and checking the resulting hue/hex
// directly. First pass used saturate(1.5-1.6)/brightness(1.2-1.3), which
// landed on hue correctly but read as candy-pink/magenta — too saturated
// and too bright. This pass uses saturate(0.6) and brightness(0.95), which
// suppresses vividness enough to read as muted coral/dusty-rose/terracotta/
// gold rather than a lit-up cartoon wing, while the hue-rotate angles were
// re-picked so the four land specifically on those tones (checked against
// each target's actual HSL hue, not eyeballed):
//   coral       (~#d97a5f, hue 13°)  -> hue-rotate(130deg) -> output hue ~9-13°,  e.g. #936b64
//   dusty rose  (~#d4919a, hue 352°) -> hue-rotate(110deg) -> output hue ~351-354°, e.g. #966970
//   terracotta  (~#c17f5f, hue 20°)  -> hue-rotate(145deg) -> output hue ~20-24°, e.g. #8e6d5d
//   muted gold  (~#c9a68a, hue 27°)  -> hue-rotate(155deg) -> output hue ~28-31°, e.g. #8a6f58
// Results run darker than the reference hexes (the source Lottie's base
// color is a dark navy, and saturate(0.6) is luma-preserving, not
// lightness-boosting) but land exactly on the requested hues with zero
// pink/magenta.
const BUTTERFLY_FILTER_CORAL = "hue-rotate(130deg) saturate(0.6) brightness(0.95)"; // -> ~#936b64
const BUTTERFLY_FILTER_DUSTY_ROSE = "hue-rotate(110deg) saturate(0.6) brightness(0.95)"; // -> ~#966970
const BUTTERFLY_FILTER_TERRACOTTA = "hue-rotate(145deg) saturate(0.6) brightness(0.95)"; // -> ~#8e6d5d
const BUTTERFLY_FILTER_GOLD = "hue-rotate(155deg) saturate(0.6) brightness(0.95)"; // -> ~#8a6f58

// speed prop on <Lottie> (see Butterflies() below) — independent from the
// Framer Motion flight-path timing below, which stays untouched. Only the
// Lottie's own internal wing-flap playback speeds up.
const BUTTERFLY_FLAP_SPEED = 1.6;

// Fixed, hand-placed values — same hydration-safety reasoning as
// FLOWERS/CLOUDS/STARS elsewhere in this file and in ambient/NightSky.tsx:
// nothing here needs to differ session to session. Each path is a
// different hand-drawn shape so no two butterflies read as the same
// animation just offset in time. Zones partition the hero into a left
// column (upper/mid/lower), a right column (upper/mid/lower), and one
// top-center strip — 7 total, none overlapping — biased toward edges and
// corners, clear of the dead-center text column. Opacity stays moderate
// throughout as a second line of defense on the few segments that do brush
// past the text. Flap animation comes from the Lottie file's own baked-in
// wing keyframes (sped up via BUTTERFLY_FLAP_SPEED), not a per-instance
// flapPeriod.
const BUTTERFLIES: ButterflyConfig[] = [
  {
    // Upper-left quadrant, staying clear of center text.
    size: 64,
    filter: BUTTERFLY_FILTER_CORAL,
    duration: 18,
    delay: 0,
    ease: "easeInOut",
    opacity: 1,
    waypointsX: [6, 16, 10, 26, 22, 8, 6],
    waypointsY: [85, 62, 30, 14, 40, 60, 85],
    times: [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1],
  },
  {
    // Upper-right quadrant, mirrored zone from butterfly 1.
    size: 50,
    filter: BUTTERFLY_FILTER_DUSTY_ROSE,
    duration: 22,
    delay: 0,
    ease: "easeOut",
    opacity: 1,
    waypointsX: [92, 80, 88, 70, 76, 94, 92],
    waypointsY: [15, 38, 62, 78, 50, 25, 15],
    times: [0, 0.15, 0.32, 0.5, 0.68, 0.85, 1],
  },
  {
    // Top strip, hovering near top-center (above the text) without dipping
    // into the middle.
    size: 48,
    filter: BUTTERFLY_FILTER_GOLD,
    duration: 25,
    delay: 2,
    ease: "circInOut",
    opacity: 1,
    waypointsX: [30, 45, 45, 60, 68, 50, 35, 30],
    waypointsY: [6, 4, 4, 10, 6, 12, 8, 6],
    times: [0, 0.14, 0.28, 0.42, 0.58, 0.74, 0.9, 1],
  },
  {
    // Mid-left band (y 38-62) — new zone filling the gap between the
    // upper-left (y up to 30) and lower-left (y from 62) zones.
    size: 44,
    filter: BUTTERFLY_FILTER_TERRACOTTA,
    duration: 20,
    delay: 2,
    ease: "easeInOut",
    opacity: 1,
    waypointsX: [4, 18, 10, 20, 8, 4],
    waypointsY: [45, 40, 55, 60, 50, 45],
    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  },
  {
    // Mid-right band, mirrored zone from the new mid-left butterfly.
    size: 42,
    filter: BUTTERFLY_FILTER_CORAL,
    duration: 24,
    delay: 5,
    ease: "easeOut",
    opacity: 1,
    waypointsX: [96, 82, 90, 80, 92, 96],
    waypointsY: [55, 60, 45, 40, 50, 55],
    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  },
  {
    // Lower-left loop, near the sunflower field, distinct from butterfly 1's
    // upper-left zone (stays below y:55).
    size: 40,
    filter: BUTTERFLY_FILTER_DUSTY_ROSE,
    duration: 16,
    delay: 0,
    ease: "easeInOut",
    opacity: 1,
    waypointsX: [10, 24, 14, 32, 20, 8, 10],
    waypointsY: [92, 78, 62, 70, 88, 80, 92],
    times: [0, 0.17, 0.35, 0.52, 0.68, 0.85, 1],
  },
  {
    // Lower-right loop, mirrored zone from the lower-left butterfly.
    size: 59,
    filter: BUTTERFLY_FILTER_TERRACOTTA,
    duration: 30,
    delay: 3,
    ease: "easeInOut",
    opacity: 1,
    waypointsX: [90, 76, 86, 68, 80, 94, 90],
    waypointsY: [90, 76, 60, 68, 86, 78, 90],
    times: [0, 0.17, 0.35, 0.52, 0.68, 0.85, 1],
  },
];

// Free-roaming butterflies across the whole hero — each follows its own
// hand-drawn multi-waypoint loop (see BUTTERFLIES above) rather than a
// straight horizontal drift, so the flight actually looks organic instead
// of a flat pass-by. `left`/`top` are animated together as percentage-
// string arrays (same technique CloudShape in ambient/NightSky.tsx uses
// for horizontal drift, just extended to two axes here) so one flat
// `transition` keeps both in sync along the same schedule.
//
// Wing rendering is now the real butterfly.json Lottie (separate left/right
// wing layers with their own scale-based flap keyframes) instead of the old
// custom SVG scaleX collapse — smoother, less choppy. Each instance gets a
// `-translate-x-1/2 -translate-y-1/2` offset so its waypoint percentages
// still address the butterfly's *center*, matching the old SVG's
// negative-viewBox centering trick. Color comes entirely from the CSS
// `filter` on the wrapper (see BUTTERFLY_FILTER_* above) — the Lottie file
// itself stays untouched; per-instance color variety is a per-instance
// filter, not a per-instance recolored asset.
//
// Pulled into its own component (rather than inlined in the .map() below)
// because setting playback speed isn't a plain prop on <Lottie> — lottie-
// react only exposes it imperatively via lottieRef.setSpeed(), fired once
// from onDOMLoaded when the animation instance actually exists. That needs
// its own ref per instance, which needs its own component scope.
function FlappingButterfly({ bf }: { bf: ButterflyConfig }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ width: bf.size, height: bf.size, opacity: bf.opacity, filter: bf.filter }}
      initial={{
        left: `${bf.waypointsX[0]}%`,
        top: `${bf.waypointsY[0]}%`,
      }}
      animate={{
        left: bf.waypointsX.map((x) => `${x}%`),
        top: bf.waypointsY.map((y) => `${y}%`),
      }}
      transition={{
        duration: bf.duration,
        delay: bf.delay,
        repeat: Infinity,
        ease: bf.ease,
        times: bf.times,
      }}
    >
      <Lottie
        animationData={butterflyAnimation}
        loop
        autoplay
        lottieRef={lottieRef}
        onDOMLoaded={() => lottieRef.current?.setSpeed(BUTTERFLY_FLAP_SPEED)}
      />
    </motion.div>
  );
}

function Butterflies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUTTERFLIES.map((bf, i) => (
        <FlappingButterfly key={i} bf={bf} />
      ))}
    </div>
  );
}

// Pointed teardrop, not a smooth ellipse — narrow-ish base widening quickly
// then tapering to a sharp tip. This is the difference between "sunflower"
// and "generic daisy": real petals aren't round bubbles. Drawn in absolute
// coordinates pointing straight up from (cx, topY), then swept to each
// angular position via an outer `rotate(angle, cx, cy)` transform.
function petalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.18;
  const midY2 = topY - length * 0.6;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.55},${midY2} ${cx},${tipY} C${cx + w * 0.55},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

// Simple pointed-oval leaf, pointed at both the stem-attachment base and the
// tip. Drawn with its base at the local origin so translate+rotate on the
// caller's transform pivots it exactly at the point where it meets the stem.
function leafPath(length: number, width: number): string {
  const w = width / 2;
  return `M0,0 Q${w},${-length * 0.45} 0,${-length} Q${-w},${-length * 0.45} 0,0 Z`;
}

function SunflowerSvg({
  stemLength,
  headSize,
  petalCount,
  leafCount,
  className,
}: {
  stemLength: number;
  headSize: number;
  petalCount: number;
  leafCount: number;
  className?: string;
}) {
  const totalHeight = headSize + stemLength;
  const cx = headSize / 2;
  const cy = headSize / 2;
  const centerRadius = headSize * 0.18;
  const petalLength = headSize * 0.42;
  const petalWidth = headSize * 0.19;
  const petalAngles = Array.from({ length: petalCount }, (_, i) => (360 / petalCount) * i);
  const stemBaseY = headSize - headSize * 0.14;

  // Leaves attach at a fixed proportion of the way down the stem (not a
  // fixed pixel offset), so they sit sensibly whether this particular
  // flower's stem is short or long, angled outward on alternating sides.
  const leafConfigs = [
    { fraction: 0.4, angle: 35 },
    { fraction: 0.64, angle: -32 },
  ].slice(0, leafCount);

  return (
    <svg
      viewBox={`0 0 ${headSize} ${totalHeight}`}
      width={headSize}
      height={totalHeight}
      className={className}
      aria-hidden="true"
    >
      <line
        x1={cx}
        y1={stemBaseY}
        x2={cx}
        y2={totalHeight}
        stroke="currentColor"
        strokeWidth={Math.max(1.5, headSize * 0.035)}
        strokeLinecap="round"
      />

      {leafConfigs.map((leaf, i) => {
        const leafY = stemBaseY + (totalHeight - stemBaseY) * leaf.fraction;
        return (
          <path
            key={i}
            d={leafPath(headSize * 0.5, headSize * 0.22)}
            fill="currentColor"
            transform={`translate(${cx} ${leafY}) rotate(${leaf.angle})`}
          />
        );
      })}

      <g fill="currentColor">
        {petalAngles.map((angle) => (
          <path
            key={angle}
            d={petalPath(cx, cy, centerRadius * 0.7, petalLength, petalWidth)}
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={centerRadius} />
      </g>
    </svg>
  );
}

interface FlowerConfig {
  left: number;
  stemLength: number;
  headSize: number;
  petalCount: number;
  leafCount: number;
  rotate: number;
  color: string;
  opacity: number;
  sway: boolean;
  swayDuration: number;
  swayDelay: number;
}

// Depth tiers: foreground flowers are bigger AND drawn in a richer, darker
// brown; background ones are smaller AND lighter/more muted — color plus
// size together, not opacity alone, so the row reads as actual atmospheric
// depth rather than a flat row of identical silhouettes at different fades.
const COLOR_FOREGROUND = "#3d2419";
const COLOR_MID = "#4a2f26";
const COLOR_BACKGROUND = "#8a6a5a";

// Hand-placed, fixed values (not Math.random()) — same hydration-safety
// reasoning as CLOUDS/STARS in ambient/NightSky.tsx: this needs to look
// irregular, not be regenerated per session, so hardcoding varied numbers
// directly is simpler than a seeded PRNG for just 16 entries. Only some
// sway (a light breeze wouldn't move every stem identically). All 16 slots
// are plain SunflowerSvg silhouettes — the detailed Lottie sunflower "wow
// factor" lives in ambient/GoldenSkySection.tsx's centerpiece instead; the
// Hero field doesn't duplicate it.
const FLOWERS: FlowerConfig[] = [
  { left: 1, stemLength: 40, headSize: 40, petalCount: 12, leafCount: 1, rotate: -7, color: COLOR_BACKGROUND, opacity: 0.55, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 8, stemLength: 60, headSize: 48, petalCount: 14, leafCount: 2, rotate: 5, color: COLOR_MID, opacity: 0.75, sway: true, swayDuration: 4.2, swayDelay: 0.3 },
  { left: 15, stemLength: 34, headSize: 38, petalCount: 13, leafCount: 1, rotate: -4, color: COLOR_BACKGROUND, opacity: 0.5, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 22, stemLength: 90, headSize: 60, petalCount: 16, leafCount: 2, rotate: 8, color: COLOR_FOREGROUND, opacity: 0.92, sway: true, swayDuration: 3.6, swayDelay: 1.1 },
  { left: 29, stemLength: 50, headSize: 46, petalCount: 13, leafCount: 1, rotate: -9, color: COLOR_MID, opacity: 0.66, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 36, stemLength: 98, headSize: 64, petalCount: 15, leafCount: 2, rotate: 3, color: COLOR_FOREGROUND, opacity: 0.95, sway: true, swayDuration: 4.8, swayDelay: 0.6 },
  { left: 43, stemLength: 36, headSize: 40, petalCount: 12, leafCount: 1, rotate: -5, color: COLOR_BACKGROUND, opacity: 0.54, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 50, stemLength: 66, headSize: 50, petalCount: 14, leafCount: 2, rotate: 7, color: COLOR_MID, opacity: 0.8, sway: true, swayDuration: 3.9, swayDelay: 1.6 },
  { left: 57, stemLength: 56, headSize: 47, petalCount: 13, leafCount: 1, rotate: -6, color: COLOR_MID, opacity: 0.7, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 64, stemLength: 94, headSize: 62, petalCount: 16, leafCount: 2, rotate: 4, color: COLOR_FOREGROUND, opacity: 0.93, sway: true, swayDuration: 4.4, swayDelay: 0.2 },
  { left: 71, stemLength: 38, headSize: 42, petalCount: 12, leafCount: 1, rotate: -8, color: COLOR_BACKGROUND, opacity: 0.58, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 78, stemLength: 62, headSize: 49, petalCount: 14, leafCount: 2, rotate: 6, color: COLOR_MID, opacity: 0.78, sway: true, swayDuration: 3.4, swayDelay: 1.4 },
  { left: 85, stemLength: 32, headSize: 39, petalCount: 13, leafCount: 1, rotate: -3, color: COLOR_BACKGROUND, opacity: 0.52, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 91, stemLength: 86, headSize: 58, petalCount: 15, leafCount: 2, rotate: 5, color: COLOR_FOREGROUND, opacity: 0.9, sway: true, swayDuration: 4.6, swayDelay: 0.8 },
  { left: 97, stemLength: 30, headSize: 37, petalCount: 12, leafCount: 1, rotate: -7, color: COLOR_BACKGROUND, opacity: 0.5, sway: false, swayDuration: 0, swayDelay: 0 },
  { left: 100, stemLength: 58, headSize: 47, petalCount: 13, leafCount: 1, rotate: 2, color: COLOR_MID, opacity: 0.72, sway: false, swayDuration: 0, swayDelay: 0 },
];

// A row of sunflower silhouettes along the bottom edge — V1's signature
// motif, reused across later sections. Positioned below the text (no
// explicit z-index, so the z-10 text block above always wins) but painted
// after the sky/glow/motes layers, so it reads as a grounding foreground
// element in front of the sky.
function SunflowerField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%]"
    >
      {FLOWERS.map((flower, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{
            left: `${flower.left}%`,
            color: flower.color,
            opacity: flower.opacity,
            transformOrigin: "bottom center",
          }}
          initial={{ rotate: flower.rotate }}
          animate={
            flower.sway
              ? { rotate: [flower.rotate - 3, flower.rotate + 3, flower.rotate - 3] }
              : { rotate: flower.rotate }
          }
          transition={
            flower.sway
              ? {
                duration: flower.swayDuration,
                delay: flower.swayDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }
              : undefined
          }
        >
          <SunflowerSvg
            stemLength={flower.stemLength}
            headSize={flower.headSize}
            petalCount={flower.petalCount}
            leafCount={flower.leafCount}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function SunsetHero({ people, groupTitle, title }: SunsetHeroProps) {
  const heading = formatPeopleHeading(people, groupTitle);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#f5ddd0] via-[#e8c4b0] to-[#f0e0d0] px-6 text-center">
      {/* Setting sun: a soft cream-gold glow tucked into the top-right
          corner, mostly off-screen — like the sun itself is just out of
          frame, only its light spilling in. Establishes a clear light
          source for the upper half instead of the old center-low position,
          which left the top of the composition empty. Kept deliberately
          subtle/low-opacity so it reads as ambient light, not a disc. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-[360px] w-[360px] rounded-full blur-3xl sm:-top-24 sm:-right-24 sm:h-[460px] sm:w-[460px]"
        style={{
          background:
            "radial-gradient(circle, rgba(253,240,216,0.3) 0%, rgba(253,240,216,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -right-10 h-[200px] w-[200px] rounded-full blur-3xl sm:-top-8 sm:-right-12 sm:h-[280px] sm:w-[280px]"
        style={{
          background:
            "radial-gradient(circle, rgba(253,240,216,0.55) 0%, rgba(253,240,216,0.28) 40%, rgba(253,240,216,0) 72%)",
        }}
      />

      <LightMotes />
      <Butterflies />

      {/* Soft backdrop lifting the text block off the (now much softer)
          background, so contrast stays comfortable without resorting to a
          harder text-shadow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[90%] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[480px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,251,244,0.5) 0%, rgba(255,251,244,0) 70%)",
        }}
      />

      <SunflowerField />

      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="font-display text-5xl font-normal text-[#4a2f26] sm:text-6xl md:text-7xl"
        >
          {heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
          className="font-display mt-6 max-w-xl text-xl italic text-[#4a2f26]/75 sm:text-2xl"
        >
          {title}
        </motion.p>

        <motion.div
          className="mx-auto mt-8 flex justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.9 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#c9a68a] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
