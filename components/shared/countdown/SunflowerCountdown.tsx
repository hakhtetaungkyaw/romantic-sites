"use client";

import { motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import { fadeUpVariant, scaleBlurVariant, staggerContainerVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import { useV1InViewport } from "@/lib/useV1InViewport";

import sunflowerAnimation from "@/public/animations/sunflower.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx and ambient/GoldenSkySection.tsx. Self-contained (own
// copy of the elapsed-time math and petal-bezier construction, not imports
// from countdown/GlassCards.tsx or message/SealedLetter.tsx) so this file is
// never shared with AnniversaryV2.tsx.

interface SunflowerCountdownProps {
  specialDate: string;
  label?: string;
}

interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO_ELAPSED: Elapsed = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function getElapsed(specialDate: string): Elapsed {
  const diff = Math.max(0, Date.now() - new Date(specialDate).getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function subscribe(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

// Small sunflower bloom marker sat above each digit card — this used to be
// its own narrow, hard-cusp 5-petal shape, which (per the same finding
// documented in message/SealedLetter.tsx's SunflowerBloom regression fix)
// reads as a spiky sunburst/star rather than a flower, not just at this
// icon's small size but regardless of scale: a narrow width-to-length ratio
// with pointed tips leaves visible gaps between adjacent petals, which is
// exactly the "5-pointed star" this file's name promised but never actually
// delivered. Replaced with the corrected rounded-bloom construction (wide
// overlapping-base petals, rounded tip, 10 petals) already established
// there and reused again in gallery/SunlitPolaroids.tsx's lightbox corner
// stamp — reimplemented locally per V1's per-file self-containment
// convention, same terracotta petals / brown center coloring as those.
function bloomPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

const BLOOM_SIZE = 20;
const BLOOM_CENTER = BLOOM_SIZE / 2;
const BLOOM_PETAL_COUNT = 10;
const BLOOM_WIDTH_RATIO = 0.44;
const BLOOM_LENGTH_RATIO = 0.36;
const BLOOM_CENTER_RATIO = 0.24;
const BLOOM_ANGLES = Array.from({ length: BLOOM_PETAL_COUNT }, (_, i) => (360 / BLOOM_PETAL_COUNT) * i);

function DigitBloom() {
  const centerRadius = BLOOM_SIZE * BLOOM_CENTER_RATIO;
  const petalLength = BLOOM_SIZE * BLOOM_LENGTH_RATIO;
  const petalWidth = BLOOM_SIZE * BLOOM_WIDTH_RATIO;

  return (
    <motion.svg
      viewBox={`0 0 ${BLOOM_SIZE} ${BLOOM_SIZE}`}
      className="h-4 w-4"
      aria-hidden="true"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <g fill={SUNFLOWER_PETAL_COLOR}>
        {BLOOM_ANGLES.map((angle) => (
          <path
            key={angle}
            d={bloomPetalPath(BLOOM_CENTER, BLOOM_CENTER, centerRadius * 0.5, petalLength, petalWidth)}
            transform={`rotate(${angle} ${BLOOM_CENTER} ${BLOOM_CENTER})`}
          />
        ))}
      </g>
      <circle cx={BLOOM_CENTER} cy={BLOOM_CENTER} r={centerRadius} fill={SUNFLOWER_CENTER_COLOR} />
    </motion.svg>
  );
}

// Muted olive/brown-green — V1's palette has no established green, so this
// is picked to sit near the warm dark-brown text/stem tones (#4a2f26,
// #6b4332) rather than a bright saturated green, so the vine reads as part
// of the same warm family instead of an unrelated accent color.
const VINE_COLOR = "#7d8c5a";

// Small pointed-oval leaf — identical construction to
// timeline/SunsetTimeline.tsx's own vineLeafPath (both files already used
// this exact formula; the "blob" look reported against this file's version
// wasn't a different/wrong shape, it was this SVG's own
// preserveAspectRatio="none" stretch below — see VineConnector's comment).
// `length`/`width` are the leaf's own size before the caller's
// translate+rotate places it along the vine.
function vineLeafPath(length: number, width: number): string {
  const w = width / 2;
  return `M0,0 Q${w},${-length * 0.5} 0,${-length} Q${-w},${-length * 0.5} 0,0 Z`;
}

// Fixed, hand-placed points (not derived/random) — same reasoning as every
// other hand-placed layout constant across V1: this is decorative and needs
// to look the same on every render, not regenerated. Evenly spaced across
// the 0-200 viewBox so the row's 4 cards get a regular, recurring leaf
// rhythm beneath them regardless of exact card widths. Y-values sit on a
// midline of 20 (not the original 12) — viewBox height grew from 24 to 40
// to give the larger leaves below room to extend without clipping; the
// wave's own shape/amplitude is otherwise unchanged, just shifted down 8px
// to stay centered in the taller box.
const VINE_PATH =
  "M0,20 C15,12 35,28 50,20 C65,12 85,28 100,20 C115,12 135,28 150,20 C165,12 185,28 200,20";
// Doubled from 4 to 8 leaves (same alternating up/down, left-tilt/right-tilt
// pattern as before, just twice the frequency) so they read as a recurring
// rhythm along the vine rather than a couple of isolated marks.
const VINE_LEAVES = [
  { x: 12, y: 15, angle: -35 },
  { x: 37, y: 25, angle: 35 },
  { x: 62, y: 15, angle: -35 },
  { x: 87, y: 25, angle: 35 },
  { x: 112, y: 15, angle: -35 },
  { x: 137, y: 25, angle: 35 },
  { x: 162, y: 15, angle: -35 },
  { x: 187, y: 25, angle: 35 },
];

// Decorative stem threading behind the 4 countdown cards, like the row sits
// along a single flowering vine — muted tone, low opacity, still a quiet
// structural detail rather than a focal element, but with more visual
// weight than its first pass (stem stroke 1.5px -> 2px, leaves ~1.9x
// bigger, double the leaf count) so it reads clearly as an intentional
// botanical element rather than a faint afterthought. Absolutely positioned
// behind the row; the cards themselves get `relative` (see the row below)
// so they paint above it via normal positioned-stacking order and the vine
// only shows through the gaps between cards, instead of needing an
// explicit/negative z-index.
//
// LEAF SHAPE FIX: the stem's own <svg viewBox="0 0 200 40"
// preserveAspectRatio="none"> stretches non-uniformly to fill the row's
// real pixel width (e.g. ~1.6-1.9x horizontally at typical row widths,
// ~1x vertically) — fine for the wave path, which just reads as a slightly
// different curve, but it was ALSO stretching the leaves, squashing
// vineLeafPath()'s actual teardrop silhouette into the flat oval "blob"
// that prompted this fix. The leaves are now each their own small,
// unstretched SVG (`preserveAspectRatio` default `xMidYMid meet`, width/
// height matching the viewBox 1:1) positioned via percentage offsets
// derived from the same VINE_LEAVES coordinates, so the true teardrop
// shape renders undistorted regardless of the row's actual width — same
// fix timeline/SunsetTimeline.tsx's vertical vine never needed, since that
// one's SVG maps 1:1 to real pixels with no stretching at all.
function VineConnectorDesktop() {
  return (
    // sm: and up only (see VineConnectorMobile below for <sm) — this is the
    // single-row horizontal vine, correct only when all 4 cards actually
    // fit on one line (sm:w-20 x4 + sm:gap-5 x3 = 380px, well under any sm+
    // viewport).
    // motion.div (not a plain div) + variants={fadeUpVariant}, no own
    // initial/whileInView — this now sits inside SunflowerCountdown's
    // shared staggerContainerVariant group (see the default export below),
    // inheriting hidden/visible propagation from that ancestor rather than
    // animating on its own. Everything else here (className, the SVGs
    // inside) is unchanged.
    <motion.div
      aria-hidden="true"
      variants={fadeUpVariant}
      className="pointer-events-none absolute left-0 top-1/2 hidden h-10 w-full -translate-y-1/2 opacity-70 sm:block"
    >
      <svg
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d={VINE_PATH} fill="none" stroke={VINE_COLOR} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {VINE_LEAVES.map((leaf) => (
        <svg
          key={leaf.x}
          viewBox="0 0 28 28"
          width={28}
          height={28}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(leaf.x / 200) * 100}%`, top: `${(leaf.y / 40) * 100}%` }}
        >
          <path
            d={vineLeafPath(13, 8)}
            fill={VINE_COLOR}
            transform={`translate(14 20) rotate(${leaf.angle})`}
          />
        </svg>
      ))}
    </motion.div>
  );
}

// Below sm:, the row's `flex-wrap` reflows the 4 cards into a 2x2 grid
// (w-[74px] x4 + gap-3 x3 = 332px, wider than a ~327px-narrow-phone's
// available row width) — a single horizontal line has nothing to run
// through in that arrangement. This reshapes the SAME vine (identical
// VINE_COLOR, strokeWidth, and vineLeafPath() construction as
// VineConnectorDesktop above) into a bracket/S-curve that threads across
// the top row, curls down the right side, then back across the bottom row —
// touching all 4 card positions in their actual 2x2 spots instead of
// floating through the middle of both rows.
//
// Sizing: both wrapped rows are the same width (2 x 74px cards + one 12px
// gap-3 = 160px) and both get centered independently by the row's own
// `justify-center` — so a container fixed at exactly that same 160px width
// and centered the same way (`left-1/2 -translate-x-1/2`) lines up with the
// card cluster exactly, at 375px/390px/414px/anything else alike, without
// needing to read the cards' real rendered position at runtime. Height is
// the one dimension that can't be hardcoded (card height depends on
// content), so the container uses `inset-y-0` instead of a fixed h-*  — an
// absolutely positioned box with both `top` and `bottom` set stretches to
// exactly match its containing block's real auto-computed height (here,
// the row div's own height, i.e. both wrapped rows + the row-gap between
// them). The path/leaf viewBox below is 0-160 horizontally (mapping 1:1 to
// that fixed 160px, no stretch) and 0-100 vertically (mapping to
// whatever that real height turns out to be) — so viewBox y=25 always lands
// at 25% down the ACTUAL box, same value a leaf's own `top: 25%` would
// resolve to, keeping the path and its leaves aligned regardless of how
// tall the cards render.
const VINE_PATH_MOBILE =
  "M10,25 C25,17 40,33 55,25 C70,17 90,33 105,25 C120,17 135,20 150,25 C158,35 158,65 150,75 C135,83 120,67 105,75 C90,83 70,67 55,75 C40,83 25,67 10,75";
const VINE_LEAVES_MOBILE = [
  { x: 20, y: 18, angle: -35 },
  { x: 55, y: 30, angle: 35 },
  { x: 105, y: 18, angle: -35 },
  { x: 140, y: 30, angle: 35 },
  { x: 140, y: 70, angle: 35 },
  { x: 105, y: 82, angle: -35 },
  { x: 55, y: 70, angle: 35 },
  { x: 20, y: 82, angle: -35 },
];
const VINE_MOBILE_WIDTH = 160;

function VineConnectorMobile() {
  return (
    // Same motion.div + inherited variants={fadeUpVariant} treatment as
    // VineConnectorDesktop above, for the same reason.
    <motion.div
      aria-hidden="true"
      variants={fadeUpVariant}
      className="pointer-events-none absolute inset-y-0 left-1/2 w-[160px] -translate-x-1/2 opacity-70 sm:hidden"
    >
      <svg
        viewBox={`0 0 ${VINE_MOBILE_WIDTH} 100`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d={VINE_PATH_MOBILE} fill="none" stroke={VINE_COLOR} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {VINE_LEAVES_MOBILE.map((leaf, i) => (
        <svg
          key={i}
          viewBox="0 0 28 28"
          width={28}
          height={28}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(leaf.x / VINE_MOBILE_WIDTH) * 100}%`, top: `${leaf.y}%` }}
        >
          <path
            d={vineLeafPath(13, 8)}
            fill={VINE_COLOR}
            transform={`translate(14 20) rotate(${leaf.angle})`}
          />
        </svg>
      ))}
    </motion.div>
  );
}

function VineConnector() {
  return (
    <>
      <VineConnectorDesktop />
      <VineConnectorMobile />
    </>
  );
}

// public/animations/sunflower.json bakes the flower head AND a swaying
// stem AND its leaves into one 1000x1000 animation, confirmed by reading
// the raw JSON's layer geometry directly (not guessed from how it looks
// rendered): the head's shape layers (petals + center disc) span roughly
// y:0-532, the stem layer (its own keyframed/animated path) spans
// y:455-950, and the two leaf layers span y:567-845 and y:718-845. There's
// no player prop (segment/marker/etc.) that can render only part of a
// Lottie's artwork, so BLOOM_HEAD_CROP_RATIO below crops it visually
// instead — see BloomCenterpiece.
//
// 0.55 (55%) sits just past the head's measured ~53.2% bottom edge: tight
// enough that none of the stem/leaves' OWN bounding boxes are ever
// uncovered (leaves don't start until 56.7%), with a small safety margin
// over the exact 53.2% measurement since that figure ignores each shape's
// rotation keyframes (approximated from raw path points only) and could
// undercount a petal tip's true swept extent.
const BLOOM_HEAD_CROP_RATIO = 0.55;

// The section's one large, unique focal bloom — the real
// public/animations/sunflower.json Lottie at native/unfiltered color, same
// treatment as ambient/GoldenSkySection.tsx's centerpiece (that file
// confirmed via direct JSON inspection that this asset loops seamlessly).
// Deliberately NOT another DigitBloom: this reads as a single "the vine
// blooms here" moment above the label, clearly larger and more vivid than
// the 4 small golden-amber petal-path icons in the cards below, rather than
// a 5th instance of the same small icon.
function BloomCenterpiece() {
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
    // 112px/144px wide — ~1.75x/1.8x the original 64px/80px, so this reads
    // as a clear unique focal point above the card row rather than just a
    // slightly-bigger icon. Height is no longer an explicit class: this
    // outer box IS the crop frame (`overflow-hidden` + `aspect-ratio: 1 /
    // BLOOM_HEAD_CROP_RATIO`, so its height is always exactly
    // BLOOM_HEAD_CROP_RATIO times its width), showing only the top slice of
    // the inner square.
    //
    // No own initial/whileInView/transition — inherits hidden/visible from
    // SunflowerCountdown's shared staggerContainerVariant group via
    // variants={scaleBlurVariant} instead, same as every other centerpiece
    // across V1. ref={viewportRef} is the separate, unrelated
    // IntersectionObserver hook pausing this Lottie while off screen.
    <motion.div
      ref={viewportRef}
      className="mx-auto w-28 overflow-hidden sm:w-36"
      style={{ aspectRatio: `1 / ${BLOOM_HEAD_CROP_RATIO}` }}
      variants={scaleBlurVariant}
    >
      {/* Full, un-cropped 1:1 render of the Lottie's own square canvas,
          top-aligned (no vertical offset needed — the head already starts
          at the very top of the artwork). Taller than the outer frame
          above, so its lower portion (where the stem/leaves are) falls
          outside the frame and is clipped by that frame's overflow-hidden,
          while the animation itself keeps playing normally underneath. */}
      <div style={{ aspectRatio: "1 / 1" }}>
        <Lottie animationData={sunflowerAnimation} loop autoplay lottieRef={lottieRef} />
      </div>
    </motion.div>
  );
}

// V1's counterpart to V2's countdown/GlassCards.tsx — same elapsed-time
// math and per-tick digit pop, but warm cream cards with a rose-gold border
// instead of dark glassmorphism, and a small bloom marker above each digit
// in place of that version's plain top edge.
export default function SunflowerCountdown({
  specialDate,
  label = "Blooming since",
}: SunflowerCountdownProps) {
  // useSyncExternalStore ticks the clock without a setState-in-effect render
  // pass, and lets the server/first-paint snapshot (zeroed) differ safely
  // from the live one. Same pattern as countdown/GlassCards.tsx.
  const cacheRef = useRef<Elapsed>(ZERO_ELAPSED);

  const elapsed = useSyncExternalStore(
    subscribe,
    () => {
      const next = getElapsed(specialDate);
      const prev = cacheRef.current;
      if (
        prev.days === next.days &&
        prev.hours === next.hours &&
        prev.minutes === next.minutes &&
        prev.seconds === next.seconds
      ) {
        return prev;
      }
      cacheRef.current = next;
      return next;
    },
    () => ZERO_ELAPSED,
  );

  const units: { value: number; label: string }[] = [
    { value: elapsed.days, label: "Days" },
    { value: elapsed.hours, label: "Hours" },
    { value: elapsed.minutes, label: "Minutes" },
    { value: elapsed.seconds, label: "Seconds" },
  ];

  return (
    <section className="px-6 py-[120px] text-center">
      {/* Heading/centerpiece/vine/cards now reveal together via the shared
          V1 scroll-reveal system (lib/v1ScrollReveal.ts) — staggerContainerVariant
          on this wrapper cascades down to each child's own variants prop in
          sequence, replacing the single flat fade+rise this whole block
          used to share. The per-tick digit "pop" (the motion.span keyed on
          unit.value below) is untouched — that's the countdown timer's own
          live-update animation, not a scroll reveal, and firing every
          second regardless of scroll position is exactly what it's
          supposed to do. */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainerVariant}
      >
        <BloomCenterpiece />

        <motion.p
          variants={fadeUpVariant}
          className="font-display mt-4 text-xs uppercase tracking-[0.35em] text-[#4a2f26]/60 sm:text-sm"
        >
          {label}
        </motion.p>

        <div className="relative mt-6 flex flex-wrap justify-center gap-3 sm:gap-5">
          <VineConnector />
          {units.map((unit) => (
            <motion.div
              key={unit.label}
              variants={fadeUpVariant}
              // Previously unified with timeline/SunsetTimeline.tsx's
              // MilestoneCard (same border-l-4 accent strip, same
              // shadow-[#6b4332]/15 weight) — with Timeline, Gallery, and
              // Countdown now meant to read as visually distinct "acts",
              // that shared chrome made this compact digit tile feel like a
              // shrunken copy of Timeline's wide content card rather than
              // its own thing. Chrome-only differentiation, nothing else
              // touched: rounder corners (rounded-2xl -> rounded-3xl, more
              // medallion-like for a small tile than a content card),
              // no left-edge accent strip (a symmetric border instead, at a
              // touch more opacity — /40 -> /50 — since there's no strip
              // adding visual weight anymore), a top-down gradient instead
              // of MilestoneCard's diagonal one (suits a small symmetric
              // tile better than a wide rectangle), and a warm
              // terracotta-tinted shadow (shadow-[#d97a5f]/20) instead of
              // MilestoneCard's neutral brown one, fitting this section's
              // "blooming" motif. Size/layout (w-[74px]/w-20, py-4/py-5)
              // and everything inside the card are unchanged.
              className="relative flex w-[74px] flex-col items-center gap-1.5 rounded-3xl border border-[#c9a68a]/50 bg-gradient-to-b from-[#fdf6ec] to-[#f3e2c9] py-4 shadow-lg shadow-[#d97a5f]/20 sm:w-20 sm:py-5"
            >
              <DigitBloom />
              <motion.span
                key={unit.value}
                initial={{ opacity: 0.4, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="font-display text-2xl font-medium text-[#4a2f26] sm:text-3xl"
              >
                {String(unit.value).padStart(2, "0")}
              </motion.span>
              <span className="text-[10px] uppercase tracking-widest text-[#4a2f26]/50">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
