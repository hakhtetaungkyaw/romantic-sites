"use client";

import { motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { formatPeopleHeading } from "@/lib/people";
import { fadeUpVariant, scaleBlurVariant, staggerContainerVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import { useV1InViewport } from "@/lib/useV1InViewport";
import type { SitePerson, SitePhoto } from "@/types/site";

import sunflowerAnimation from "@/public/animations/sunflower.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx. Deliberately distinct from V2's dark "Night Sky"
// palette; this file is self-contained (its own copies of the seeded-PRNG,
// cloud, petal-path, and date-formatting techniques, not imports) so it
// never becomes a file shared with AnniversaryV2.tsx, per the V1/V2
// file-separation rule.
//   Background : this section has no background of its own — see the
//                comment above templates/AnniversaryV1.tsx's <main>, which
//                paints V1_BACKGROUND_GRADIENT exactly once across the
//                whole page
//   Primary    : terracotta/coral #d97a5f
//   Secondary  : dusty rose #d4919a
//   Metallic   : rose gold #c9a68a / muted gold #b8935f
//   Text       : warm dark brown #4a2f26

interface GoldenSkySectionProps {
  people: SitePerson[];
  groupTitle?: string;
  specialDate: string;
  photos: SitePhoto[];
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

// The sun itself — redesigned for a more cinematic/romantic read than the
// old single-flat-gradient disc + straight rays. Four layers, widest/softest
// to smallest/sharpest:
//   1. an outer bloom, wide and heavily blurred, that gently bleeds into the
//      page background rather than stopping at a hard edge
//   2. a pulsing mid-glow halo
//   3. the disc itself, now an off-center multi-stop radial gradient (highlight
//      pushed toward the upper-left of the disc at 35%/30%, not dead-center)
//      so it reads as a lit sphere, not a flat painted circle, plus a two-layer
//      box-shadow (tight bright glow + a wider, softer amber bleed) instead of
//      one shadow — that second, wider shadow layer is what actually produces
//      the "warm bloom around the light source" effect close to the disc,
//      complementing layer 1's much larger/softer version of the same idea
//   4. a very soft secondary rim-light pass behind the disc for extra depth
// Positioned above where SunflowerCenterpiece renders below, so the light
// visually originates above the big Lottie bloom rather than behind it.
function Sun() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-4%] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl sm:h-[760px] sm:w-[760px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,247,224,0.42) 0%, rgba(253,213,150,0.2) 45%, rgba(253,213,150,0) 75%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[4%] h-[260px] w-[260px] -translate-x-1/2 rounded-full blur-2xl sm:h-[360px] sm:w-[360px]"
        style={{
          background:
            "radial-gradient(circle, rgba(253,225,170,0.7) 0%, rgba(249,178,96,0.34) 45%, rgba(249,178,96,0) 74%)",
        }}
        animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.1, 1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[6%] h-[130px] w-[130px] -translate-x-1/2 rounded-full blur-md sm:h-[180px] sm:w-[180px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,250,240,0.5) 0%, rgba(253,225,170,0.22) 55%, rgba(253,225,170,0) 80%)",
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[5%] h-[92px] w-[92px] -translate-x-1/2 rounded-full sm:h-[134px] sm:w-[134px]"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fffdf6 0%, #fff3d6 16%, #fde7b8 38%, #f9c97c 64%, #f0a05c 86%, rgba(240,160,92,0) 100%)",
          boxShadow:
            "0 0 60px 18px rgba(253,225,170,0.6), 0 0 140px 50px rgba(249,178,96,0.3)",
        }}
        animate={{ opacity: [0.88, 1, 0.88] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

// God-rays fanning down from the sun toward the field below — reworked from
// a uniform-width straight fan into visibly irregular dappled-light beams:
// each ray now carries its own length/width/opacity/blur (RAYS below) rather
// than sharing one shape and only varying its pulse timing, so neighboring
// rays read as slightly different shafts of light instead of a rigid
// geometric sunburst. Still a wedge per ray (narrow near the sun, wide at
// the field, via `clipPath: polygon(...)`) filled with a linear gradient.
// Fixed values, not random — a deliberate hand-placed fan (same reasoning as
// CLOUDS elsewhere in this file: needs to look identical every render), so
// no useSyncExternalStore hydration gating is needed here, unlike PetalDrift
// below (true client-only Math.random()).
interface RayConfig {
  angle: number;
  length: number;
  width: number;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
}

// Opacity values roughly doubled+ from the prior pass (0.42-0.7 -> 0.85-1)
// per this task's "barely perceptible... at least 2x, unmistakable" brief —
// animate now pulses DOWN from that peak (0.8x-1x of base) rather than up
// past it, since these bases already sit near the 0-1 ceiling.
const RAYS: RayConfig[] = [
  { angle: -34, length: 70, width: 66, opacity: 0.85, blur: 2.5, duration: 5.4, delay: 0 },
  { angle: -23, length: 88, width: 96, opacity: 1, blur: 1.2, duration: 4.6, delay: 0.35 },
  { angle: -12, length: 74, width: 58, opacity: 0.92, blur: 2, duration: 5.1, delay: 0.7 },
  { angle: 0, length: 94, width: 108, opacity: 1, blur: 0.8, duration: 4.2, delay: 0 },
  { angle: 12, length: 74, width: 58, opacity: 0.92, blur: 2, duration: 5.1, delay: 0.55 },
  { angle: 23, length: 88, width: 96, opacity: 1, blur: 1.2, duration: 4.6, delay: 0.2 },
  { angle: 34, length: 70, width: 66, opacity: 0.85, blur: 2.5, duration: 5.4, delay: 0.5 },
];

function LightRays() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {RAYS.map((ray, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-[8%]"
          style={{
            height: `${ray.length}%`,
            width: ray.width,
            transformOrigin: "top center",
            transform: `translateX(-50%) rotate(${ray.angle}deg)`,
            clipPath: "polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)",
            background: `linear-gradient(to bottom, rgba(255,244,218,${ray.opacity}) 0%, rgba(253,213,150,${ray.opacity * 0.6}) 42%, rgba(253,213,150,${ray.opacity * 0.22}) 76%, rgba(253,213,150,0) 100%)`,
            filter: `blur(${ray.blur}px)`,
          }}
          animate={{ opacity: [ray.opacity * 0.8, ray.opacity, ray.opacity * 0.8] }}
          transition={{
            duration: ray.duration,
            delay: ray.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// The warm pool of light where the rays above "land" — positioned at the
// bottom of the section, grounding the light effect so the rays read as
// shining down onto something rather than trailing off into nothing.
function FieldGlowPool() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
      style={{
        background:
          "radial-gradient(ellipse at bottom, rgba(253,196,120,0.38) 0%, rgba(253,196,120,0.14) 45%, rgba(253,196,120,0) 78%)",
      }}
      animate={{ opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
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

// Excludes spawn positions from the center horizontal band (20%-80% of the
// section's full width) where the love-note/sunflower/photo row lives — the
// bug this fixes: petals fall through the ENTIRE section height on every
// loop, so any petal whose `left%` lands under that row will sooner or
// later drift straight across it; since the row's own background is
// transparent (only the actual text glyphs/photo/sunflower art are opaque),
// a petal there is genuinely visible in the whitespace around them, not
// actually clipped by anything, even though it's correctly behind them in
// z-order. Keeping spawns out of that band entirely (not just gated to the
// row's specific vertical slice) is a deliberately simpler fix than
// per-frame vertical/horizontal coupling, and works because the row sits
// well inside the petals' full top-to-bottom fall path regardless.
// left% is relative to the section's full width, not the row's own
// (narrower, centered) max-w-4xl box — 20%-80% is a hand-picked
// approximation wide enough to clear the row on typical desktop viewports,
// not a pixel-exact measurement (same hand-tuned-constant approach as
// RAYS elsewhere in this file).
const PETAL_EXCLUDE_BAND: [number, number] = [20, 80];
const PETAL_ALLOWED_RANGES: [number, number][] = [
  [0, PETAL_EXCLUDE_BAND[0]],
  [PETAL_EXCLUDE_BAND[1], 100],
];

function randomPetalLeft(): number {
  const widths = PETAL_ALLOWED_RANGES.map(([start, end]) => end - start);
  const total = widths.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PETAL_ALLOWED_RANGES.length; i++) {
    if (r < widths[i]) {
      return PETAL_ALLOWED_RANGES[i][0] + r;
    }
    r -= widths[i];
  }
  const last = PETAL_ALLOWED_RANGES[PETAL_ALLOWED_RANGES.length - 1];
  return last[0] + (last[1] - last[0]) * Math.random();
}

function randomPetal(id: number): DriftingPetal {
  return {
    id,
    left: randomPetalLeft(),
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
//
// Explicit z-0 and rendered FIRST in GoldenSkySection's return below (ahead
// of Sun/Clouds/Field/Motes, not just ahead of the z-10 content column) —
// the lowest layer, just above the bare page background — per this task's
// fix: petals need to stay behind everything else in this section, not just
// the text/photo/sunflower specifically. Combined with randomPetalLeft's
// spawn exclusion band above, this keeps them fully in the background
// rather than visually crossing the row.
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
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

// Two flanking accents either side of the big Lottie centerpiece below —
// replaces an earlier pass's two decorative icon silhouettes (envelope,
// photo-frame), which read as inert clip-art rather than adding anything.
// Real content instead:
//   left  — a short love-note line, styled as a smaller/lighter sibling of
//           CAPTION below (same font-display italic, same warm-brown tone,
//           text-sm/base against CAPTION's base/lg) tying together the
//           sunflower/sun/butterfly motifs already on screen
//   right — one real customer photo (PhotoAccent), not a placeholder —
//           same SitePhoto shape / `photos` prop pattern gallery/
//           SunlitPolaroids.tsx and timeline/SunsetTimeline.tsx already use,
//           passed down from templates/AnniversaryV1.tsx
// Both purely decorative (no onClick/href), sized to match each other
// exactly (260px, see ROW_ITEM_WIDTH below) — comparable in footprint to
// the 256px centerpiece by design, so the three form one balanced row
// rather than a big flower with two small afterthoughts either side.
//
// Options considered for the note line before picking one:
//   "A sunflower doesn't choose to turn toward the sun — it just does. That's
//   how I found you." — good idea, slightly clunky rhythm across two
//   sentences for a text this small.
//   "Even the butterflies know: some blooms are worth chasing the light
//   for." — nice but leaves the sunflower-follows-sun half of the metaphor
//   implicit rather than stated.
// Went with the line below: one unbroken sentence, all three motifs present
// (sunflower/sun turning, butterfly finding its bloom), landing on direct
// address like CAPTION's "so did we" does.
const LOVE_NOTE = "A sunflower turns for the sun, a butterfly finds its bloom — I was always going to find my way to you.";

// Shared fixed width for both flanking pieces (text block and photo) — the
// exact same value on both sides is what makes them read as one balanced
// row rather than two differently-sized afterthoughts either side of the
// sunflower. max-w-[78vw] is purely a narrow-viewport guard (this value
// only matters once the row goes horizontal at lg:, see GoldenSkySection's
// return below, well past any width where 78vw would actually bind).
const ROW_ITEM_WIDTH = "w-[260px] max-w-[78vw]";

function LoveNoteAccent() {
  return (
    <p className={`font-display mx-auto text-center text-sm italic leading-snug text-[#6b4332]/85 sm:text-base ${ROW_ITEM_WIDTH}`}>
      {LOVE_NOTE}
    </p>
  );
}

// One real customer photo, framed to match gallery/SunlitPolaroids.tsx's
// own polaroid card treatment (cream bg + thicker-bottom padding standing
// in for the frame, not a border-only outline): rounded-2xl (16px) outer
// corners, a thin warm hairline (border-[#e8c4b0], same token that file
// uses) plus a soft warm-brown drop shadow, and a 3-degree rotation for a
// candid/tossed-down feel rather than a rigidly aligned rectangle. Fixed-
// size `fill` + aspect-[4/3] box rather than SunlitPolaroids' own intrinsic-
// dimension lookup — this is a single uniform accent slot, not a gallery
// grid preserving each photo's real aspect ratio.
function PhotoAccent({ photo }: { photo: SitePhoto }) {
  return (
    <div
      className={`rounded-2xl border border-[#e8c4b0] bg-[#fdf6ec] p-[9px] pb-6 shadow-xl shadow-[#6b4332]/25 ${ROW_ITEM_WIDTH}`}
      style={{ transform: "rotate(3deg)" }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#e8c4b0]">
        <Image
          src={photo.src}
          alt={photo.caption ?? "A memory together"}
          fill
          sizes="260px"
          className="object-cover"
        />
      </div>
    </div>
  );
}

// The section's signature focal element — V1's counterpart to V2's
// constellation heart. The actual LottieFiles "Sunflower" animation
// (public/animations/sunflower.json), not a custom SVG recreation. Checked
// the raw JSON directly: every animated layer's first keyframe (t=0)
// exactly matches its last (t=113, just past the op=112 out-point), so it's
// a properly-authored seamless loop — `loop` alone plays it with no visible
// snap; that's unrelated to the play/pause wiring below, which is a
// separate, performance-motivated concern (pausing the Lottie entirely
// while this section is off screen), not anything to do with the loop seam.
// The wrapping <motion.div> still handles the section's own reveal-on-scroll
// beat (fade + scale up slightly, matching every other reveal in this
// file), separate from the Lottie's own continuous breeze-loop playback.
// Sits inside the z-10 content column, so it always paints above
// FieldGlowPool/LightRays/Sun below regardless of DOM order.
// No own initial/whileInView/transition anymore — this now sits inside
// GoldenSkySection's shared staggerContainerVariant group (see the return
// below) and gets its reveal via an inherited `variants={scaleBlurVariant}`
// instead, so it fires in sequence with the heading/quote/love-note/photo
// rather than on its own independent scroll trigger. `ref={viewportRef}` is
// unrelated to that — it's the separate IntersectionObserver hook that
// pauses this Lottie's playback while off screen, coexisting fine with
// Framer Motion's own variant propagation on the same element.
function SunflowerCenterpiece() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { ref: viewportRef, isInView } = useV1InViewport<HTMLDivElement>();

  useEffect(() => {
    if (isInView) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.pause();
    }
  }, [isInView]);

  return (
    <motion.div ref={viewportRef} className="h-52 w-52 sm:h-64 sm:w-64" variants={scaleBlurVariant}>
      <Lottie animationData={sunflowerAnimation} loop autoplay lottieRef={lottieRef} />
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

// This section has no background of its own — every V1 section's own
// background is transparent, and templates/AnniversaryV1.tsx paints
// V1_BACKGROUND_GRADIENT exactly once across the whole page instead (a
// single gradient spanning the full stacked page height, not seven
// independent copies of the same gradient restarting at every section
// boundary — the latter still produces a hard seam at each boundary even
// when the value is identical, since each section's own bottom would be
// the gradient's darkest stop sitting directly above the next section's
// own top, its lightest stop).
//
// Layer order (back to front): PetalDrift (z-0, explicit — moved to the
// very front of the DOM order and given its own z-0 so it's unambiguously
// the lowest layer, just above the bare page background) -> Sun ->
// LightRays -> Clouds -> FieldGlowPool -> LightMotes -> the z-10 content
// column (couple names, caption, the love-note/centerpiece/photo row,
// date). Everything between PetalDrift and the content column has no
// explicit z-index, so paint order among THEM still follows plain DOM
// order; the content column's z-10 keeps it on top of all of them
// regardless. This keeps petals fully in the background and clouds
// reading further back than the sun/rays' own glow.
//
// The sunflower field row that used to ground this section's bottom edge
// (FieldFlowerConfig/FIELD_FLOWERS/SunflowerField, plus the local
// petalPath/leafPath/SunflowerSvg it depended on) was removed — it now
// lives in hero/SunsetHero.tsx instead (added there once this section
// stopped needing its own copy), so having it in both sections would've
// been redundant. FieldGlowPool stays: it's part of the sun/light-ray
// effect (the warm pool the rays visually "land" in), not the field
// itself, so it's unaffected by the field's removal.
export default function GoldenSkySection({ people, groupTitle, specialDate, photos }: GoldenSkySectionProps) {
  const accentPhoto = photos[0];
  const heading = formatPeopleHeading(people, groupTitle);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-[120px]">
      <PetalDrift />

      <Sun />
      <LightRays />

      {CLOUDS.map((cloud) => (
        <CloudShape key={cloud.id} cloud={cloud} />
      ))}

      <FieldGlowPool />

      <LightMotes />

      {/* Widened from the old max-w-lg to max-w-4xl so the row below (two
          260px flanking pieces + the 256px centerpiece + gaps, ~840px at
          its widest) has room to actually lay out horizontally without
          overflowing its own container — CAPTION/the date below keep the
          narrower max-w-lg reading width individually instead, so this
          widening only affects the row, not paragraph line length. */}
      {/* Heading/quote/love-note/photo/centerpiece now reveal together via
          the shared V1 scroll-reveal system (lib/v1ScrollReveal.ts):
          staggerContainerVariant on this wrapper cascades down to each
          child's own variants prop in sequence, replacing what used to be
          five independently hand-tuned initial/whileInView/transition
          triples with per-child delay values. The date paragraph at the
          bottom deliberately keeps its own separate whileInView (untouched)
          — it wasn't part of what this task asked to group. */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainerVariant}
      >
        {/* This section now opens the page (see templates/AnniversaryV1.tsx's
            section order), so it needs its own "whose site is this" beat —
            names first, then the atmospheric quote below, same reading
            order hero/SunsetHero.tsx's own heading->subtitle->divider used
            when it opened the page. Same font-display family/weight/color
            as Hero's h1 (font-normal, #4a2f26), deliberately one step down
            in scale (4xl/5xl/6xl vs Hero's 5xl/6xl/7xl) — this section
            already has the sun/rays/love-note/photo competing for
            attention, so the names read as an opening beat here rather
            than the single dominant focal point Hero itself gave them. */}
        <motion.h1
          variants={fadeUpVariant}
          className="font-display text-4xl font-normal text-[#4a2f26] sm:text-5xl md:text-6xl"
        >
          {heading}
        </motion.h1>

        <motion.p
          variants={fadeUpVariant}
          className="font-display mt-4 max-w-lg text-base italic text-[#4a2f26]/80 sm:text-lg"
        >
          {CAPTION}
        </motion.p>

        {/* The row: stacked (flex-col) below lg so three ~260-280px-wide
            pieces never have to squeeze into a narrow viewport; becomes one
            true horizontal row at lg (1024px+), where max-w-4xl's 896px
            comfortably fits the ~840px-wide row with margin to spare.
            lg:-mt-12 on the two flanking wrappers pulls their own vertical
            center up off the row's plain flex `items-center` line (which
            would otherwise align them to the centerpiece's full stem-to-
            bloom box center) to sit level with the sunflower BLOOM's own
            center instead — the centerpiece art reads top-heavy (bloom
            occupying roughly its top ~60%, stem/leaves the rest), so the
            bloom's own vertical center sits noticeably above the full box's
            midpoint; -mt-12 (48px, close to 256px * 0.2) is a hand-tuned
            approximation of that gap, not a pixel-measured one — the same
            hand-tuned-constant approach as RAYS elsewhere in this file,
            since there's no runtime way to introspect exactly
            where within the Lottie's own bounding box the bloom sits. */}
        <div className="mt-10 flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
          <motion.div variants={fadeUpVariant} className="flex justify-center lg:-mt-12">
            <LoveNoteAccent />
          </motion.div>

          <SunflowerCenterpiece />

          {accentPhoto && (
            <motion.div variants={scaleBlurVariant} className="flex justify-center lg:-mt-12">
              <PhotoAccent photo={accentPhoto} />
            </motion.div>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          className="font-display mt-8 max-w-lg text-3xl font-medium text-[#d97a5f] sm:text-4xl"
        >
          {formatSpecialDate(specialDate)}
        </motion.p>
      </motion.div>
    </section>
  );
}
