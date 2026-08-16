"use client";

import { motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useRef, useSyncExternalStore } from "react";

import { formatPeopleHeading } from "@/lib/people";
import {
  BUTTERFLY_FILTER_CORAL,
  BUTTERFLY_FILTER_DUSTY_ROSE,
  BUTTERFLY_FILTER_GOLD,
  BUTTERFLY_FILTER_TERRACOTTA,
} from "@/lib/v1ButterflyFilters";
import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import type { SitePerson } from "@/types/site";

import butterflyAnimation from "@/public/animations/butterfly.json";

// V1 "Golden Hour / Sunset" design system — establishing this here, reused
// across all V1 components in later phases. Deliberately distinct from V2's
// dark "Night Sky" palette; no file here is shared with or imported by
// AnniversaryV2.tsx.
//   Background : this section has no background of its own — see the
//                comment above templates/AnniversaryV1.tsx's <main>, which
//                paints V1_BACKGROUND_GRADIENT (lib/v1SectionGradients.ts)
//                exactly once across the whole page
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

// The 4 muted filter constants (BUTTERFLY_FILTER_*) live in
// lib/v1ButterflyFilters.ts, shared with message/SealedLetter.tsx — the
// only other V1 file that renders this same butterfly.json Lottie. See
// that file for the full derivation (verified via real rendered-pixel
// sampling, not just simulated color math) and why this one value is
// extracted to a shared data-layer utility despite V1's usual per-file
// self-containment convention.

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
    // z-[6]: explicit stacking so butterflies always paint above the other
    // ambient layers in this section (light motes, corner/backdrop glows,
    // all z-index:auto) regardless of DOM order. Still safely below the
    // z-10 heading text. (This used to also matter for staying above the
    // sunflower field that sat at the bottom of this section — removed —
    // but the explicit z-index is harmless and still correctly applied
    // now.)
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      {BUTTERFLIES.map((bf, i) => (
        <FlappingButterfly key={i} bf={bf} />
      ))}
    </div>
  );
}

// ---- Field flowers: brought back after an earlier task removed this
// section's own field entirely — this is a verbatim copy of ambient/
// GoldenSkySection.tsx's current field (petalPath/leafPath/SunflowerSvg/
// FieldFlowerConfig/FIELD_FLOWERS/SunflowerField, byte-identical logic),
// not an import, per V1's per-file self-containment convention: component
// code (anything that renders JSX) stays duplicated per file, only plain
// data/constants modules — SUNFLOWER_PETAL_COLOR/SUNFLOWER_CENTER_COLOR
// above, imported from lib/v1SunflowerColors.ts — are ever shared across
// V1 files. Reusing GoldenSkySection's exact version (rather than Hero's
// own pre-removal FLOWERS/SunflowerField, which had 16 entries, per-flower
// sway animation, and 4 golden-highlighted flowers at fixed positions) is
// what this task asked for specifically: "so both sections' fields look
// visually consistent" — same silhouette shape, same real sampled-from-
// the-Lottie SUNFLOWER_PETAL_COLOR/SUNFLOWER_CENTER_COLOR tokens, same
// 7-flower varying-size arrangement, same h-[26%] bottom band. ----
function petalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.18;
  const midY2 = topY - length * 0.6;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.55},${midY2} ${cx},${tipY} C${cx + w * 0.55},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

function leafPath(length: number, width: number): string {
  const w = width / 2;
  return `M0,0 Q${w},${-length * 0.45} 0,${-length} Q${-w},${-length * 0.45} 0,0 Z`;
}

function SunflowerSvg({
  stemLength,
  headSize,
  petalCount,
  leafCount,
  petalColor,
  className,
}: {
  stemLength: number;
  headSize: number;
  petalCount: number;
  leafCount: number;
  petalColor?: string;
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

      <g fill={petalColor ?? "currentColor"}>
        {petalAngles.map((angle) => (
          <path
            key={angle}
            d={petalPath(cx, cy, centerRadius * 0.7, petalLength, petalWidth)}
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={centerRadius} fill="currentColor" />
    </svg>
  );
}

interface FieldFlowerConfig {
  left: number;
  headSize: number;
  stemLength: number;
  petalCount: number;
  leafCount: number;
  opacity: number;
}

const FIELD_FLOWERS: FieldFlowerConfig[] = [
  { left: 6, headSize: 30, stemLength: 40, petalCount: 12, leafCount: 1, opacity: 0.5 },
  { left: 20, headSize: 44, stemLength: 56, petalCount: 14, leafCount: 2, opacity: 0.7 },
  { left: 34, headSize: 34, stemLength: 44, petalCount: 13, leafCount: 1, opacity: 0.58 },
  { left: 50, headSize: 54, stemLength: 68, petalCount: 16, leafCount: 2, opacity: 0.85 },
  { left: 66, headSize: 36, stemLength: 46, petalCount: 13, leafCount: 1, opacity: 0.6 },
  { left: 80, headSize: 46, stemLength: 58, petalCount: 14, leafCount: 2, opacity: 0.75 },
  { left: 94, headSize: 30, stemLength: 40, petalCount: 12, leafCount: 1, opacity: 0.5 },
];

function SunflowerField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]">
      {FIELD_FLOWERS.map((flower, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{ left: `${flower.left}%`, opacity: flower.opacity, color: SUNFLOWER_CENTER_COLOR, transform: "translateX(-50%)" }}
        >
          <SunflowerSvg
            stemLength={flower.stemLength}
            headSize={flower.headSize}
            petalCount={flower.petalCount}
            leafCount={flower.leafCount}
            petalColor={SUNFLOWER_PETAL_COLOR}
          />
        </div>
      ))}
    </div>
  );
}

// A soft warm glow grounding the section's lower/horizon area — no flower
// shapes, just atmosphere, filling the visual gap the sunflower field used
// to occupy now that it's gone. Same radial-gradient-at-bottom technique as
// ambient/GoldenSkySection.tsx's FieldGlowPool, reimplemented locally per
// V1's self-containment convention, and the same slow opacity pulse as that
// file's other ambient glows for a consistent "breathing" feel across
// sections.
function HorizonGlow() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[48%] blur-2xl"
      style={{
        background:
          "radial-gradient(ellipse at bottom, rgba(253,196,120,0.26) 0%, rgba(253,196,120,0.1) 45%, rgba(253,196,120,0) 78%)",
      }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

interface DriftingPetal {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  swayAmount: number;
  rotateStart: number;
  opacity: number;
}

// Sparse on purpose ("ambient, not dense" per this task's brief) — well
// under ambient/GoldenSkySection.tsx's own PETAL_COUNT (10), since this is
// just enough drift to keep the lower two-thirds from reading empty, not a
// second copy of that section's signature effect.
const PETAL_COUNT = 6;

function randomHeroPetal(id: number): DriftingPetal {
  return {
    id,
    left: Math.random() * 100,
    size: 8 + Math.random() * 8,
    duration: 13 + Math.random() * 10,
    delay: -(Math.random() * 16),
    swayAmount: 14 + Math.random() * 22,
    rotateStart: Math.random() * 360,
    opacity: 0.25 + Math.random() * 0.3,
  };
}

const EMPTY_HERO_PETALS: DriftingPetal[] = [];

function noopSubscribeHeroPetals() {
  return () => { };
}

// Same pointed, downward-tapering petal silhouette as
// ambient/GoldenSkySection.tsx's fallingPetalPath, reimplemented locally
// per V1's self-containment convention — base at y=0, tip at y=length, so
// it falls tip-first like a real petal instead of reading as a plain oval.
function fallingPetalPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = length * 0.18;
  const midY2 = length * 0.6;
  return `M0,0 C${-w},${midY1} ${-w * 0.55},${midY2} 0,${length} C${w * 0.55},${midY2} ${w},${midY1} 0,0 Z`;
}

// Gentle petal drift filling the lower two-thirds of the section now that
// the sunflower field is gone — color-synced to the same warm gold-orange
// (#dd9a42) as GoldenSkySection's own falling petals, so it reads as the
// same motif continuing across sections rather than a new one. Confined to
// its own h-[66%] bottom-anchored wrapper (petals travel from just above
// that wrapper's own top edge to just below its bottom edge, not the full
// section height) — this is what keeps them out of the vertically-centered
// heading/subtitle/divider column above without needing a horizontal
// spawn-exclusion band (ambient/GoldenSkySection.tsx's own fix for its
// wider, differently-shaped content row): Hero's text block sits in the
// vertical middle of the viewport, so simply not falling above the lower
// two-thirds already clears it. Explicit z-0, rendered first (same
// reasoning as that file's PetalDrift) so it's unambiguously behind
// everything else in this section. Same useSyncExternalStore hydration
// pattern as LightMotes above: empty/deterministic on server and first
// client paint, randomized client-only layout after.
function PetalDrift() {
  const cacheRef = useRef<DriftingPetal[] | null>(null);

  const petals = useSyncExternalStore(
    noopSubscribeHeroPetals,
    () => {
      if (!cacheRef.current) {
        cacheRef.current = Array.from({ length: PETAL_COUNT }, (_, i) => randomHeroPetal(i));
      }
      return cacheRef.current;
    },
    () => EMPTY_HERO_PETALS,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[66%] overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-0 text-[#dd9a42]"
          style={{ left: `${petal.left}%`, opacity: petal.opacity }}
          initial={{ y: "-10%", rotate: petal.rotateStart }}
          animate={{
            y: "115%",
            x: [0, petal.swayAmount, -petal.swayAmount * 0.6, petal.swayAmount * 0.3, 0],
            rotate: petal.rotateStart + 200,
          }}
          transition={{
            y: {
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: "linear",
            },
            x: {
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: "easeInOut",
            },
            rotate: {
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          <svg viewBox="0 0 16 32" width={petal.size} height={petal.size * 2}>
            <path d={fallingPetalPath(26, 10)} fill="currentColor" transform="translate(8 3)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export default function SunsetHero({ people, groupTitle, title }: SunsetHeroProps) {
  const heading = formatPeopleHeading(people, groupTitle);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <PetalDrift />
      <HorizonGlow />
      <SunflowerField />

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
