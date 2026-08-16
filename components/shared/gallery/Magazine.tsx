"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { SitePhoto } from "@/types/site";

interface MemoryGalleryProps {
  photos: SitePhoto[];
}

// Real pixel dimensions of the demo photo set (measured, not guessed), so each
// framed piece keeps its true aspect ratio instead of a forced crop — and so
// the lightbox below can size its enlarged image via real width/height
// instead of a fixed box, which is what actually avoids pillarboxing a
// portrait photo inside a landscape-shaped container.
// Falls back to a generic portrait ratio for any photo not in this set.
const PHOTO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "couple-01.jpg": { width: 436, height: 236 },
  "couple-02.jpg": { width: 100, height: 106 },
  "couple-03.jpg": { width: 136, height: 136 },
  "couple-04.jpg": { width: 136, height: 136 },
  "couple-05.jpg": { width: 136, height: 136 },
  "couple-06.jpg": { width: 136, height: 136 },
  "couple-07.jpg": { width: 136, height: 136 },
  "couple-08.jpg": { width: 136, height: 136 },
  "couple-09.jpg": { width: 136, height: 136 },
  "couple-10.jpg": { width: 136, height: 136 },
  "couple-11.jpg": { width: 136, height: 136 },
  "couple-12.jpg": { width: 136, height: 136 },
  "couple-13.jpg": { width: 136, height: 136 },
  "couple-14.jpg": { width: 136, height: 136 },
  "couple-15.jpg": { width: 136, height: 136 },
  "couple-16.jpg": { width: 136, height: 136 },
};

const DEFAULT_DIMENSIONS = { width: 10, height: 5 };

function getDimensions(src: string) {
  const filename = src.split("/").pop() ?? "";
  return PHOTO_DIMENSIONS[filename] ?? DEFAULT_DIMENSIONS;
}

// Deliberate large/small rhythm through the sequence — every third piece is a
// "feature," the rest are smaller "companion" pieces. Fixed by index, not
// random, so the curation reads as intentional.
const FEATURE_HEIGHT = 600;
const COMPANION_HEIGHT = 400;

// ---- Ambient night-sky texture behind the wall — self-contained local copy
// of ambient/NightSky.tsx's own deterministic-star technique (same
// mulberry32 PRNG, same globals.css `twinkle` keyframe via CSS custom
// properties), reimplemented here rather than imported so this file has no
// dependency on that component. A much sparser/smaller field (28 vs. that
// section's 100, capped at 1.8px, low opacity ceiling) — this is meant to
// read as a quiet extension of the surrounding night rather than a second
// full starfield competing with NightSky's own. Fixed at module scope from a
// seeded PRNG, so it's identical on server and client with no client-only
// gating needed. ----
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

interface AmbientStar {
  x: number;
  y: number;
  size: number;
  minOpacity: number;
  maxOpacity: number;
  duration: number;
  delay: number;
}

const AMBIENT_STAR_COUNT = 28;

const AMBIENT_STARS: AmbientStar[] = (() => {
  const rand = mulberry32(6510);
  return Array.from({ length: AMBIENT_STAR_COUNT }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 0.8,
    minOpacity: 0.08 + rand() * 0.06,
    maxOpacity: 0.35 + rand() * 0.25,
    duration: 2.8 + rand() * 1.8,
    delay: rand() * 4,
  }));
})();

function AmbientStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {AMBIENT_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#f7f2e7]"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.minOpacity,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              "--min-opacity": star.minOpacity,
              "--max-opacity": star.maxOpacity,
              "--min-scale": 0.85,
              "--max-scale": 1.15,
              "--glow": "2px",
              "--glow-opacity": 0.4,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Two soft warm-gold glow pools, hand-placed (not random) — quiet
          ambient light sources for the wall to hang in, echoing the gold
          tone of the frames themselves rather than the cooler moonlight
          blue NightSky uses. */}
      <div
        className="absolute -left-24 top-[10%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,122,0.1) 0%, rgba(212,175,122,0) 70%)" }}
      />
      <div
        className="absolute -right-20 bottom-[15%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,122,0.08) 0%, rgba(212,175,122,0) 70%)" }}
      />
    </div>
  );
}

// A small gold diamond at each of the frame's four corners — the detail
// that pushes the border from "a gold line" toward "a gold-leaf frame,"
// since real gilded frames almost always carry a corner ornament, not just
// a flat mitred edge.
function CornerOrnament({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const placement: Record<typeof position, string> = {
    tl: "-left-[3px] -top-[3px]",
    tr: "-right-[3px] -top-[3px]",
    bl: "-left-[3px] -bottom-[3px]",
    br: "-right-[3px] -bottom-[3px]",
  };
  return (
    <span
      aria-hidden="true"
      className={`absolute ${placement[position]} h-[7px] w-[7px] rotate-45 bg-[#f2dfb0] opacity-70 shadow-[0_0_5px_rgba(212,175,122,0.7)] transition-opacity duration-500 group-hover:opacity-100`}
    />
  );
}

// Bootstrap Icons' "x-lg" glyph, inlined as raw path data — own local copy
// (not shared with gallery/SunlitPolaroids.tsx's identical-looking icon)
// per V1/V2's file-separation rule: this file must not import from or share
// component code with any V1 file.
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

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

function noopSubscribe() {
  return () => {};
}

interface LightboxProps {
  photos: SitePhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Click-to-enlarge overlay for the wall below. Portal + hydration-safe
// pattern carried over from lessons already learned building this same
// feature in V1's gallery/SunlitPolaroids.tsx this session (reimplemented
// fresh here, not imported — this file shares no code with any V1 file):
//   - The whole AnimatePresence block is portaled as a single unit, not
//     createPortal nested inside its children — createPortal's return value
//     isn't a valid React element, so AnimatePresence can't clone it as a
//     child if it lives inside instead of around it.
//   - `isMounted` (via useSyncExternalStore, empty/false snapshot on server
//     and first client paint) gates the createPortal call to client-only
//     render passes, since document.body doesn't exist during SSR.
//   - Both <html> and <body> get their overflow locked, not just <body> —
//     app/layout.tsx's `h-full`/`min-h-full flex` structure means locking
//     body alone still leaves the page scrollable. Locked in its own effect
//     with an empty dependency array, so it toggles exactly once on
//     mount/unmount rather than re-toggling on every photo navigation.
//   - The enlarged image is sized via its real width/height (getDimensions
//     above) inside a content-sized wrapper with `overflow-hidden` as a
//     safety net only, not a fixed box — that's what lets a portrait photo's
//     frame hug its actual shape instead of pillarboxing.
function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const photo = photos[index];

  const goPrev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const goNext = () => onNavigate((index + 1) % photos.length);

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

  const { width: photoWidth, height: photoHeight } = getDimensions(photo.src);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="magazine-lightbox"
        className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4 sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="absolute inset-0 bg-[#0c0509]/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <AmbientStars />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2b0f1a] to-[#1a0a12] text-[#d4af7a] shadow-lg shadow-black/50 ring-1 ring-[#d4af7a]/40 transition-all duration-200 hover:scale-110 hover:text-[#f2dfb0] hover:shadow-[0_0_18px_rgba(212,175,122,0.5)]"
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
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#2b0f1a] to-[#1a0a12] text-[#d4af7a] shadow-lg shadow-black/50 ring-1 ring-[#d4af7a]/40 transition-all duration-200 hover:scale-110 hover:text-[#f2dfb0] hover:shadow-[0_0_18px_rgba(212,175,122,0.5)] sm:left-6"
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
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#2b0f1a] to-[#1a0a12] text-[#d4af7a] shadow-lg shadow-black/50 ring-1 ring-[#d4af7a]/40 transition-all duration-200 hover:scale-110 hover:text-[#f2dfb0] hover:shadow-[0_0_18px_rgba(212,175,122,0.5)] sm:right-6"
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
          {/* Same gold-leaf-frame treatment as the wall below (gradient
              border + corner ornaments), scaled up and held straight (no
              tilt) since this is the focal enlarged view. Content-sized
              (no fixed width/height), so nothing here can overflow —
              `overflow-hidden` is a safety net, not a scroll boundary. */}
          <div className="relative rounded-md bg-gradient-to-br from-[#d4af7a] via-[#f2dfb0] to-[#9c7a45] p-[3px] shadow-2xl shadow-black/60">
            <CornerOrnament position="tl" />
            <CornerOrnament position="tr" />
            <CornerOrnament position="bl" />
            <CornerOrnament position="br" />
            <div className="flex flex-col items-center rounded-[4px] bg-gradient-to-br from-[#f7ecd2] to-[#ecdab0] p-3 pb-5 shadow-inner shadow-black/10 sm:p-4 sm:pb-6">
              <Image
                src={photo.src}
                alt={photo.caption ?? "Enlarged memory"}
                width={photoWidth}
                height={photoHeight}
                sizes="(max-width: 768px) 85vw, 900px"
                className="block h-auto max-h-[58vh] w-auto max-w-[82vw] rounded-sm object-contain sm:max-h-[62vh]"
              />

              {photo.caption && (
                <p className="font-display mt-3 max-w-[240px] text-center text-sm italic leading-snug text-[#3a2412] sm:max-w-xs sm:text-base">
                  {photo.caption}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// V2's counterpart to V1's gallery/SunlitPolaroids.tsx — same "one real
// memory per frame" intent, but a formal gallery-wall metaphor instead of a
// scrapbook: a single stacked column of gilded frames with museum wall-label
// captions beneath each, rather than a scattered polaroid grid.
//
// This pass elevates what was a plain gold-line-and-cream-mat frame:
//   - AmbientStars: a sparse night-sky texture (own local copy of
//     NightSky.tsx's star technique, much thinner) plus two soft gold glow
//     pools, so the wall reads as hanging in the same night rather than
//     floating on flat page background.
//   - CornerOrnament + a gradient (not flat) gold border: pushes the frame
//     from "a gold line" to an actual gold-leaf treatment, with a mat that
//     now has its own subtle gradient + inset shadow for real depth instead
//     of a flat cream fill.
//   - The wall label below each frame is now a small flanking-line + diamond
//     motif (a "museum placard" composition) instead of one plain divider,
//     with a soft warm text-shadow glow on the caption echoing the frame's
//     own gold glow — refined spacing/tracking to match.
//   - A small eyebrow label above the whole wall ("MOMENTS, FRAMED"),
//     matching the small-caps kicker treatment countdown/GlassCards.tsx and
//     places/PlacesWeveBeen.tsx already use elsewhere in V2, so this section
//     reads as part of the same established rhythm rather than a simpler
//     one-off.
//   - Click-to-enlarge lightbox (see Lightbox above) with prev/next
//     wraparound navigation, Escape/backdrop-click/X close, in V2's own
//     dark burgundy/gold tokens throughout (never V1's peach/terracotta).
export default function MemoryGallery({ photos }: MemoryGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden px-6 py-[120px]">
      <AmbientStars />

      <div className="relative mx-auto max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-14 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
        >
          Moments, Framed
        </motion.p>

        {photos.map((photo, index) => {
          const { src, caption } = photo;
          const { width, height } = getDimensions(src);
          const isFeature = index % 3 === 0;
          const targetHeight = isFeature ? FEATURE_HEIGHT : COMPANION_HEIGHT;
          // Ideal width for that target height at this photo's true aspect
          // ratio, plus the frame's own chrome (gradient border + mat
          // padding), so the FRAME's width resolves the photo itself to
          // ~idealWidth. Lives on the frame div, not the inner image box —
          // see the original version of this file for the full explanation
          // of why (a flex child under `items-center` shrink-wraps to its
          // content's width; a percentage-based inner box would be
          // resolving against a parent waiting on it to size first, which
          // collapses to 0).
          const idealWidth = Math.round(targetHeight * (width / height));
          const FRAME_CHROME_PX = 33; // ~3px gradient border + 12px mat padding, both sides
          const frameWidth = idealWidth + FRAME_CHROME_PX;

          return (
            <motion.div
              key={src + index}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="group relative mb-24 flex flex-col items-center last:mb-0 sm:mb-32"
            >
              {/* Gold-leaf frame: a metallic gradient border (not a flat
                  line) wrapping a gradient mat with an inset shadow for
                  real depth, plus a diamond ornament at each corner and a
                  soft gold glow that blooms in on hover. */}
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={caption ? `Enlarge photo: ${caption}` : `Enlarge memory ${index + 1}`}
                className="relative cursor-pointer rounded-md bg-gradient-to-br from-[#d4af7a] via-[#f2dfb0] to-[#9c7a45] p-[3px] shadow-2xl shadow-black/50 transition-shadow duration-500 group-hover:shadow-[0_0_32px_-4px_rgba(212,175,122,0.5)]"
                style={{ width: `min(${frameWidth}px, 100%)` }}
              >
                <CornerOrnament position="tl" />
                <CornerOrnament position="tr" />
                <CornerOrnament position="bl" />
                <CornerOrnament position="br" />

                <div className="rounded-[4px] bg-gradient-to-br from-[#f7ecd2] to-[#ecdab0] p-3 shadow-inner shadow-black/15">
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: `${width} / ${height}` }}
                  >
                    <Image
                      src={src}
                      alt={`Memory ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 90vw, 640px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              </button>

              {/* Wall label — a museum-placard composition (flanking lines
                  + a center diamond) rather than one plain divider, with a
                  soft warm glow on the caption text. */}
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#d4af7a]/80" />
                  <span className="h-1 w-1 rotate-45 bg-[#d4af7a]" />
                  <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#d4af7a]/80" />
                </div>
                <p
                  className="font-display max-w-xs text-center text-xs uppercase tracking-[0.25em] text-[#e8d4b0]"
                  style={{ textShadow: "0 0 14px rgba(212,175,122,0.35)" }}
                >
                  {caption}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

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
