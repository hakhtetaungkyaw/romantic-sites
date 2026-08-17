"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useV1Song } from "@/components/shared/audio/V1SongPlayer";
import {
  BUTTERFLY_FILTER_CORAL,
  BUTTERFLY_FILTER_DUSTY_ROSE,
  BUTTERFLY_FILTER_GOLD,
  BUTTERFLY_FILTER_TERRACOTTA,
} from "@/lib/v1ButterflyFilters";
import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import { fadeUpVariant, scaleBlurVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import { useV1InViewport } from "@/lib/useV1InViewport";

import butterflyAnimation from "@/public/animations/butterfly.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx and ambient/GoldenSkySection.tsx. Self-contained (own
// copies of the petal-bezier constructions, not imports) so this file is
// never shared with AnniversaryV2.tsx, per the V1/V2 file-separation rule.
//   Background : this section has no background of its own — see the
//               comment above templates/AnniversaryV1.tsx's <main>, which
//               paints V1_BACKGROUND_GRADIENT exactly once across the
//               whole page
//   Paper       : warm cream #fdf6ec
//   Primary     : terracotta/coral #d97a5f
//   Metallic    : rose gold #c9a68a
//   Text        : warm dark brown #4a2f26

interface SealedLetterProps {
  message: string;
}

// A single layoutId shared between the closed envelope and the open modal
// card — Framer Motion measures both elements' real rendered rects and
// smoothly interpolates position/size between them whenever one unmounts
// and the other mounts (AnimatePresence below), which is exactly "the modal
// visually emerges/expands from the envelope's position" from the spec,
// with no manual rect math. Same technique for the butterfly: one layoutId
// shared between its sticker position (inside the envelope) and its
// perched position (inside the modal) — this is what makes it "fly" there
// instead of teleporting, correctly regardless of scroll position, since
// the two instances can be measured wherever they actually render.
const SHELL_LAYOUT_ID = "v1-sealed-letter-shell";
const BUTTERFLY_LAYOUT_ID = "v1-sealed-letter-butterfly";

// ---- Falling petal bezier (the burst only — see SunflowerBloom below for
// the sticker's own, separately-tuned petal shape) ----
// Same base curve as ambient/GoldenSkySection.tsx's fallingPetalPath (base
// widens quickly past the attachment point, then tapers to a point) —
// reimplemented locally per the V1 self-containment convention.
function fallingPetalPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = length * 0.18;
  const midY2 = length * 0.6;
  return `M0,0 C${-w},${midY1} ${-w * 0.55},${midY2} 0,${length} C${w * 0.55},${midY2} ${w},${midY1} 0,0 Z`;
}

// ---- Sunflower bloom — the SINGLE source for every sunflower silhouette in
// this file (currently just the envelope sticker — the "wax seal medallion"
// on the envelope and the "envelope sticker" are the same single element,
// there was never a second instance to unify; if a modal-side flower accent
// is ever added, it must call this same component, not a second copy,
// which is exactly how the bug this fixes happened in the first place). ----
//
// REGRESSION THIS FIXES: the envelope sticker used to build its own inline
// petal shape — same bezier *formula* as the flower field/medallion
// elsewhere in V1, but a narrow width-to-length ratio (~0.45) with petals
// tapering to a hard point. That combination reads fine as a full-size
// field flower (hero/SunsetHero.tsx's SunflowerSvg, at 40-64px heads with
// 12-16 petals) but NOT as a small sticker/medallion: with narrow, sharp
// petals radiating from a center, adjacent petals don't overlap at the
// base, leaving visible gaps — which reads as a spiky sunburst/star, not a
// flower. This was true even at the medallion's old 64px size (re-tested
// directly: the "compass burst" read persisted regardless of scale, so the
// earlier medallion fix's real problem — narrow petal proportions — was
// never actually solved, just made larger and less obviously wrong).
//
// The actual fix is a different petal shape, not a different size:
//   - width raised to ~0.44x the size (was ~0.19x) so adjacent petals
//     overlap at the base and there's no negative space between them
//   - the tip is a small rounded arc instead of a hard cusp (two bezier
//     curves meeting at one point always reads as a "ray," however wide the
//     base is)
//   - 10 petals (not 12-14) — fewer, fatter petals read as "flower," more
//     thin petals read as "sunburst," independent of curve smoothness
// Verified by rendering every candidate and reading the actual pixels, not
// by eyeballing the code: this combination is the first one that reads
// unmistakably as a rounded flower at both the 34px sticker scale and
// larger (checked up to 64px) — see the size/shape comparison grids from
// this fix for the ones that were tried and rejected.
function sunflowerPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

const BLOOM_PETAL_COUNT = 10;
const BLOOM_WIDTH_RATIO = 0.44;
const BLOOM_LENGTH_RATIO = 0.36;
const BLOOM_CENTER_RATIO = 0.24;
const BLOOM_PETAL_ANGLES = Array.from({ length: BLOOM_PETAL_COUNT }, (_, i) => (360 / BLOOM_PETAL_COUNT) * i);

function SunflowerBloom({ size }: { size: number }) {
  const center = size / 2;
  const centerRadius = size * BLOOM_CENTER_RATIO;
  const petalLength = size * BLOOM_LENGTH_RATIO;
  const petalWidth = size * BLOOM_WIDTH_RATIO;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden="true">
      <g fill={SUNFLOWER_PETAL_COLOR}>
        {BLOOM_PETAL_ANGLES.map((angle) => (
          <path
            key={angle}
            d={sunflowerPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
            transform={`rotate(${angle} ${center} ${center})`}
          />
        ))}
      </g>
      <circle cx={center} cy={center} r={centerRadius} fill={SUNFLOWER_CENTER_COLOR} />
    </svg>
  );
}

// Uniform scale-up for the whole closed-envelope illustration — the
// envelope read as too small against the section around it. Every
// hand-placed pixel constant for the envelope body/flap/paper-peek and its
// two stickers multiplies through this one factor (see the "Envelope"
// section below), so the illustration scales as a whole instead of just
// its outer bounding box.
const ENVELOPE_SCALE = 1.5;

const STICKER_SIZE = Math.round(34 * ENVELOPE_SCALE);

// ---- Flying/perched butterfly (one persistent identity via layoutId) ----
// The layout transition alone (a spring FLIP between two measured rects)
// already reads as motion, not a teleport; the extra rotate wobble layered
// on top via `animate` is what pushes it from "slides over" to "flutters
// over" — and it keeps running as a small continuous idle animation once
// docked at either end (sticker or perched), which doubles as the "gentle
// wing-flap/bob" the spec asks for at rest.
function FlightButterfly({ size, docked }: { size: number; docked: boolean }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  // Same viewport-gated play/pause as every other Lottie in V1 — harmless
  // no-op for the perched-in-modal usage of this component (the modal is
  // always on screen while it exists, so isInView settles true almost
  // immediately there), but meaningful for the docked-on-envelope usage:
  // that instance sits in the section's normal scroll flow and can be
  // scrolled past while still mounted (envelope closed, never opened).
  const { ref: viewportRef, isInView } = useV1InViewport<HTMLDivElement>();

  useEffect(() => {
    if (isInView) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.pause();
    }
  }, [isInView]);

  return (
    <motion.div
      ref={viewportRef}
      layoutId={BUTTERFLY_LAYOUT_ID}
      className="pointer-events-none"
      style={{ width: size, height: size, filter: BUTTERFLY_FILTER_DUSTY_ROSE }}
      animate={{ rotate: docked ? [0, -6, 6, 0] : [0, -18, 14, -8, 0] }}
      transition={{
        layout: { type: "spring", stiffness: 170, damping: 18 },
        rotate: { duration: docked ? 3.2 : 0.9, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <Lottie animationData={butterflyAnimation} loop autoplay lottieRef={lottieRef} />
    </motion.div>
  );
}

// ---- Ambient decorative butterflies (closed state only) ----
// Purely decorative fill for the empty space around the envelope — NOT the
// same identity as the interactive sticker/perched butterfly above (that one
// keeps its own single layoutId and is never duplicated). These have no
// layoutId, no interactivity, sit at a negative z-index (behind the in-flow
// envelope content but above the section's own background), and unmount
// entirely once the letter opens, which both removes them from the reading
// experience and doubles as the "pause" the spec asks for.
//
// BUG THIS FIXES: they were rendering completely invisible. `-z-10` only
// paints "above the stacking-context root's background, below its in-flow
// children" *if* that root element actually establishes a stacking context
// — and `position: relative` with no explicit z-index does NOT (per the
// CSS2.1 stacking rules, a positioned element only becomes a stacking-
// context root once it has a z-index other than `auto`). The <section> this
// lives in is `relative` with no z-index, so it wasn't one: the negative
// z-index escaped it entirely and resolved against a much higher ancestor,
// landing this layer behind opaque content it was never meant to compete
// with. Confirmed by rendering with `isolation: isolate` forced onto the
// section (which does unconditionally start a new stacking context) — the
// butterflies immediately appeared. The actual fix is the `isolate` class
// on the <section> below, which makes `-z-10` here mean what it was always
// supposed to mean: local to this section, not the whole page.
//
// Anchor positions are fixed (percentages of the whole section box, chosen
// to clear the centered envelope+caption column at any viewport width) —
// same reasoning as DECKLE_JITTER above: this needs to look hand-placed,
// not regenerate a layout every session. Only the per-instance drift
// distance/duration/delay is randomized, and that randomization goes
// through useSyncExternalStore (server render + first client paint both
// return EMPTY_AMBIENT_BUTTERFLIES, so there is nothing for hydration to
// mismatch), exactly the pattern FloatingHearts.tsx uses for its own
// Math.random()-backed values.
const AMBIENT_ANCHORS: { left: number; top: number }[] = [
  { left: 10, top: 14 },
  { left: 87, top: 24 },
  { left: 16, top: 83 },
];
// Skips BUTTERFLY_FILTER_DUSTY_ROSE — that tone is reserved for the single
// interactive sticker/perched butterfly, so these three read as visibly
// their own thing, not a duplicate of it.
const AMBIENT_FILTERS = [BUTTERFLY_FILTER_CORAL, BUTTERFLY_FILTER_GOLD, BUTTERFLY_FILTER_TERRACOTTA];

interface AmbientButterflyConfig {
  id: number;
  left: number;
  top: number;
  size: number;
  filter: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

function randomAmbientButterfly(id: number): AmbientButterflyConfig {
  const anchor = AMBIENT_ANCHORS[id % AMBIENT_ANCHORS.length];
  return {
    id,
    left: anchor.left,
    top: anchor.top,
    size: 30 + Math.random() * 10,
    filter: AMBIENT_FILTERS[id % AMBIENT_FILTERS.length],
    duration: 8 + Math.random() * 4,
    delay: -(Math.random() * 5),
    driftX: 12 + Math.random() * 10,
    driftY: 8 + Math.random() * 8,
  };
}

const EMPTY_AMBIENT_BUTTERFLIES: AmbientButterflyConfig[] = [];

function noopSubscribe() {
  return () => { };
}

function useAmbientButterflies(count: number): AmbientButterflyConfig[] {
  const cacheRef = useRef<{ count: number; butterflies: AmbientButterflyConfig[] } | null>(null);

  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (!cacheRef.current || cacheRef.current.count !== count) {
        cacheRef.current = {
          count,
          butterflies: Array.from({ length: count }, (_, i) => randomAmbientButterfly(i)),
        };
      }
      return cacheRef.current.butterflies;
    },
    () => EMPTY_AMBIENT_BUTTERFLIES,
  );
}

// Pulled into its own component (rather than inlined in the .map() below)
// for the same reason hero/SunsetHero.tsx's FlappingButterfly is: the
// viewport-gated play/pause hook has to be called from a real component's
// top level, not from inside an inline .map() callback.
function AmbientButterfly({ b }: { b: AmbientButterflyConfig }) {
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
    <motion.div
      ref={viewportRef}
      className="absolute"
      style={{
        left: `${b.left}%`,
        top: `${b.top}%`,
        width: b.size,
        height: b.size,
        opacity: 0.6,
        filter: `${b.filter} blur(0.4px)`,
      }}
      animate={{
        x: [0, b.driftX, 0, -b.driftX, 0],
        y: [0, -b.driftY, 0, b.driftY, 0],
        rotate: [0, -8, 0, 8, 0],
      }}
      transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Lottie animationData={butterflyAnimation} loop autoplay lottieRef={lottieRef} />
    </motion.div>
  );
}

function AmbientButterflies() {
  const butterflies = useAmbientButterflies(3);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {butterflies.map((b) => (
        <AmbientButterfly key={b.id} b={b} />
      ))}
    </motion.div>
  );
}

// ---- Envelope (closed trigger) ----
// All pixel constants below are the original hand-tuned values times
// ENVELOPE_SCALE (see its definition above) — scaling the illustration as a
// whole, not just its outer box, is what keeps the flap/body/paper-peek/
// sticker proportions matching the bigger envelope instead of just
// stretching.
const ENVELOPE_W = Math.round(168 * ENVELOPE_SCALE);
const ENVELOPE_H = Math.round(116 * ENVELOPE_SCALE);
const FLAP_HINGE_Y = Math.round(18 * ENVELOPE_SCALE);
const FLAP_TIP_Y = Math.round(62 * ENVELOPE_SCALE);
const BODY_X = Math.round(8 * ENVELOPE_SCALE);
const FLAP_PATH = `M${BODY_X},${FLAP_HINGE_Y} L${ENVELOPE_W - BODY_X},${FLAP_HINGE_Y} L${ENVELOPE_W / 2},${FLAP_TIP_Y} Z`;

const BODY_Y = FLAP_HINGE_Y;
const BODY_W = ENVELOPE_W - BODY_X * 2;
const BODY_H = ENVELOPE_H - FLAP_HINGE_Y - BODY_X;

// Fixed, hand-picked jitter sequence (not Math.random()) — same
// hydration-safety reasoning as FLOWERS/CLOUDS elsewhere in V1: this needs
// to look irregular, not be regenerated per session. Cycled across all four
// edges of the envelope body so the outline reads as a deckle/torn paper
// edge instead of a perfectly flat vector rectangle, without needing a
// different value for every single point.
const DECKLE_JITTER = [0.7, -0.5, 0.9, -0.4, 0.6, -0.8, 0.5, -0.6, 0.8, -0.3];

function deckleRectPath(x: number, y: number, w: number, h: number, segmentsPerEdge: number): string {
  const points: [number, number][] = [];
  let cursor = 0;
  function addEdge(x1: number, y1: number, x2: number, y2: number, normalX: number, normalY: number) {
    for (let i = 0; i <= segmentsPerEdge; i++) {
      const t = i / segmentsPerEdge;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const isCorner = i === 0 || i === segmentsPerEdge;
      const jitter = isCorner ? 0 : DECKLE_JITTER[cursor++ % DECKLE_JITTER.length];
      points.push([px + normalX * jitter, py + normalY * jitter]);
    }
  }
  addEdge(x, y, x + w, y, 0, -1);
  addEdge(x + w, y, x + w, y + h, 1, 0);
  addEdge(x + w, y + h, x, y + h, 0, 1);
  addEdge(x, y + h, x, y, -1, 0);
  return `M${points.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(" L")} Z`;
}

const ENVELOPE_BODY_PATH = deckleRectPath(BODY_X, BODY_Y, BODY_W, BODY_H, 7);

function Envelope({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      layoutId={SHELL_LAYOUT_ID}
      onClick={onOpen}
      aria-label="Open the letter"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -5, 0], rotate: [-1, 1, -1] }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
      whileHover={{ scale: 1.05, y: -6 }}
      whileTap={{ scale: 0.96 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        layout: { type: "spring", stiffness: 160, damping: 20 },
        y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 4.4, repeat: Infinity, ease: "easeInOut" },
        opacity: { duration: 0.6 },
      }}
      className="relative block cursor-pointer"
      style={{ width: ENVELOPE_W, height: ENVELOPE_H }}
    >
      <svg viewBox={`0 0 ${ENVELOPE_W} ${ENVELOPE_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* A sliver of lighter paper peeking out below the envelope's
            bottom edge, drawn before (so behind) the body — reads as a
            letter tucked inside, just visible at the opening. */}
        <rect
          x={Math.round(24 * ENVELOPE_SCALE)}
          y={BODY_Y + BODY_H - Math.round(5 * ENVELOPE_SCALE)}
          width={ENVELOPE_W - Math.round(24 * ENVELOPE_SCALE) * 2}
          height={Math.round(11 * ENVELOPE_SCALE)}
          rx={1}
          fill="#fffdf8"
        />

        <path d={ENVELOPE_BODY_PATH} fill="#fdf6ec" stroke="#c9a68a" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>

      <motion.svg
        viewBox={`0 0 ${ENVELOPE_W} ${ENVELOPE_H}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ transformOrigin: `${ENVELOPE_W / 2}px ${FLAP_HINGE_Y}px` }}
        animate={{ rotate: 0, y: 0, opacity: 1 }}
      >
        <defs>
          {/* Flap fold gradient — lighter near the hinge, deepening toward
              the fold tip, so the flap reads as a folded plane catching
              light rather than a flat cutout. */}
          <linearGradient id="v1-letter-flap-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7e2d3" />
            <stop offset="100%" stopColor="#e3b190" />
          </linearGradient>
        </defs>
        <path
          d={FLAP_PATH}
          fill="url(#v1-letter-flap-gradient)"
          stroke="#c9a68a"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* Fold-line shadow — a soft dark stroke tracing the flap's crease,
            suggesting the shadow the folded paper casts onto the body. */}
        <path
          d={`M${BODY_X},${FLAP_HINGE_Y} L${ENVELOPE_W / 2},${FLAP_TIP_Y} L${ENVELOPE_W - BODY_X},${FLAP_HINGE_Y}`}
          fill="none"
          stroke="#6b4332"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.14}
        />
      </motion.svg>

      <div
        className="absolute"
        style={{
          left: Math.round(22 * ENVELOPE_SCALE),
          top: Math.round(66 * ENVELOPE_SCALE),
          width: STICKER_SIZE,
          height: STICKER_SIZE,
        }}
      >
        <SunflowerBloom size={STICKER_SIZE} />
      </div>

      <div
        className="absolute"
        style={{
          left: ENVELOPE_W - Math.round(22 * ENVELOPE_SCALE) - STICKER_SIZE,
          top: Math.round(62 * ENVELOPE_SCALE),
          width: STICKER_SIZE,
          height: STICKER_SIZE,
        }}
      >
        <FlightButterfly size={STICKER_SIZE} docked />
      </div>
    </motion.button>
  );
}

// ---- Falling petal burst (fixed hand-placed values, tied to the open
// action — not a continuous ambient effect like GoldenSkySection's own
// PetalDrift, and not randomized, so there's no hydration question either
// way: this only ever renders after a user click, which never happens
// during SSR/first paint, but using fixed values instead of Math.random()
// removes the question entirely rather than relying on that reasoning). ----
interface BurstPetal {
  left: number; // vw
  fallDistance: number; // px
  duration: number;
  delay: number;
  rotateStart: number;
  rotateEnd: number;
  swayAmount: number;
  size: number;
  color: string;
}

const BURST_PETALS: BurstPetal[] = [
  { left: 42, fallDistance: 260, duration: 1.3, delay: 0, rotateStart: 10, rotateEnd: 220, swayAmount: 30, size: 12, color: "#dd9a42" },
  { left: 47, fallDistance: 300, duration: 1.5, delay: 0.06, rotateStart: -20, rotateEnd: -260, swayAmount: 22, size: 10, color: "#d4919a" },
  { left: 52, fallDistance: 240, duration: 1.2, delay: 0.12, rotateStart: 40, rotateEnd: 300, swayAmount: 34, size: 13, color: "#dd9a42" },
  { left: 57, fallDistance: 320, duration: 1.6, delay: 0.02, rotateStart: -10, rotateEnd: -230, swayAmount: 18, size: 9, color: "#d4919a" },
  { left: 38, fallDistance: 280, duration: 1.4, delay: 0.18, rotateStart: 60, rotateEnd: 340, swayAmount: 26, size: 11, color: "#dd9a42" },
  { left: 62, fallDistance: 250, duration: 1.25, delay: 0.1, rotateStart: -35, rotateEnd: -280, swayAmount: 24, size: 12, color: "#d4919a" },
  { left: 45, fallDistance: 340, duration: 1.7, delay: 0.24, rotateStart: 20, rotateEnd: 260, swayAmount: 20, size: 10, color: "#dd9a42" },
  { left: 55, fallDistance: 220, duration: 1.15, delay: 0.16, rotateStart: -50, rotateEnd: -310, swayAmount: 32, size: 13, color: "#d4919a" },
  { left: 50, fallDistance: 300, duration: 1.45, delay: 0.3, rotateStart: 15, rotateEnd: 245, swayAmount: 16, size: 9, color: "#dd9a42" },
  { left: 40, fallDistance: 230, duration: 1.2, delay: 0.22, rotateStart: -25, rotateEnd: -270, swayAmount: 28, size: 11, color: "#d4919a" },
];

function PetalBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {BURST_PETALS.map((petal, i) => (
        <motion.div
          key={i}
          className="absolute top-[18%]"
          style={{ left: `${petal.left}vw`, color: petal.color }}
          initial={{ y: 0, opacity: 0, rotate: petal.rotateStart }}
          animate={{
            y: petal.fallDistance,
            opacity: [0, 1, 1, 0],
            rotate: petal.rotateEnd,
            x: [0, petal.swayAmount, -petal.swayAmount * 0.5, 0],
          }}
          transition={{ duration: petal.duration, delay: petal.delay, ease: "easeIn" }}
        >
          <svg viewBox="0 0 16 32" width={petal.size} height={petal.size * 2}>
            <path d={fallingPetalPath(26, 10)} fill="currentColor" transform="translate(8 3)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ---- Letter-by-letter reveal ----
// Deterministic stagger purely by character index — no Math.random(), no
// Date.now(), and this component only ever mounts after a user click
// (never during SSR/first paint), so there is nothing that could differ
// between server and client render to begin with.
const CHAR_DELAY = 0.016;
const REVEAL_BASE_DELAY = 0.45;

function TypewriterText({ text }: { text: string }) {
  const characters = Array.from(text);
  return (
    <p className="font-display relative text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: REVEAL_BASE_DELAY + i * CHAR_DELAY }}
          className={
            i === 0
              ? "float-left mr-3 text-6xl font-medium leading-[0.8] text-[#d97a5f] sm:text-7xl"
              : undefined
          }
        >
          {char}
        </motion.span>
      ))}
    </p>
  );
}

// Bootstrap Icons' "x-lg" glyph, inlined as raw path data rather than
// pulling in the bootstrap-icons package for a single icon — same visual
// result, no new dependency.
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Deterministic paper-grain texture: feTurbulence is a fixed algorithm given
// a seed and parameters (not Math.random()-backed), so this renders
// identically on every render — moot anyway, since the modal this lives in
// only ever mounts after a user click and never exists during SSR/first
// paint. mix-blend-multiply + a very low opacity keeps it a faint grain,
// not a visible pattern competing with text contrast.
function PaperGrain() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply"
    >
      <filter id="v1-letter-paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#v1-letter-paper-grain)" />
    </svg>
  );
}

// V1's counterpart to V2's message/LetterCard.tsx — same "quoted letter"
// idea, but staged as an interactive envelope-to-modal reveal instead of a
// static card: closed envelope (sunflower + butterfly stickers) -> click ->
// flap opens, the sticker butterfly flies to the modal's corner, petals
// flutter down, the shell morphs into a centered modal (shared layoutId,
// see SHELL_LAYOUT_ID above) -> the letter types itself out -> close (X or
// backdrop) reverses all of it, including the butterfly flying back to its
// exact original sticker position.
export default function SealedLetter({ message }: SealedLetterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPetals, setShowPetals] = useState(false);
  const { playFirstTime } = useV1Song();
  // Gates the portal below to client-only render passes — `document` doesn't
  // exist during SSR. Same useSyncExternalStore hydration trick as
  // AmbientButterflies above (getServerSnapshot/first-client-render both
  // return `false`, so there's nothing for hydration to mismatch on; the
  // "real" `true` snapshot only takes effect once React re-checks it after
  // mount), just applied to a plain boolean instead of a randomized list.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  function openLetter() {
    // Fired synchronously within the envelope's own onClick (see Envelope's
    // `onOpen={openLetter}` below), before any state updates — same
    // requirement V2's UnlockGate documents on its own onOpen prop: browser
    // autoplay policies only allow audio.play() to succeed when the call
    // itself originates synchronously inside a real user-gesture event
    // handler's call stack, not from a useEffect reacting to state change
    // afterward. playFirstTime() itself is a one-shot no-op past the first
    // call (see V1SongPlayer.tsx), so closing and reopening the envelope
    // later never restarts the song — it just leaves the floating player's
    // own play/pause state untouched.
    playFirstTime();
    setIsOpen(true);
    setShowPetals(true);
  }

  function closeLetter() {
    setIsOpen(false);
    setShowPetals(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLetter();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!showPetals) return;
    const timeout = window.setTimeout(() => setShowPetals(false), 1700);
    return () => window.clearTimeout(timeout);
  }, [showPetals]);

  return (
    <section className="relative isolate px-6 py-[120px]">
      <AnimatePresence>{!isOpen && <AmbientButterflies key="ambient-butterflies" />}</AnimatePresence>

      <div className="relative mx-auto flex max-w-[720px] flex-col items-center">
        {/* Scroll-into-view entrance ONLY — two plain wrapper motion.divs
            around the existing AnimatePresence/Envelope, not any change to
            Envelope's own props. Envelope already carries a lot of its own
            animation state (layoutId FLIP for the open/close morph, a
            perpetual idle float+wobble loop, whileHover/whileTap, its own
            small opacity-only whileInView) — touching any of that directly
            risked breaking already-tuned interaction logic the task
            explicitly says not to touch. Composing fadeUpVariant (outer,
            opacity+y) and scaleBlurVariant (inner, opacity+scale+blur) on
            two wrappers instead achieves the same combined "fade+scale in"
            entrance the task asks for while leaving Envelope's own JSX
            completely untouched — nested motion components with a
            `variants` prop and no own initial/animate automatically inherit
            their nearest animating ancestor's current state, so both
            wrappers (and by extension the Envelope inside them) animate in
            together the first time this scrolls into view. */}
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUpVariant}>
          <motion.div variants={scaleBlurVariant}>
            <AnimatePresence>{!isOpen && <Envelope onOpen={openLetter} />}</AnimatePresence>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {!isOpen && (
            <motion.p
              key="tap-caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-5 text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
            >
              Tap to open
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Both AnimatePresence blocks below (modal + petal burst) are
          portaled to document.body as a unit — NOT by putting createPortal
          *inside* each AnimatePresence's children (that was tried first and
          silently rendered nothing: createPortal's return value isn't a
          React.isValidElement() element, it's a distinct Portal object, so
          AnimatePresence — which clones its children to inject exit-
          tracking — couldn't recognize or clone it as a child at all).
          Portaling the whole AnimatePresence instead gives it a normal
          motion.div as its child, which it clones fine, while the portal
          still moves the actual DOM output to document.body.

          That's needed because both are `fixed`-position descendants of
          the <section isolate> above, and `isolate` makes that section a
          real stacking context — which traps `position: fixed` descendants
          inside its LOCAL paint order no matter how high their z-index is
          (later sibling sections like Gallery, outside that context, then
          paint on top of them regardless of scroll position). Rendering to
          document.body escapes that entirely.

          `isMounted` gates this to client-only render passes, since
          document.body doesn't exist during SSR — see its definition
          above. AnimatePresence tracks presence via the React element
          tree, not DOM position, so exit animations and the layoutId FLIP
          below both still work unchanged through the portal boundary. */}
      {isMounted &&
        createPortal(
          <>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  className="fixed inset-0 z-40 flex items-center justify-center p-6"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 1 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-[#2b160f]/40 backdrop-blur-sm"
                    onClick={closeLetter}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Outer wrapper carries the stacking/sizing context; the
                      card itself keeps its own `overflow-hidden` (needed to
                      clip PaperGrain/the ruled lines to the rounded
                      corners), so the perched butterfly below is a SIBLING
                      positioned outside that clipped box instead of a
                      child inside it — previously it was a child hanging
                      12px past the card's edge, which the card's own
                      overflow-hidden silently clipped away regardless of
                      z-index. */}
                  <div className="relative z-10 w-[90vw] max-w-lg">
                    <motion.div
                      layoutId={SHELL_LAYOUT_ID}
                      role="dialog"
                      aria-modal="true"
                      aria-label="A letter"
                      transition={{ layout: { type: "spring", stiffness: 160, damping: 20 } }}
                      // max-h-[88dvh] + overflow-y-auto (explicit
                      // overflow-x-hidden alongside it, not the bare
                      // `overflow-hidden` shorthand this used to be) — a
                      // long message on a short mobile viewport used to have
                      // no height cap at all, so it could render taller than
                      // the screen with nothing to scroll it into view.
                      // Explicitly setting BOTH axes (never leaving one at
                      // its `visible` default) is what avoids the earlier
                      // "one non-visible axis forces the other to auto too"
                      // scrollbar bug (see gallery/SunlitPolaroids.tsx's own
                      // lightbox history) — with x explicitly hidden here,
                      // there's no `visible` axis left for that CSS rule to
                      // promote.
                      //
                      // FOLLOW-UP FIX: at 85dvh, a scrollbar was rendering
                      // for ordinary, visually-complete-looking messages —
                      // not a genuinely-too-long letter, just content
                      // landing close enough to the old cap that classic
                      // (non-overlay) desktop-browser scrollbars painted a
                      // track for what was, in practice, only a few px of
                      // real overflow. The fix is headroom, not a different
                      // mechanism: mobile-only py-14 -> py-10 (unprefixed;
                      // sm:py-16 untouched) frees 32px straight back to the
                      // text, and the cap itself moved 85dvh -> 88dvh for a
                      // bit more margin — still comfortably clear of the
                      // real viewport at 375x667/390x844/414x896 once the
                      // backdrop's own p-6 (48px total) is accounted for
                      // (88% x 667 + 48 = 635px, vs. a 667px viewport).
                      className="relative max-h-[88dvh] w-full overflow-y-auto overflow-x-hidden rounded-2xl border border-[#c9a68a]/60 bg-[#fdf6ec] px-8 py-10 shadow-[0_25px_50px_-12px_rgba(107,67,50,0.25),inset_0_0_0_1px_rgba(255,251,244,0.5)] sm:px-12 sm:py-16"
                    >
                      <PaperGrain />

                      {/* Faint ruled guide lines behind the text, evoking
                          handwritten stationery — spacing approximates the
                          text's own line-height, opacity kept low enough
                          to stay a texture, not a competing pattern. */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-8 top-10 bottom-10 sm:inset-x-12"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(201,166,138,0.16) 31px, rgba(201,166,138,0.16) 32px)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={closeLetter}
                        aria-label="Close"
                        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#4a2f26]/50 transition-colors hover:bg-[#c9a68a]/15 hover:text-[#4a2f26]"
                      >
                        <CloseIcon />
                      </button>

                      {/* overflow-hidden on both quote-mark spans: root
                          cause of the "scrollbar even though every line is
                          visible" bug — measured directly (Chromium
                          devtools protocol, not estimated): with the card's
                          own scrollHeight/clientHeight instrumented and each
                          direct child individually toggled `display:none`
                          to isolate which one moved the number, only the
                          bottom-anchored closing-quote span changed
                          anything — removing it dropped scrollHeight from
                          389 to 373 (= clientHeight exactly), a 16px delta
                          that matched no descendant's own measured
                          getBoundingClientRect() (nothing exceeded 373.5 of
                          374.5 available). That combination — contributes to
                          scrollHeight, invisible in the actual rendered
                          box — is a known browser quirk: a huge font-size
                          (text-8xl/9xl) forced to leading-none can still
                          reserve its font's natural (untruncated) descender
                          metrics for scrollable-overflow purposes even
                          though the visible/painted line box respects
                          leading-none, and an absolutely positioned
                          `bottom-0` box is exactly where that invisible
                          reserve shows up as extra scrollHeight past the
                          real content. Confirmed empirically both ways:
                          adding overflow-hidden here dropped scrollHeight to
                          exactly 373 (zero delta, no scrollbar) with the
                          span's own rendered rect byte-identical (96px
                          tall, same position) — nothing about how the glyph
                          looks changes, only whether its internal metrics
                          leak into the scrollable ancestor's overflow
                          calculation. Applied to the opening quote too,
                          defensively/symmetrically — it measured a 0px
                          delta with this message (top-anchored, so it isn't
                          currently the tallest-reaching element), but a
                          short enough message could make it so, and this
                          has no visual cost either way. */}
                      <span
                        aria-hidden="true"
                        className="font-display pointer-events-none absolute left-4 top-0 overflow-hidden select-none text-8xl leading-none text-[#c9a68a]/30 sm:left-6 sm:text-9xl"
                      >
                        &ldquo;
                      </span>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="relative"
                      >
                        <TypewriterText text={message} />
                      </motion.div>

                      <span
                        aria-hidden="true"
                        className="font-display pointer-events-none absolute bottom-0 right-4 overflow-hidden select-none text-8xl leading-none text-[#c9a68a]/30 sm:right-6 sm:text-9xl"
                      >
                        &rdquo;
                      </span>
                    </motion.div>

                    {/* Perched butterfly: a sibling of the card (not a
                        child), so it sits outside the card's own
                        overflow-hidden clipping — see the comment on the
                        wrapper div above. z-20 keeps it explicitly above
                        the card even though DOM order alone would already
                        put it there. Container is sized to match
                        FlightButterfly's own 60px (not the modal's 40px
                        close-button/icon scale) so the Lottie doesn't
                        overflow the box it's positioned by.
                        Bottom-right (moved from bottom-left): clear of the
                        close button, which sits in the opposite corner
                        (top-right). It DOES share a corner with the
                        closing &rdquo; mark below (bottom-0 right-4/6,
                        text-8xl/9xl, 30% opacity) — hanging low right at
                        the card's edge is a deliberate choice there, not an
                        oversight: with leading-none, a quotation glyph's
                        actual ink sits in the upper portion of its own em
                        box (quote marks hang near cap-height, well short of
                        the baseline), so the box's own lower third or so —
                        exactly where this butterfly's -bottom-3 hang sits —
                        reads as empty in practice even though the two
                        elements' bounding boxes technically overlap. Not
                        pixel-verified against a real render (skipped this
                        pass per request) — if it still visibly collides,
                        nudge this div's own -right-N/-bottom-N rather than
                        moving the quote mark. */}
                    <div className="absolute -bottom-3 -right-3 z-20 h-[60px] w-[60px]">
                      <FlightButterfly size={60} docked />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isOpen && showPetals && <PetalBurst key="petal-burst" />}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </section>
  );
}
