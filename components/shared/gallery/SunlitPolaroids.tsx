"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { BUTTERFLY_FILTER_GOLD } from "@/lib/v1ButterflyFilters";
import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import { scaleBlurVariant, staggerContainerVariant, viewportOnce } from "@/lib/v1ScrollReveal";
import type { SitePhoto } from "@/types/site";

import butterflyAnimation from "@/public/animations/butterfly.json";

// V1 "Golden Hour / Sunset" design system — same palette established in
// hero/SunsetHero.tsx and ambient/GoldenSkySection.tsx. Self-contained (own
// copy of the photo-dimensions lookup, not an import from gallery/Magazine.tsx)
// so this file is never shared with AnniversaryV2.tsx.

interface SunlitPolaroidsProps {
  photos: SitePhoto[];
}

// BUG FIX: this used to look up each photo's aspect ratio from a hardcoded
// map of 16 demo filenames (couple-01.jpg...couple-16.jpg), falling back to
// a 1x1 default for anything else — meaning every real customer photo (a
// unique hosted URL, never literally named "couple-01.jpg") silently hit
// that fallback and got force-cropped to a square regardless of its real
// shape. Rather than trying to recover real dimensions (which would need
// either a new stored width/height per photo, or a client-side probe),
// every card now shares ONE fixed square frame — same size for every photo,
// no featured/standard distinction — with the photo cropped to fill it via
// object-cover. Square (not e.g. 4:5) matches this component's own
// "polaroid" metaphor: real Polaroid instant-film prints are themselves
// close to square, so a uniform square frame reads as authentically
// polaroid-like regardless of the source photo's own orientation, rather
// than an arbitrary editorial-crop ratio.
const CARD_SIZE_PX = 220;

// Hand-placed, fixed values (not Math.random()) — same hydration-safety
// reasoning as FLOWERS/CLOUDS elsewhere in V1: this needs to look like a
// loosely-tossed scrapbook, not be perfectly aligned, but must render
// identically server/client. Cycled by index, not random, across however
// many photos exist.
const ROTATIONS = [-4, 3, -5, 6, -2, 5, -6, 2];
const TAPE_SIDES: ("left" | "right")[] = ["left", "right", "left", "right"];
const TAPE_COLORS = ["#d4919a", "#c9a68a", "#d97a5f", "#c9a68a"];

// A small rotated translucent strip standing in for a piece of washi tape —
// the scrapbook detail that reads as "someone actually stuck this photo
// down," distinguishing this from a plain bordered card.
function WashiTape({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute -top-3 h-6 w-14 ${side === "left" ? "-left-3 -rotate-[20deg]" : "-right-3 rotate-[20deg]"}`}
      style={{ backgroundColor: color, opacity: 0.55 }}
    />
  );
}

function noopSubscribe() {
  return () => {};
}

// Bootstrap Icons' "x-lg" glyph, inlined as raw path data rather than
// pulling in the bootstrap-icons package for a single icon — same pattern
// as message/SealedLetter.tsx's own CloseIcon.
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Bootstrap Icons' "chevron-left" / "chevron-right" glyphs, inlined the same
// way as CloseIcon above.
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" width={22} height={22} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" width={22} height={22} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"
      />
    </svg>
  );
}

// Small corner "stamp" motif for the lightbox frame — own local copy of the
// corrected rounded-bloom petal shape (wide overlapping base, rounded tip,
// 10 petals) from message/SealedLetter.tsx's SunflowerBloom; see that file
// for why the shape has to be built this way (a narrower/sharper petal reads
// as a spiky sunburst, not a flower, at small sizes). Reimplemented rather
// than imported per V1's per-file self-containment convention.
function stampPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

const STAMP_PETAL_COUNT = 10;
const STAMP_PETAL_ANGLES = Array.from({ length: STAMP_PETAL_COUNT }, (_, i) => (360 / STAMP_PETAL_COUNT) * i);

// A quiet, small signature detail perched on the frame's top-left corner —
// not a focal element, but rendered at full opacity with no blur, since a
// blurred/washed-out treatment is exactly what made the earlier pass read as
// an indistinct blob rather than a recognizable flower at small size. The
// petal shape/ratios above are already an exact copy of SealedLetter.tsx's
// SunflowerBloom (10 overlapping-base petals, not a simplified silhouette);
// the fix here is rendered size and crispness, not the geometry — this is
// sized to match message/SealedLetter.tsx's own STICKER_SIZE (34 * its 1.5
// ENVELOPE_SCALE = 51), the smallest size that shape was actually verified
// to read as a flower rather than a sunburst, not the ad-hoc smaller size
// used here previously.
function SunflowerStamp({ size }: { size: number }) {
  const center = size / 2;
  const centerRadius = size * 0.24;
  const petalLength = size * 0.36;
  const petalWidth = size * 0.44;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="pointer-events-none absolute -left-2 -top-2"
      aria-hidden="true"
    >
      <g fill={SUNFLOWER_PETAL_COLOR}>
        {STAMP_PETAL_ANGLES.map((angle) => (
          <path
            key={angle}
            d={stampPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
            transform={`rotate(${angle} ${center} ${center})`}
          />
        ))}
      </g>
      <circle cx={center} cy={center} r={centerRadius} fill={SUNFLOWER_CENTER_COLOR} />
    </svg>
  );
}

// Corner accent mirroring SunflowerStamp on the opposite corner — same
// scale and a matched, deliberately non-drifting treatment (loop/autoplay
// both off, so it holds a single resting frame) since this is a quiet
// "perched" detail, not a flight animation. BUTTERFLY_FILTER_GOLD: the tone
// least used elsewhere in V1 — hero/SunsetHero.tsx's flight paths and
// message/SealedLetter.tsx's ambient trio each lean more on coral/dusty-
// rose/terracotta, so gold keeps this pair visually distinct from those.
function LightboxButterfly({ size }: { size: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-4 -right-3"
      style={{ width: size, height: size, filter: BUTTERFLY_FILTER_GOLD }}
    >
      <Lottie animationData={butterflyAnimation} loop={false} autoplay={false} />
    </div>
  );
}

interface LightboxPhoto {
  src: string;
  caption?: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Click-to-enlarge overlay for the grid below — same portal + hydration-safe
// pattern already implemented in message/SealedLetter.tsx's modal, reused
// rather than re-derived: `isMounted` gates the createPortal call to
// client-only render passes (document.body doesn't exist during SSR), via
// the same useSyncExternalStore trick (empty/false snapshot on server and
// first client paint, so there's nothing for hydration to mismatch on). The
// whole AnimatePresence block is portaled as a unit, not createPortal nested
// inside its children, for the same reason documented in SealedLetter.tsx:
// createPortal's return value isn't a valid React element, so AnimatePresence
// can't clone it as a child if it lives inside instead of around it.
function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const photo = photos[index];

  const goPrev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const goNext = () => onNavigate((index + 1) % photos.length);

  // Locks both <html> and <body> — app/layout.tsx puts `h-full` on <html>
  // and `min-h-full flex flex-col` on <body>, and locking body's overflow
  // alone left the page's own scrollbar/scroll still active while this
  // modal was open (message/SealedLetter.tsx's simpler layout only needed
  // body). Split into its own effect with an empty dependency array so it
  // locks exactly once when the lightbox mounts and unlocks exactly once
  // when it unmounts — not re-toggled by every photo navigation, which the
  // previous single-effect/`[index]`-dependency version did.
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!isMounted || !photo) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="sunlit-lightbox"
        className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4 sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="absolute inset-0 bg-[#2b160f]/55 backdrop-blur-sm"
          onClick={onClose}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#fdf6ec] to-[#e8c4b0] text-[#d97a5f] shadow-lg shadow-black/30 ring-1 ring-[#c9a68a]/40 transition-all duration-200 hover:scale-110 hover:text-[#c1573a] hover:shadow-[0_0_18px_rgba(217,122,95,0.45)]"
        >
          <CloseIcon />
        </button>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#fdf6ec] to-[#e8c4b0] text-[#d97a5f] shadow-lg shadow-black/30 ring-1 ring-[#c9a68a]/40 transition-all duration-200 hover:scale-110 hover:text-[#c1573a] hover:shadow-[0_0_18px_rgba(217,122,95,0.45)] sm:left-6"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#fdf6ec] to-[#e8c4b0] text-[#d97a5f] shadow-lg shadow-black/30 ring-1 ring-[#c9a68a]/40 transition-all duration-200 hover:scale-110 hover:text-[#c1573a] hover:shadow-[0_0_18px_rgba(217,122,95,0.45)] sm:right-6"
          >
            <ChevronRightIcon />
          </button>
        )}

        <motion.div
          key={photo.src}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-0 flex w-fit max-h-[90vh] max-w-[92vw] flex-col items-center overflow-hidden p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Polaroid-style frame — same cream card + thicker-bottom border
              language as the grid's cards below, just scaled up and held
              straight (no rotation) since this is the focal enlarged view.
              The image is sized via real width/height (not `fill` inside a
              fixed-aspect box), so the card shrink-wraps to the photo's
              actual rendered dimensions — a portrait photo no longer sits
              pillarboxed inside a landscape-shaped container. The caption
              lives in this same card, in the frame's thicker bottom margin,
              like handwriting under a real polaroid, instead of a second
              floating card.

              This wrapper's own sizing is content-driven (no fixed
              width/height — the flex column just wraps its one child), so
              there's nothing here for the child to overflow. `max-h-[90vh]`
              + `overflow-hidden` (not `-auto`) is a safety net only: normal
              content (image capped at ~62vh/82vw below, a short caption,
              fixed padding) never approaches that limit, so it should never
              visibly clip anything; `overflow-hidden` just guarantees that
              *if* a future change ever did push content past it, the result
              is silent clipping, not a scrollbar. The `p-5` (20px) breathing
              room is sized past the corner accents' largest negative offset
              (LightboxButterfly's -bottom-4/-right-3, i.e. 16px/12px) with a
              few px to spare, so this safety-net clip boundary sits outside
              them and never cuts into their intentional "perched past the
              corner" look. */}
          <div className="relative flex w-fit max-w-full flex-col items-center rounded-md border border-[#e8c4b0] bg-[#fdf6ec] p-3 pb-5 shadow-2xl shadow-black/40 sm:p-4 sm:pb-6">
            <SunflowerStamp size={46} />
            <LightboxButterfly size={46} />

            {/* Plain <img>, not next/image — this needs to show the photo
                at its own real, natural aspect ratio (no pillarboxing), and
                with the getDimensions() lookup removed (see the BUG FIX
                comment above CARD_SIZE_PX) there's no width/height left to
                give next/image's own `<Image>`, which requires one of
                `fill` or explicit width+height. A real `<img>` needs
                neither — the browser sizes it from the file itself — so
                CSS alone (h-auto/w-auto plus the same max-h/max-w caps
                already here) reproduces the exact same "shrink-wrap to the
                photo's real shape, capped at ~58-62vh/82vw" behavior with
                no dimension data required. Same eslint-disable convention
                already used for admin thumbnails
                (app/admin/orders/[slug]/page.tsx). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.caption ?? "Enlarged memory"}
              className="block h-auto max-h-[58vh] w-auto max-w-[82vw] rounded-sm object-contain sm:max-h-[62vh]"
            />

            {photo.caption && (
              <p className="font-display mt-3 max-w-[240px] text-center text-sm italic leading-snug text-[#4a2f26] sm:max-w-xs sm:text-base">
                {photo.caption}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// V1's counterpart to V2's gallery/Magazine.tsx (Museum Wall) — same "one
// real memory per frame" intent, but a scrapbook/polaroid metaphor instead
// of a formal gallery wall: tilted photos, tape corners, handwritten-style
// captions, warm cream backdrop. Grid rather than Magazine's single feature
// column, since a scattered scrapbook reads better spread across the width
// than stacked one-per-row.
export default function SunlitPolaroids({ photos }: SunlitPolaroidsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-[120px]">
      {/* Cards now reveal via the shared V1 scroll-reveal system
          (lib/v1ScrollReveal.ts) instead of each hand-rolling its own
          initial/whileInView/transition with a modulo-capped delay —
          staggerContainerVariant on this grid cascades scaleBlurVariant
          down to each card in sequence. scaleBlurVariant's `visible` state
          accepts an optional per-instance `custom` rotate (see that file),
          which is exactly what lets each card keep its own final resting
          tilt (`custom={rotate}` below) while still pulling the shared,
          centrally-defined opacity/scale/blur/timing rather than
          redefining them locally. One deliberate, disclosed simplification
          versus the previous version: cards now animate in from an upright
          (0deg), faded/undersized/soft starting point straight to their
          resting tilt, rather than first overshooting past it
          (rotate * 2.5) and settling back — that overshoot doesn't have an
          equivalent in a shared, reusable variant without a second custom
          value, and wasn't worth the added complexity for a flourish this
          subtle.

          Column count (2 mobile / 3 sm+) is unchanged; every card is now
          the same fixed square size (see the BUG FIX comment on
          CARD_SIZE_PX above), so there's no featured/standard split left to
          interlock — sm:grid-flow-dense accordingly dropped along with it,
          since a uniform grid has no gaps for dense packing to backfill. */}
      <motion.div
        className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-16"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainerVariant}
      >
        {photos.map((photo, index) => {
          const { src, caption } = photo;
          const rotate = ROTATIONS[index % ROTATIONS.length];
          const tapeSide = TAPE_SIDES[index % TAPE_SIDES.length];
          const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];

          return (
            <motion.div
              key={src + index}
              custom={rotate}
              variants={scaleBlurVariant}
              whileHover={{ rotate: 0, scale: 1.03 }}
              className="relative flex flex-col items-center"
            >
              {/* BUG FIX: this <button> had no explicit width. Its parent
                  is `flex flex-col items-center`, and under `items-center`
                  (not the flex default `stretch`) a flex item with no
                  explicit width shrink-wraps to its own content instead of
                  filling the available space. The button's only real
                  content was the frame div below, whose own width is a
                  PERCENTAGE (`min(220px, 100%)`) — a percentage resolves
                  against its containing block, but that containing block
                  (this button) was itself trying to size around that same
                  child, a circular/indeterminate dependency with no single
                  predictable resolution. In practice different photo
                  instances resolved to wildly different, mostly tiny,
                  widths (verified directly: 20-58px for most cards, ~155px
                  for one, against an intended up-to-220px) — not an
                  object-fit/object-cover issue (that was already applying
                  correctly and uniformly everywhere), a sizing issue one
                  level up. `w-full` gives the button a real, determinate
                  width (100% of its grid cell) so `min(220px, 100%)`
                  finally has something solid to resolve against. */}
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={caption ? `Enlarge photo: ${caption}` : "Enlarge photo"}
                className="relative w-full cursor-pointer rounded-sm bg-[#fdf6ec] p-2.5 pb-8 text-left shadow-lg shadow-[#6b4332]/15"
              >
                <WashiTape side={tapeSide} color={tapeColor} />

                {/* mx-auto: now that the button above can genuinely be
                    wider than 220px (its own grid column, on larger
                    screens), this capped-width frame needs to stay
                    centered inside it rather than default-left-aligning as
                    a narrower block. */}
                <div
                  className="relative mx-auto overflow-hidden bg-[#e8c4b0]"
                  style={{
                    aspectRatio: "1 / 1",
                    width: `min(${CARD_SIZE_PX}px, 100%)`,
                  }}
                >
                  <Image
                    src={src}
                    alt={caption ?? `Memory ${index + 1}`}
                    fill
                    sizes={`(max-width: 640px) 45vw, ${CARD_SIZE_PX}px`}
                    className="object-cover object-center"
                  />
                </div>

                {caption && (
                  <p className="font-display mx-auto mt-3 max-w-[200px] text-center text-xs italic leading-snug text-[#4a2f26]/75">
                    {caption}
                  </p>
                )}
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
