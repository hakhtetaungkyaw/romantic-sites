"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import { fadeUpVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import type { SiteData } from "@/types/site";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx and ambient/GoldenSkySection.tsx. Self-contained (own
// copy of the sunflower-dot petal-path construction, not an import from
// message/SealedLetter.tsx or countdown/SunflowerCountdown.tsx) so this file
// is never shared with AnniversaryV2.tsx — including with V2's OWN separate
// timeline/VerticalLine.tsx, which this section deliberately does not reuse
// any code from, per the V1/V2 file-separation rule.
//
// V1's counterpart to V2's timeline/VerticalLine.tsx: same underlying idea
// (a scroll-animated vertical line drawing itself past a list of dated
// milestones), but built from a different third-party base (Aceternity's
// Timeline component) rather than V2's own from-scratch implementation —
// the scroll-driven useScroll/useTransform progress-line mechanics below
// are ported structurally intact from that source, everything else
// (styling, data wiring, the demo header/content) is fully replaced.

// Adapted from Aceternity's Timeline component. Structural changes from the
// source:
//   - every `dark:` class removed (this project has no dark mode)
//   - the hardcoded "Changelog from my journey" header/paragraph and the
//     4-image Unsplash grid + emoji-checklist demo content are gone
//     entirely — see MilestoneCard below for what replaced them
//   - the plain white circle + neutral-dot marker is now SunflowerDot (a
//     small corrected sunflower petal-path silhouette)
//   - the purple-to-blue progress line and neutral-200 static track are now
//     a growing green vine (own construction, see VINE_COLOR/buildVinePath/
//     buildVineLeaves below) with small leaf details, reusing the same
//     useScroll/useTransform height-reveal mechanics — SunflowerDot's
//     blooms now read as flowers opening along that vine as it grows,
//     rather than markers on a plain colored bar. An earlier version of
//     this line used a terracotta-to-rose-gold gradient, which at full
//     saturation (#d97a5f, V1's vivid primary accent, not the muted
//     ~28-33%-saturation tones lib/v1ButterflyFilters.ts's terracotta/coral
//     filters are actually tuned to) read as vivid red rather than muted —
//     moot now that the line itself is a vine, not a gradient bar
//   - wired to the site's real `milestones` data (see SunsetTimelineProps)
//     instead of Aceternity's own hardcoded TimelineEntry array
// The useScroll/useTransform height+opacity animation itself — the actual
// interaction this component exists for — is unchanged in structure.

type Milestone = NonNullable<SiteData["milestones"]>[number];

interface SunsetTimelineProps {
  milestones?: Milestone[];
}

// Small sunflower bloom marker at each timeline point — same corrected
// rounded-petal construction (wide overlapping-base petals, rounded tip, 10
// petals) established in message/SealedLetter.tsx's SunflowerBloom and
// reused throughout V1 (gallery/SunlitPolaroids.tsx's lightbox stamp,
// countdown/SunflowerCountdown.tsx's DigitBloom); reimplemented locally
// here per V1's per-file self-containment convention, same
// SUNFLOWER_PETAL_COLOR / SUNFLOWER_CENTER_COLOR tokens as those.
function dotPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

const DOT_PETAL_COUNT = 10;
const DOT_PETAL_ANGLES = Array.from({ length: DOT_PETAL_COUNT }, (_, i) => (360 / DOT_PETAL_COUNT) * i);
// 34px, ~1.5x the previous 22px. Backing plate grew from 40px (h-10 w-10)
// to 48px (h-12 w-12) — a smaller jump than the sunflower's own, so the
// sunflower now fills ~71% of the plate instead of ~55%, reading as the
// dominant shape rather than shrinking inside a mostly-empty circle.
// `left-2` (not the previous `left-3`) re-centers the wider plate on the
// vine below (VINE_CENTER_X), which is itself centered at the same 32px:
// 8px + 48px/2 = 32px, matching the original 12px + 40px/2 = 32px math.
const DOT_SIZE = 34;

function SunflowerDot() {
  const center = DOT_SIZE / 2;
  const centerRadius = DOT_SIZE * 0.24;
  const petalLength = DOT_SIZE * 0.36;
  const petalWidth = DOT_SIZE * 0.44;

  return (
    // The white/cream circular "backing plate" from the source is kept
    // (now cream, not white) — it's what makes the sunflower read clearly
    // against the vine passing directly behind it, not just leftover
    // Aceternity chrome. Each bloom now reads as a flower opening along
    // the vine, since both use the same corrected petal-path construction.
    <div className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf6ec] shadow-sm shadow-[#6b4332]/15">
      <svg viewBox={`0 0 ${DOT_SIZE} ${DOT_SIZE}`} width={DOT_SIZE} height={DOT_SIZE} aria-hidden="true">
        <g fill={SUNFLOWER_PETAL_COLOR}>
          {DOT_PETAL_ANGLES.map((angle) => (
            <path
              key={angle}
              d={dotPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
              transform={`rotate(${angle} ${center} ${center})`}
            />
          ))}
        </g>
        <circle cx={center} cy={center} r={centerRadius} fill={SUNFLOWER_CENTER_COLOR} />
      </svg>
    </div>
  );
}

// Muted olive/brown-green — same literal value as
// countdown/SunflowerCountdown.tsx's own VineConnector uses for its
// horizontal vine (reused as a value for visual consistency, not imported,
// per V1's per-file self-containment convention: this file keeps its own
// copy rather than sharing component code across sections). V1's palette
// has no other established green, so this sits near the warm dark-brown
// text/stem tones (#4a2f26, #6b4332) rather than a bright saturated green.
const VINE_COLOR = "#7d8c5a";

// Small pointed-oval leaf — same construction as
// countdown/SunflowerCountdown.tsx's own vineLeafPath, reimplemented
// locally. `length`/`width` are the leaf's own size before the caller's
// translate+rotate places it along the vine.
function vineLeafPath(length: number, width: number): string {
  const w = width / 2;
  return `M0,0 Q${w},${-length * 0.5} 0,${-length} Q${-w},${-length * 0.5} 0,0 Z`;
}

const VINE_CENTER_X = 32;
// Widened from 64 to 88 (VINE_CENTER_X stays at 32 — unchanged, still
// aligned with SunflowerDot's own center, see that component's comment) to
// give the larger VINE_LEAF_* leaves below room to extend without clipping
// against the SVG's own edges.
const VINE_SVG_WIDTH = 88;
const VINE_SEGMENT_HEIGHT = 90;
const VINE_AMPLITUDE = 9;
// Reduced from 90 to 55 (denser than one leaf per wave segment) so leaves
// read as a recurring rhythm along the vine's length rather than one
// isolated mark per sway.
const VINE_LEAF_SPACING = 55;

// Builds a smooth vertical S-curve wave from y=0 to y=totalHeight, swaying
// left/right by VINE_AMPLITUDE every VINE_SEGMENT_HEIGHT px, always ending
// exactly at (VINE_CENTER_X, totalHeight) — same wave technique as
// SunflowerCountdown.tsx's own fixed VINE_PATH string, just generated
// procedurally instead of hand-written, since this vine's total length
// depends on the (unknown ahead of time) number of milestones rather than
// countdown/SunflowerCountdown.tsx's own fixed 4-card row width.
function buildVinePath(totalHeight: number): string {
  if (totalHeight <= 0) return "";
  const segments = Math.max(1, Math.ceil(totalHeight / VINE_SEGMENT_HEIGHT));
  let d = `M${VINE_CENTER_X},0`;
  for (let i = 0; i < segments; i++) {
    const y0 = i * VINE_SEGMENT_HEIGHT;
    const y1 = Math.min((i + 1) * VINE_SEGMENT_HEIGHT, totalHeight);
    const segLength = y1 - y0;
    const sway = i % 2 === 0 ? VINE_AMPLITUDE : -VINE_AMPLITUDE;
    const cx = VINE_CENTER_X + sway;
    const cy1 = y0 + segLength * 0.3;
    const cy2 = y0 + segLength * 0.7;
    d += ` C${cx},${cy1} ${cx},${cy2} ${VINE_CENTER_X},${y1}`;
  }
  return d;
}

interface VineLeaf {
  x: number;
  y: number;
  angle: number;
}

// One leaf roughly every VINE_LEAF_SPACING px, alternating sides — same
// "alternating sway" spirit as SunflowerCountdown.tsx's own hand-placed
// VINE_LEAVES array, just generated to match this vine's dynamic length.
// Anchor offset bumped from 11 to 14 to match the larger leaf size passed
// to vineLeafPath() below (10,6 -> 19,11) — keeps the bigger leaf
// silhouette budding visibly off the stem rather than overlapping into it.
function buildVineLeaves(totalHeight: number): VineLeaf[] {
  const leaves: VineLeaf[] = [];
  for (let y = VINE_LEAF_SPACING * 0.6; y < totalHeight; y += VINE_LEAF_SPACING) {
    const side = leaves.length % 2 === 0 ? 1 : -1;
    leaves.push({ x: VINE_CENTER_X + side * 14, y, angle: side * 65 });
  }
  return leaves;
}

// Small decorative underline beneath each entry's date — quieter, simpler
// cousin of closing/SunsetSignature.tsx's SignatureFlourish (a short single
// wave instead of that one's wave-into-a-curl), same rose-gold accent tone,
// so it reads as part of the same hand-drawn-flourish language without
// being a literal copy of a "closing signature" gesture on every single
// timeline entry. Sized up from an earlier pass (56px wide, 1.5px stroke)
// that read as too small/faint to register as intentional — 80px wide with
// a 2.5px stroke is clearly visible as a deliberate flourish rather than a
// stray line.
function DateFlourish() {
  return (
    <svg viewBox="0 0 90 14" className="mt-2 h-3.5 w-20" aria-hidden="true">
      <path
        d="M3,7 C21,1.4 30,12.6 45,7 C60,1.4 69,12.6 87,7"
        fill="none"
        stroke="#c9a68a"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Replaces the source's Unsplash 4-image grid + "✅ emoji checklist" demo
// content — a warm cream card holding the milestone's own title/
// description/photo, in the same paper/card language as
// message/SealedLetter.tsx's letter card and gallery/SunlitPolaroids.tsx's
// caption treatment, but with more of its own presence than a flat box:
// a subtle warm gradient fill (not flat cream), a more pronounced warm-
// toned shadow, and a terracotta left-edge accent strip so each entry
// reads as a considered artifact rather than a generic content box.
// `photo` is a real field on `SiteData["milestones"]` (types/site.ts,
// prisma/schema.prisma's `Order.milestones Json?` doc comment) — optional,
// so entries without one render text-only, no broken-image icon or empty
// placeholder box.
function MilestoneCard({
  title,
  description,
  photo,
}: {
  title: string;
  description?: string;
  photo?: string;
}) {
  return (
    <div className="rounded-xl border border-[#c9a68a]/30 border-l-4 border-l-[#d97a5f] bg-gradient-to-br from-[#fdf6ec] to-[#f3e2c9] p-5 shadow-lg shadow-[#6b4332]/15 sm:p-6">
      {photo && (
        // A cream "mat" wrapper around the photo (padding + its own warm-
        // tinted glow/shadow), echoing a polaroid's paper border, rather
        // than the photo sitting flush in a plain rectangular inset —
        // still without gallery/SunlitPolaroids.tsx's tilt/washi-tape
        // treatment, which reads as too busy for this compact a card.
        // Fixed h-[220px] (not the previous aspect-[4/3]) + object-cover:
        // at this card's actual rendered width (roughly 400-700px), a 4:3
        // box computed out to 300-525px tall, making photo entries visibly
        // dominate the timeline's vertical rhythm next to text-only ones.
        // A fixed height keeps every photo the same modest size regardless
        // of card width, rather than scaling taller on wider cards; there's
        // no per-image dimensions lookup for arbitrary milestone photo
        // uploads (unlike gallery/SunlitPolaroids.tsx's own photos), so
        // object-cover crops to fill this box instead of preserving a
        // per-photo aspect ratio.
        <div className="mb-4 rounded-lg bg-[#fdf6ec] p-1.5 shadow-md shadow-[#d97a5f]/25">
          <div className="relative h-[220px] w-full overflow-hidden rounded-md border border-[#c9a68a]/40 bg-[#e8c4b0]">
            <Image
              src={photo}
              alt={title}
              fill
              sizes="(max-width: 768px) 90vw, 500px"
              className="object-cover"
            />
          </div>
        </div>
      )}
      <h3 className="font-display text-lg text-[#4a2f26] sm:text-xl">{title}</h3>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-[#4a2f26]/75">{description}</p>
      )}
    </div>
  );
}

// V1 "Section 4.5" — sits between gallery/SunlitPolaroids.tsx and
// countdown/SunflowerCountdown.tsx in templates/AnniversaryV1.tsx. Fully
// transparent background of its own (no bg-white/bg-neutral-950 like the
// source) — see the comment above templates/AnniversaryV1.tsx's <main>,
// which paints V1_BACKGROUND_GRADIENT exactly once across the whole page.
export default function SunsetTimeline({ milestones }: SunsetTimelineProps) {
  // Ports the source's two refs 1:1: `contentRef` measures the rendered
  // height of the entries list (so the vertical line/its animated fill know
  // how tall to be), `containerRef` is the useScroll target for the whole
  // section. Both stay attached to real, always-rendered DOM nodes
  // regardless of whether there are any milestones — useScroll(target)
  // throws "Target ref is defined but not hydrated" if the ref'd element
  // never mounts, so (same pattern as V2's timeline/VerticalLine.tsx) the
  // "no milestones" case collapses the section to zero visual footprint
  // rather than ever unmounting these.
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  const entries = milestones ?? [];
  const hasMilestones = entries.length > 0;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.getBoundingClientRect().height);
    }
  }, [entries.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Recomputed only when `height` itself changes (once on mount/resize, not
  // per scroll frame — heightTransform/opacityTransform above are the
  // per-frame-driven values, both plain framer-motion MotionValues that
  // update without triggering a React re-render), so this is cheap enough
  // to skip memoizing.
  const vinePath = buildVinePath(height);
  const vineLeaves = buildVineLeaves(height);

  return (
    <section
      ref={containerRef}
      className={hasMilestones ? "relative w-full px-6 md:px-10" : "relative h-0 w-0 overflow-hidden"}
    >
      {hasMilestones && (
        <>
          {/* pt-16, no pb: the previous py-16 added a full 64px below the
              heading ON TOP OF the first entry's own pt-10/md:pt-24, making
              the heading-to-first-entry gap far larger than the gap between
              any two entries. Dropping the bottom padding here lets that
              per-entry top padding be the sole spacer, so the heading feels
              connected to the timeline instead of floating above extra
              empty space. */}
          <div className="mx-auto max-w-7xl pt-16 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-display text-xs uppercase tracking-[0.35em] text-[#4a2f26]/60 sm:text-sm"
            >
              Our Timeline
            </motion.p>
          </div>

          <div ref={contentRef} className="relative mx-auto max-w-4xl pb-20">
            {entries.map((milestone, index) => (
              <div
                key={milestone.date + milestone.title + index}
                className="flex justify-start pt-10 md:gap-10 md:pt-24"
              >
                <div className="sticky top-40 z-40 flex max-w-xs items-center self-start md:w-full md:max-w-sm">
                  <SunflowerDot />
                  <div className="hidden md:block md:pl-20">
                    <p className="font-display text-2xl text-[#4a2f26] md:text-3xl">
                      {milestone.date}
                    </p>
                    <DateFlourish />
                  </div>
                </div>

                <div className="relative w-full pl-20 pr-4 md:pl-4">
                  <div className="mb-3 md:hidden">
                    <p className="font-display text-base text-[#4a2f26]">{milestone.date}</p>
                    <DateFlourish />
                  </div>
                  {/* Each card gets its OWN independent whileInView trigger
                      (initial="hidden" whileInView="visible" here, not a
                      shared staggerContainerVariant ancestor) — entries are
                      spread down a long scrolling section and need to
                      reveal as EACH one individually crosses into view,
                      not all at once whenever some single shared container
                      first becomes visible. Fully independent of the
                      useScroll/useTransform vine-line animation above
                      (that reads scrollYProgress off `containerRef`, the
                      whole section, and drives heightTransform/
                      opacityTransform directly via style — no shared refs,
                      state, or MotionValues with this card-level
                      whileInView, so neither can double-trigger or
                      interfere with the other). */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                    variants={fadeUpVariant}
                  >
                    <MilestoneCard
                      title={milestone.title}
                      description={milestone.description}
                      photo={milestone.photo}
                    />
                  </motion.div>
                </div>
              </div>
            ))}

            {/* Faint full-length guide: the vine's whole eventual path,
                always visible at low opacity (same top/bottom fade-mask
                the old static track used), so the timeline's total shape
                reads immediately rather than only appearing as the user
                scrolls. VINE_SVG_WIDTH/VINE_CENTER_X are sized so this
                SVG's own coordinate space maps 1:1 to real screen pixels
                (no preserveAspectRatio stretching needed, unlike
                countdown/SunflowerCountdown.tsx's horizontal VineConnector,
                since that one's fixed-width path had to stretch to the
                row's actual pixel width — this one's path is generated
                directly at the real height instead), landing centered on
                SunflowerDot's own 32px center (see that component's
                comment). */}
            <svg
              aria-hidden="true"
              width={VINE_SVG_WIDTH}
              height={height}
              viewBox={`0 0 ${VINE_SVG_WIDTH} ${height}`}
              className="pointer-events-none absolute left-0 top-0 opacity-35"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
              }}
            >
              <path d={vinePath} fill="none" stroke={VINE_COLOR} strokeWidth={2.5} strokeLinecap="round" />
            </svg>

            {/* The "grown" vine: same path + leaves as the guide above, but
                clipped inside a container whose height animates via
                heightTransform (0 -> full height as scrollYProgress goes
                0 -> 1) and fades in via opacityTransform over the first
                10% of scroll — the exact same two MotionValues the old
                plain-color progress bar used, just now driving how much of
                this taller, fully-detailed vine SVG is revealed instead of
                a flat div's height. Because the inner SVG is always
                rendered at the FULL height and only the outer container's
                height/overflow-hidden changes, the vine appears to grow
                downward in place rather than stretching/distorting as it
                reveals. */}
            <motion.div
              style={{ height: heightTransform, opacity: opacityTransform }}
              className="pointer-events-none absolute left-0 top-0 overflow-hidden"
            >
              <svg
                aria-hidden="true"
                width={VINE_SVG_WIDTH}
                height={height}
                viewBox={`0 0 ${VINE_SVG_WIDTH} ${height}`}
              >
                <path d={vinePath} fill="none" stroke={VINE_COLOR} strokeWidth={3.2} strokeLinecap="round" />
                {vineLeaves.map((leaf) => (
                  <path
                    key={leaf.y}
                    d={vineLeafPath(19, 11)}
                    fill={VINE_COLOR}
                    transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}
                  />
                ))}
              </svg>
            </motion.div>
          </div>
        </>
      )}
    </section>
  );
}
