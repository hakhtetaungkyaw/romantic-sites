"use client";

import { motion } from "framer-motion";
import Lottie from "lottie-react";

import { formatPeopleHeading } from "@/lib/people";
import { fadeUpVariant, scaleBlurVariant, staggerContainerVariant, viewportRepeat } from "@/lib/v2ScrollReveal";
import type { SitePerson } from "@/types/site";

import catHeartAnimation from "@/public/animations/cat-heart.json";

interface ClosingSignatureProps {
  people: SitePerson[];
  groupTitle?: string;
  closingLine?: string;
}

// ---- cat-heart.json color filter — muted from its native bright orange/
// pink into V2's dark burgundy/gold palette. Same rigorous methodology as
// lib/v1ButterflyFilters.ts (that file's own derivation notes are the
// reference here, not its code — this is V2-only, nothing imported from a
// V1 file): rendered the actual asset via lottie-react's canvas renderer in
// an isolated Playwright-driven page, read real pixels via
// canvas.getContext('2d').getImageData() across a sweep of frames (0-179),
// bucketed by rounded RGB to find the dominant clusters — not read off the
// raw JSON's declared shape-fill values, since those don't account for how
// gradients/blending actually resolve on screen.
//
// MEASURED NATIVE COLORS (before any filter):
//   - Cat body (dominant cluster by a wide margin, ~77k of the sampled
//     opaque/saturated pixels at the single largest bucket): rgb(246,126,42)
//     = hsl(25°, 92%, 56%) — a vivid orange, consistent across every
//     lighter/darker shading variant sampled (all clustered 21-25° hue).
//   - Hearts: highlight rgb(240,90,150) = hsl(336°, 83%, 65%); shadow
//     rgb(54,12,30) = hsl(334°, 64%, 13%) — a bright pink family spanning
//     hue 334-353° across its own internal highlight/shadow shading.
//
// TARGETS: gold #d4af7a (this project's own most-used V2 gold token, e.g.
// gallery/Magazine.tsx's CornerOrnament, interactive/UnlockGate.tsx's
// constellation lines) = hsl(35°, 51%, 65%); deep rose/burgundy #8b1e3f
// (interactive/LoveNote.tsx's own wax-seal base tone, already established
// in this exact palette family) = hsl(342°, 64%, 33%).
//
// ITERATION: two rounds, both against a single representative frame (frame
// 150, inside the nested "love" sub-composition's own ip:120/op:180
// window, where both the cat body and the heart accents are visible
// together), applying each candidate via an offscreen canvas's own
// `ctx.filter` + drawImage (the same CSS filter syntax a real
// `style={{filter}}` would apply) and re-sampling the result the same way.
//   - Round 1 swept hue-rotate 6-12deg x saturate 0.45-0.65 x brightness
//     0.85-1.05. Best candidate landed the body almost exactly on the gold
//     target (hsl(33°,54%,56%) vs. target 35°/51%/65°) but left the hearts
//     a pale, still fairly bright pink (hsl(341°,48%,61%) vs. target
//     342°/64%/33%) — confirmed visually via a real DOM `style={{filter}}`
//     screenshot (not just the canvas simulation), which showed the hearts
//     reading closer to bubblegum pink than rose/burgundy.
//   - Round 2 pushed harder specifically to darken/saturate the hearts —
//     lower brightness, higher contrast — and re-verified with another
//     screenshot. Final measured output (both regions, same filter):
//       Body: rgb(162,108,48) = hsl(32°, 54%, 41%) — hue 3° off target,
//         saturation 3% off target; darker than the flat #d4af7a swatch
//         (41% vs. 65% lightness) but reads as a richer antique gold
//         against this section's own dark background, not washed out.
//       Heart highlight: rgb(162,78,102) = hsl(343°, 35%, 47%) — hue 1° off
//         target, lightness now 14% off target(down from 28% off in round
//         1).
//       Heart shadow: rgb(54,6,18) = hsl(345°, 80%, 12%) — hue 3° off
//         target, saturation actually exceeds the target (80% vs. 64%),
//         lightness 21% off (12% vs. 33%) but in the darker direction,
//         genuinely reading as a deep, saturated burgundy in the shape's
//         own shadow areas rather than a muted pink.
const CAT_HEART_FILTER = "hue-rotate(8deg) saturate(0.6) brightness(0.8) contrast(1.15)";

function withAccentedAmpersands(text: string) {
  return text
    .split(/(&)/)
    .map((part, i) =>
      part === "&" ? (
        <span key={i} className="text-[#d4af7a]">
          &amp;
        </span>
      ) : (
        part
      ),
    );
}

export default function ClosingSignature({
  people,
  groupTitle,
  closingLine,
}: ClosingSignatureProps) {
  const heading = formatPeopleHeading(people, groupTitle);

  return (
    <section className="relative bg-gradient-to-b from-transparent to-[#0d0509] px-6 pb-[140px] pt-[120px] text-center">
      {/* Quote + couple names share one staggerContainerVariant group, both
          as fadeUpVariant children — unchanged from before this pass. */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportRepeat}
        variants={staggerContainerVariant}
      >
        {closingLine && (
          <motion.p
            variants={fadeUpVariant}
            className="font-display mx-auto max-w-xl text-xl italic text-[#faf5f0]/80 sm:text-2xl"
          >
            {closingLine}
          </motion.p>
        )}

        <motion.div
          variants={fadeUpVariant}
          className="font-display mt-8 text-4xl italic text-[#faf5f0] sm:text-5xl"
        >
          {withAccentedAmpersands(heading)}
        </motion.div>
      </motion.div>

      {/* Centerpiece — was a bespoke pathLength-drawn heart outline
          (HEART_PATH, a single SVG path with no discrete points/segments of
          its own); replaced this pass with the public/animations/
          cat-heart.json Lottie (a genuine Lottie asset, v5.9.6, 500x500,
          180 frames @ 30fps — confirmed by inspecting its JSON directly,
          not assumed from the filename), sized as this section's clear
          focal point rather than the previous 42x38px icon scale.
          scaleBlurVariant is lib/v2ScrollReveal.ts's own documented variant
          for "photos and centerpiece visual elements" — the natural fit
          here, giving the centerpiece a scroll-triggered reveal in place of
          the old heart's own bespoke draw-in/retract system. loop+autoplay
          since this is a continuous ambient centerpiece moment, the same
          role the old heart played. */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportRepeat}
        variants={scaleBlurVariant}
        className="mx-auto mt-8 h-40 w-40 sm:h-48 sm:w-48"
        style={{ filter: CAT_HEART_FILTER }}
      >
        <Lottie animationData={catHeartAnimation} loop autoplay className="h-full w-full" />
      </motion.div>
    </section>
  );
}
