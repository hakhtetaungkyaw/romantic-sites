"use client";

import { motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { formatPeopleHeading } from "@/lib/people";
import { BUTTERFLY_FILTER_DUSTY_ROSE, BUTTERFLY_FILTER_GOLD } from "@/lib/v1ButterflyFilters";
import { fadeUpVariant, scaleBlurVariant, staggerContainerVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import { useV1InViewport } from "@/lib/useV1InViewport";
import type { SitePerson } from "@/types/site";

import butterflyAnimation from "@/public/animations/butterfly.json";
import sunflowerAnimation from "@/public/animations/sunflower.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx and ambient/GoldenSkySection.tsx. Self-contained (own
// copy of the ampersand-accent helper, glow/petal-drift techniques, etc. —
// not imports from those files) so this file is never shared with
// AnniversaryV2.tsx.

interface SunsetSignatureProps {
  people: SitePerson[];
  groupTitle?: string;
  closingLine?: string;
}

// AMPERSAND_ACCENT_COLOR is intentionally NOT the plain terracotta/coral
// #d97a5f used for this exact same role elsewhere in V1 (e.g.
// hero/SunsetHero.tsx, message/SealedLetter.tsx's TypewriterText drop cap).
// This value was originally tuned (dropping #d97a5f's lightness from ~61%
// to ~24% at the same hue/saturation) against a much deeper background this
// section used to sit on — a page-level gradient's darkest terracotta stop,
// ~#e2a077 — where #d97a5f itself computed to a WCAG contrast ratio of only
// ~1.4:1. Re-checked again against templates/AnniversaryV1.tsx's current
// "Sand & Dusty Rose" gradient (lib/v1SectionGradients.ts): worst case, its
// darkest stop (#c9a29b), computes to ~4.9:1 — still comfortably clears
// normal-text AA (4.5:1), and ~9.6:1 against the gradient's lightest stop
// (#f5ebdd). No further adjustment needed. Still deliberately distinct from
// the heading's own #4a2f26 (a much less saturated neutral brown), so the
// two keep contrasting with each other the way the design intends.
const AMPERSAND_ACCENT_COLOR = "#642817";

function withAccentedAmpersands(text: string) {
  return text
    .split(/(&)/)
    .map((part, i) =>
      part === "&" ? (
        <span key={i} style={{ color: AMPERSAND_ACCENT_COLOR }}>
          &amp;
        </span>
      ) : (
        part
      ),
    );
}

// ---- Falling petal ambient ----
// Ported verbatim from ambient/GoldenSkySection.tsx's own PetalDrift (same
// bezier construction, same randomization ranges, same
// useSyncExternalStore hydration-safe pattern: an empty, deterministic
// snapshot on the server and first client paint, so there's nothing for
// hydration to mismatch on, then the randomized client-only layout swaps in
// right after) — reused rather than re-derived, per the task. Kept as this
// file's own local copy rather than an import, per V1's per-file
// self-containment convention.
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

// Same petal silhouette and color (#dd9a42, sampled from the sunflower
// Lottie's own petal fills) as GoldenSkySection.tsx's own copy.
function fallingPetalPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = length * 0.18;
  const midY2 = length * 0.6;
  return `M0,0 C${-w},${midY1} ${-w * 0.55},${midY2} 0,${length} C${w * 0.55},${midY2} ${w},${midY1} 0,0 Z`;
}

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
            y: { duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "linear" },
            x: { duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "linear" },
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

// ---- Glow behind the centerpiece ----
// Same two-layer radial-gradient technique (a wide faint outer halo behind
// a brighter, gently pulsing inner glow) and the same cream-gold color
// (rgba(253,240,216,...)) as ambient/GoldenSkySection.tsx's own Sun —
// reused rather than re-derived, just recentered on this section's smaller
// Lottie centerpiece instead of the whole section's top edge, and scaled
// down to match its ~96-112px footprint instead of a full-section "wow"
// moment.
function CenterpieceGlow() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[280px] sm:w-[280px]"
        style={{
          background: "radial-gradient(circle, rgba(253,240,216,0.35) 0%, rgba(253,240,216,0) 70%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:h-[170px] sm:w-[170px]"
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

// ---- Closing butterflies ----
// A quiet echo of the recurring butterfly motif, perched (not flying) near
// the centerpiece — gentle idle wing-flap/wobble only, same treatment as
// message/SealedLetter.tsx's docked FlightButterfly, not a flight path
// across the section. GOLD (echoes the Lottie sunflower's own warm tone)
// and DUSTY_ROSE (soft contrast against it) — per-tone usage is already
// perfectly even elsewhere in V1 (hero/SunsetHero.tsx + message/
// SealedLetter.tsx + gallery/SunlitPolaroids.tsx each use all four filters
// 3 times apiece), so there's no single "least-used" tone left to prefer;
// these two were picked for how they read together against the sunflower,
// not for frequency.
function ClosingButterfly({
  size,
  filter,
  style,
  delay,
}: {
  size: number;
  filter: string;
  style: React.CSSProperties;
  delay: number;
}) {
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
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ width: size, height: size, filter, ...style }}
      animate={{ rotate: [0, -6, 6, 0], y: [0, -3, 0] }}
      transition={{ duration: 3.4, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Lottie animationData={butterflyAnimation} loop autoplay lottieRef={lottieRef} />
    </motion.div>
  );
}

// ---- Signature flourish ----
// A simple hand-drawn-style swash underline beneath the couple's names —
// evokes a signature's decorative underline rather than a plain divider
// line. Single continuous bezier path (wave into a small curl at the end),
// stroked (not filled), rounded caps so it reads as a pen stroke. Stroked in
// AMPERSAND_ACCENT_COLOR (not the original #d97a5f) for the same contrast
// reason documented above withAccentedAmpersands — this line sits directly
// beneath the heading, on the same background, so it needs the same fix.
const FLOURISH_PATH =
  "M6,18 C28,4 44,32 68,17 C86,6 100,20 94,27 C89,33 79,27 85,19";

function SignatureFlourish() {
  return (
    <svg
      viewBox="0 0 104 36"
      className="h-6 w-28 sm:h-7 sm:w-32"
      aria-hidden="true"
    >
      <path
        d={FLOURISH_PATH}
        fill="none"
        stroke={AMPERSAND_ACCENT_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// V1's counterpart to V2's closing/Signature.tsx — same "formatted heading
// as a handwritten signature" structure, but the closing visual beat is the
// real sunflower.json Lottie (unfiltered, same treatment as
// ambient/GoldenSkySection.tsx's centerpiece — this is explicitly meant to
// echo that section as the template's final emotional beat) at a smaller
// scale, rather than a drawn-heart SVG. This section has no background of
// its own — this went through several earlier passes at its own distinct
// ending tone (a flat dark brown #6b4332, a hardcoded three-stop taper, a
// copy of hero/SunsetHero.tsx's gradient, a shared SIGNATURE_GRADIENT
// constant, then briefly every section painting the same flat gradient on
// itself independently) before landing back on the original, correct
// architecture: templates/AnniversaryV1.tsx paints V1_BACKGROUND_GRADIENT
// exactly once, across the whole page, and every section (including this
// one) is fully transparent — the only way to get zero hard seams at
// section boundaries, since restarting even an identical gradient inside
// each section independently still produces one at every boundary.
//
// This pass layers in the section's "wow"-beat atmosphere (glow, falling
// petals, a signature flourish, and a couple of quiet closing butterflies)
// on top of that existing structure — additive decoration only, no change
// to the quote/name text content or the centerpiece's own Lottie asset.
export default function SunsetSignature({
  people,
  groupTitle,
  closingLine,
}: SunsetSignatureProps) {
  const heading = formatPeopleHeading(people, groupTitle);
  const centerpieceLottieRef = useRef<LottieRefCurrentProps>(null);
  const { ref: centerpieceViewportRef, isInView: centerpieceInView } = useV1InViewport<HTMLDivElement>();

  useEffect(() => {
    if (centerpieceInView) {
      centerpieceLottieRef.current?.play();
    } else {
      centerpieceLottieRef.current?.pause();
    }
  }, [centerpieceInView]);

  return (
    <section className="relative overflow-hidden px-6 pb-[140px] pt-[120px] text-center">
      <PetalDrift />

      {/* Quote/couple-names/flourish/centerpiece now reveal together via
          the shared V1 scroll-reveal system (lib/v1ScrollReveal.ts) —
          staggerContainerVariant on this wrapper cascades down to each of
          those four's own variants prop in sequence. The glow
          (CenterpieceGlow) and the two ClosingButterfly Lotties sit inside
          this same wrapper's DOM subtree but are untouched and unaffected:
          each already animates via its own explicit `animate` prop (a
          plain object, not a `variants` reference), which is exactly what
          keeps a motion component independent of whatever variant state an
          ancestor propagates — only descendants that themselves use
          `variants` (with no own initial/animate) inherit it. */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainerVariant}
      >
        {/* text-[#4a2f26]/85 bumped to /95 in an earlier pass: at 85% opacity
            the effective blended color, against this section's background at
            the time (~#e2a077, a page-level gradient's darkest stop), computed
            to a WCAG contrast ratio of ~4.17:1 — just under the 4.5:1 normal-
            text AA floor at this text's mobile size (text-xl, too small to
            qualify for the relaxed 3:1 large-text threshold). Re-checked again
            against the current "Sand & Dusty Rose" gradient
            (lib/v1SectionGradients.ts): /95 blends to ~4.8:1 against the
            gradient's darkest stop (#c9a29b) — still clears AA, with less
            margin than before but no failure, so no further change needed. */}
        {closingLine && (
          <motion.p
            variants={fadeUpVariant}
            className="font-display relative mx-auto max-w-xl text-xl italic text-[#4a2f26]/95 sm:text-2xl"
          >
            {closingLine}
          </motion.p>
        )}

        <div className="relative mt-8 flex flex-col items-center">
          {/* Checked, unchanged: full-opacity #4a2f26 against the current
              "Sand & Dusty Rose" gradient computes to ~5.3:1 even at its
              darkest stop (#c9a29b) — already clears normal-text AA (4.5:1)
              with margin, no adjustment needed here. */}
          <motion.span
            variants={fadeUpVariant}
            className="font-display text-4xl italic text-[#4a2f26] sm:text-5xl"
          >
            {withAccentedAmpersands(heading)}
          </motion.span>
          <motion.span variants={fadeUpVariant} className="mt-2">
            <SignatureFlourish />
          </motion.span>
        </div>

        <div className="relative mx-auto mt-6 flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
          <CenterpieceGlow />

          <ClosingButterfly
            size={30}
            filter={BUTTERFLY_FILTER_GOLD}
            style={{ top: -12, left: -20 }}
            delay={0}
          />
          <ClosingButterfly
            size={26}
            filter={BUTTERFLY_FILTER_DUSTY_ROSE}
            style={{ bottom: -8, right: -18 }}
            delay={1.6}
          />

          <motion.div
            ref={centerpieceViewportRef}
            variants={scaleBlurVariant}
            className="relative z-10 h-full w-full"
          >
            <Lottie animationData={sunflowerAnimation} loop autoplay lottieRef={centerpieceLottieRef} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
