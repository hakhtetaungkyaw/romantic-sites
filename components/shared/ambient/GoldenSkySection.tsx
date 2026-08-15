"use client";

import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useRef, useSyncExternalStore } from "react";

import sunflowerAnimation from "@/public/animations/sunflower.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx. Deliberately distinct from V2's dark "Night Sky"
// palette; this file is self-contained (its own copies of the seeded-PRNG,
// cloud, and date-formatting techniques, not imports) so it never becomes a
// file shared with AnniversaryV2.tsx, per the V1/V2 file-separation rule.
//   Background : muted peach -> warm gold -> deeper terracotta "horizon"
//   Primary    : terracotta/coral #d97a5f
//   Secondary  : dusty rose #d4919a
//   Metallic   : rose gold #c9a68a / muted gold #b8935f
//   Text       : warm dark brown #4a2f26

interface GoldenSkySectionProps {
  specialDate: string;
}

// Deterministic PRNG (mulberry32) — same fixed seed always produces the same
// sequence, so cloud layout is stable across server render and client
// hydration (unlike Math.random(), which would differ between the two and
// cause a hydration mismatch). Same technique as ambient/NightSky.tsx,
// reimplemented locally rather than imported from that V2-only file.
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

interface Cloud {
  id: number;
  top: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  direction: 1 | -1;
}

const CLOUD_COUNT = 3;

// Fixed at module scope from a seeded PRNG — identical on server and
// client, so no client-only gating is needed here (unlike the petals below,
// which use true client-only randomness).
const CLOUDS: Cloud[] = (() => {
  const rand = mulberry32(9315);
  return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    id: i,
    top: 10 + rand() * 28,
    scale: 0.85 + rand() * 0.6,
    opacity: 0.22 + rand() * 0.14,
    duration: 70 + rand() * 60,
    delay: -(rand() * 70),
    direction: i % 2 === 0 ? 1 : -1,
  }));
})();

function CloudShape({ cloud }: { cloud: Cloud }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute h-14 w-48 sm:h-20 sm:w-72"
      style={{ top: `${cloud.top}%`, opacity: cloud.opacity, scale: cloud.scale }}
      animate={{ left: cloud.direction > 0 ? ["-30%", "130%"] : ["130%", "-30%"] }}
      transition={{
        duration: cloud.duration,
        delay: cloud.delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="absolute inset-0 rounded-full bg-[#fdf6ec] blur-2xl" />
      <div className="absolute left-[15%] top-[15%] h-[65%] w-[55%] rounded-full bg-[#fdf6ec] blur-2xl" />
      <div className="absolute right-[10%] top-[5%] h-[75%] w-[45%] rounded-full bg-[#fdf6ec] blur-2xl" />
    </motion.div>
  );
}

// Glowing sun, centered high as the section's focal point — a wide, faint
// halo behind a brighter core, the same two-layer treatment from
// hero/SunsetHero.tsx's corner sun, just recentered and given a continuous
// gentle pulse (the hero's version is static; this section's is the "wow"
// piece, so it breathes).
function Sun() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[2%] h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl sm:h-[560px] sm:w-[560px]"
        style={{
          background:
            "radial-gradient(circle, rgba(253,240,216,0.32) 0%, rgba(253,240,216,0) 70%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[7%] h-[220px] w-[220px] -translate-x-1/2 rounded-full blur-2xl sm:h-[300px] sm:w-[300px]"
        style={{
          background:
            "radial-gradient(circle, rgba(253,240,216,0.65) 0%, rgba(253,240,216,0.3) 45%, rgba(253,240,216,0) 72%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
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

const MOTE_COUNT = 18;

// ~35% larger, more visibly glowing motes; the rest tiny, barely-there
// specks — same split as hero/SunsetHero.tsx's LightMotes, reimplemented
// locally here for the same reason CLOUDS/Sun are local copies, not shared
// imports.
function randomMote(id: number): LightMote {
  const isLarger = Math.random() < 0.35;
  const size = isLarger ? 3.5 + Math.random() * 3 : 1 + Math.random() * 1.8;
  return {
    id,
    left: Math.random() * 100,
    size,
    glow: isLarger ? 8 + Math.random() * 6 : 2 + Math.random() * 2,
    baseOpacity: isLarger ? 0.5 + Math.random() * 0.3 : 0.2 + Math.random() * 0.22,
    driftDuration: 12 + Math.random() * 12,
    driftDelay: -(Math.random() * 14),
    pulseDuration: 3 + Math.random() * 3,
  };
}

const EMPTY_MOTES: LightMote[] = [];

function noopSubscribe() {
  return () => {};
}

// Drifting warm light motes — useSyncExternalStore renders an empty,
// deterministic snapshot on the server and first client paint (so there's
// nothing for hydration to mismatch on), then the randomized client-only
// layout swaps in right after. Same pattern as ambient/FloatingHeartsV1.tsx.
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
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: "-20%",
            opacity: [mote.baseOpacity * 0.4, mote.baseOpacity, mote.baseOpacity * 0.4],
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

const PETAL_COUNT = 10;

function randomPetal(id: number): DriftingPetal {
  return {
    id,
    left: Math.random() * 100,
    size: 10 + Math.random() * 10,
    duration: 11 + Math.random() * 9,
    delay: -(Math.random() * 14),
    swayAmount: 18 + Math.random() * 28,
    rotateStart: Math.random() * 360,
    opacity: 0.35 + Math.random() * 0.35,
  };
}

const EMPTY_PETALS: DriftingPetal[] = [];

function noopSubscribePetals() {
  return () => {};
}

// Narrow-and-rounded at the base, tapering to a soft point at the tip — the
// same bezier construction hero/SunsetHero.tsx's sunflower-head petals use
// (base widens quickly to full width just past the attachment point, then
// gradually narrows to a point), reimplemented locally and reoriented to
// point downward (base at y=0, tip at y=length) for a falling petal instead
// of one radiating from a flower center. A plain ellipse reads as a grain
// of rice; this reads as an actual petal silhouette.
//
// Color: #dd9a42, chosen by sampling the actual Lottie JSON's petal fills
// (#ffc700 / #ffa800 — bright yellow-orange) and blending them down toward
// the section's own cream/terracotta gradient stops. The Lottie's raw
// yellow-orange read as neon against this soft palette; the old muted tan
// (#b8935f) didn't read as related to the Lottie at all. This sits between
// the two — warm and golden enough to echo the centerpiece, muted enough to
// stay ambient.
function fallingPetalPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = length * 0.18;
  const midY2 = length * 0.6;
  return `M0,0 C${-w},${midY1} ${-w * 0.55},${midY2} 0,${length} C${w * 0.55},${midY2} ${w},${midY1} 0,0 Z`;
}

// V1's signature ambient motion — the equivalent of V2's floating hearts,
// but sunflower petals gently falling and swaying rather than rising, like
// a breeze moving through the field. Same useSyncExternalStore hydration
// pattern as LightMotes above and ambient/FloatingHeartsV1.tsx: empty on
// server/first paint, randomized client-only layout after.
function PetalDrift() {
  const cacheRef = useRef<DriftingPetal[] | null>(null);

  const petals = useSyncExternalStore(
    noopSubscribePetals,
    () => {
      if (!cacheRef.current) {
        cacheRef.current = Array.from({ length: PETAL_COUNT }, (_, i) => randomPetal(i));
      }
      return cacheRef.current;
    },
    () => EMPTY_PETALS,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-0 text-[#dd9a42]"
          style={{ left: `${petal.left}%`, opacity: petal.opacity }}
          initial={{ y: "-10%", rotate: petal.rotateStart }}
          animate={{
            y: "1100%",
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
            <path
              d={fallingPetalPath(26, 10)}
              fill="currentColor"
              transform="translate(8 3)"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// The section's signature focal element — V1's counterpart to V2's
// constellation heart. The actual LottieFiles "Sunflower" animation
// (public/animations/sunflower.json), not a custom SVG recreation. Checked
// the raw JSON directly: every animated layer's first keyframe (t=0)
// exactly matches its last (t=113, just past the op=112 out-point), so it's
// a properly-authored seamless loop — `loop` alone plays it with no visible
// snap, no scroll-triggered play/pause control needed for that. The
// wrapping <motion.div> still handles the section's own reveal-on-scroll
// beat (fade + scale up slightly, matching every other reveal in this
// file), separate from the Lottie's own continuous breeze-loop playback.
function SunflowerCenterpiece() {
  return (
    <motion.div
      className="h-52 w-52 sm:h-64 sm:w-64"
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <Lottie animationData={sunflowerAnimation} loop autoplay />
    </motion.div>
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// UTC-based formatting keeps the date identical between server render and
// client hydration — toLocaleDateString() without a timeZone would use each
// environment's local timezone and could shift a midnight ISO date by a
// day. Same technique as ambient/NightSky.tsx, reimplemented locally.
function formatSpecialDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// Caption alternatives considered:
//   "Golden light, and a love just as warm." — reads generic, not specific
//   enough to this moment.
//   "The whole sky turned gold, just to match how we felt." — nice, but
//   slightly more words than needed for a caption this size.
// Went with the version below — a still, held-breath quality that suits a
// golden-hour freeze-frame, and it mirrors NightSky's caption cadence
// ("The sky looked like this...") for consistency between the two
// templates' "wow" sections.
const CAPTION = "The sky held its breath, and so did we.";

export default function GoldenSkySection({ specialDate }: GoldenSkySectionProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf1e4] via-[#f2caa6] to-[#e0a173] px-6 py-[120px]">
      <Sun />

      {CLOUDS.map((cloud) => (
        <CloudShape key={cloud.id} cloud={cloud} />
      ))}

      <LightMotes />
      <PetalDrift />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="font-display text-base italic text-[#4a2f26]/80 sm:text-lg"
        >
          {CAPTION}
        </motion.p>

        <div className="mt-10 flex justify-center">
          <SunflowerCenterpiece />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          className="font-display mt-8 text-3xl font-medium text-[#d97a5f] sm:text-4xl"
        >
          {formatSpecialDate(specialDate)}
        </motion.p>
      </div>
    </section>
  );
}
