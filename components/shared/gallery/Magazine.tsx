"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { fadeUpVariant, scaleBlurVariant, staggerContainerVariant } from "@/lib/v2ScrollReveal";
import type { SitePhoto } from "@/types/site";

interface MemoryGalleryProps {
  photos: SitePhoto[];
}

// BUG FIX: this file used to look up each photo's aspect ratio from a
// hardcoded map of 16 demo filenames (couple-01.jpg...couple-16.jpg),
// falling back to a 10:5 default for anything else — meaning every real
// customer photo (a unique hosted URL, never literally named "couple-01.jpg")
// silently hit that fallback. Unlike V1's gallery/SunlitPolaroids.tsx (a grid
// of uniformly cropped squares, fixed by giving every card ONE fixed frame +
// object-cover), this gallery's whole design is a single full-bleed photo per
// slide shown via object-contain at its own true, uncropped aspect ratio —
// forcing a fixed crop frame here would be a real design change, not a bug
// fix, and would fight the existing "one real memory genuinely dominates the
// slide" intent documented throughout this file. So both photo instances
// (this slide's frame and the lightbox's enlarged view below) switch from
// next/image (which needs real width/height once `fill` isn't used) to a
// plain <img>, sized purely via the same CSS max-h/max-w caps already
// present — the browser reads the real file's own dimensions, so no
// dimension source is needed at all. Same technique already used by V1's own
// lightbox fix (gallery/SunlitPolaroids.tsx) and by the admin thumbnail grid
// (app/admin/orders/[slug]/page.tsx).

// ---- Ambient night-sky texture — own local reimplementation of
// ambient/NightSky.tsx's star-rendering approach (same mulberry32 PRNG
// technique, same globals.css `twinkle` keyframe via CSS custom properties,
// including that file's "featured star" tier), not imported from it: per
// this project's architecture convention V2 files stay independent of each
// other's component code the same way V1 files do (this file already took
// that position before this pass, so this keeps that precedent rather than
// introducing a new shared component for a pattern this modest).
//
// Takes a `seed` (generated fresh per gallery slide, via useMemo, rather
// than one fixed module-scope array — each full-screen slide is meant to
// read as its own complete scene, not a shared background bleeding across
// every slide) and a `variant`: the split-screen layout below mounts TWO
// independent instances per slide, one behind the photo and one behind the
// caption, deliberately at different density/positioning rather than one
// field spanning both halves — "photo" keeps the fuller, previously-tuned
// treatment; "caption" is sparser and repositioned slightly, atmospheric
// without ever competing with the text it sits behind for attention. Still
// fully deterministic per seed (no Math.random()), so there's no hydration
// risk. Untouched by this pass. ----
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
  glow: number;
  glowOpacity: number;
  duration: number;
  delay: number;
  color: string;
}

const PHOTO_STAR_COUNT = 50;
const CAPTION_STAR_COUNT = 22;
const STAR_WARM_WHITE = "#f7f2e7";
const STAR_GOLD = "#f2dfb0";

function buildAmbientStars(seed: number, count: number): AmbientStar[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    // ~20% "featured" — bigger, brighter-peaking, visibly glowing — so the
    // eye catches specific sparkles rather than a uniform dim shimmer,
    // same proportion/idea as NightSky.tsx's own featured-star tier.
    const featured = rand() < 0.2;
    return {
      x: rand() * 100,
      y: rand() * 100,
      size: featured ? 2.2 + rand() * 1.6 : 1 + rand() * 1.4,
      minOpacity: 0.18 + rand() * 0.1,
      maxOpacity: featured ? 0.85 + rand() * 0.15 : 0.5 + rand() * 0.3,
      glow: featured ? 3 + rand() * 3 : rand() * 1.5,
      glowOpacity: featured ? 0.55 + rand() * 0.3 : rand() * 0.2,
      duration: 2.2 + rand() * 2.6,
      delay: rand() * 5,
      color: rand() < 0.35 ? STAR_GOLD : STAR_WARM_WHITE,
    };
  });
}

function AmbientStars({ seed, variant = "photo" }: { seed: number; variant?: "photo" | "caption" }) {
  const isCaption = variant === "caption";
  const stars = useMemo(
    () => buildAmbientStars(seed, isCaption ? CAPTION_STAR_COUNT : PHOTO_STAR_COUNT),
    [seed, isCaption],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              opacity: star.minOpacity,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              "--min-opacity": star.minOpacity,
              "--max-opacity": star.maxOpacity,
              "--min-scale": 0.85,
              "--max-scale": 1.2,
              "--glow": `${star.glow}px`,
              "--glow-opacity": star.glowOpacity,
            } as React.CSSProperties
          }
        />
      ))}
      {/* One soft warm-gold glow pool, hand-placed (not random) — a quiet
          ambient light source for this half's own scene, echoing the gold
          tone of the frame itself rather than the cooler moonlight blue
          NightSky uses. Sized/positioned differently per variant so the two
          halves read as distinct considered scenes rather than mirrored
          copies of each other. Untouched by this pass. */}
      <div
        className={
          isCaption
            ? "absolute left-1/2 top-[42%] h-[45vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:w-[50vw] md:w-[38vw]"
            : "absolute left-1/2 top-1/2 h-[70vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:w-[65vw] md:w-[46vw]"
        }
        style={{ background: "radial-gradient(circle, rgba(212,175,122,0.1) 0%, rgba(212,175,122,0) 70%)" }}
      />
    </div>
  );
}

// A small gold diamond at each of the frame's four corners — the detail
// that pushes the border from "a gold line" toward "a gold-leaf frame,"
// since real gilded frames almost always carry a corner ornament, not just
// a flat mitred edge. Untouched by this pass.
function CornerOrnament({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const placement: Record<typeof position, string> = {
    tl: "-left-[3px] -top-[3px] sm:-left-1 sm:-top-1",
    tr: "-right-[3px] -top-[3px] sm:-right-1 sm:-top-1",
    bl: "-left-[3px] -bottom-[3px] sm:-left-1 sm:-bottom-1",
    br: "-right-[3px] -bottom-[3px] sm:-right-1 sm:-bottom-1",
  };
  return (
    <span
      aria-hidden="true"
      className={`absolute ${placement[position]} h-[7px] w-[7px] rotate-45 bg-[#f2dfb0] opacity-70 shadow-[0_0_5px_rgba(212,175,122,0.7)] transition-opacity duration-500 group-hover:opacity-100 sm:h-2.5 sm:w-2.5`}
    />
  );
}

// A small twinkling star-point sitting just outside two opposite corners of
// each frame (further out than CornerOrnament's own diamonds, so the two
// motifs sit near each other without overlapping) — a light "constellation
// adjacent" touch tying each frame to the surrounding starfield, using the
// same twinkle keyframe/custom-property technique as AmbientStars above,
// just a little larger/brighter since these are meant to actually register
// next to the frame rather than blend into the distant field. Untouched by
// this pass.
function FrameStarAccent({ position }: { position: "tl" | "br" }) {
  const placement: Record<"tl" | "br", string> = {
    tl: "-left-3 -top-3 sm:-left-4 sm:-top-4",
    br: "-right-3 -bottom-3 sm:-right-4 sm:-bottom-4",
  };
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${placement[position]} h-[3px] w-[3px] rounded-full bg-[#f7f2e7] sm:h-1 sm:w-1`}
      style={
        {
          animation: "twinkle 3.4s ease-in-out infinite",
          "--min-opacity": 0.3,
          "--max-opacity": 0.9,
          "--min-scale": 0.8,
          "--max-scale": 1.3,
          "--glow": "3px",
          "--glow-opacity": 0.6,
        } as React.CSSProperties
      }
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

// Click-to-enlarge overlay. Portal + hydration-safe pattern carried over
// from lessons already learned building this same feature in V1's
// gallery/SunlitPolaroids.tsx this session (reimplemented fresh here, not
// imported — this file shares no code with any V1 file):
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
//   - The enlarged image is a plain <img> (see the BUG FIX comment near the
//     top of this file) inside a content-sized wrapper with `overflow-hidden`
//     as a safety net only, not a fixed box — that's what lets a portrait
//     photo's frame hug its actual shape instead of pillarboxing.
// Still opens exactly the same way, from any slide's photo.
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
          <AmbientStars seed={6510} />
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
          {/* Same gold-leaf-frame treatment as each slide's photo half
              (gradient border + corner ornaments), scaled up and held
              straight (no tilt) since this is the focal enlarged view.
              Content-sized (no fixed width/height), so nothing here can
              overflow — `overflow-hidden` is a safety net, not a scroll
              boundary. */}
          <div className="relative rounded-md bg-gradient-to-br from-[#d4af7a] via-[#f2dfb0] to-[#9c7a45] p-[3px] shadow-2xl shadow-black/60">
            <CornerOrnament position="tl" />
            <CornerOrnament position="tr" />
            <CornerOrnament position="bl" />
            <CornerOrnament position="br" />
            <div className="flex flex-col items-center rounded-[4px] bg-gradient-to-br from-[#f7ecd2] to-[#ecdab0] p-3 pb-5 shadow-inner shadow-black/10 sm:p-4 sm:pb-6">
              {/* Plain <img>, not next/image — see the BUG FIX comment near
                  the top of this file. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.caption ?? "Enlarged memory"}
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

// Bouncing "keep scrolling" hint — same composition/technique as
// hero/CinematicVideo.tsx's own scroll indicator (small uppercase label +
// a gently bouncing chevron), reused as a pattern rather than shared code,
// consistent with this file's existing "no cross-file V2 sharing"
// precedent. Rendered as a direct child of the full-width slide (a sibling
// of both halves, not nested inside either one), so `left-1/2` centers it
// against the whole slide's width rather than just one half. Shown on
// every slide except the last, so nothing implies the gallery has more to
// show once it actually doesn't. Untouched by this pass.
function ScrollHint() {
  return (
    <motion.div
      className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[#d4af7a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <span className="text-[10px] uppercase tracking-[0.3em] opacity-80">More below</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={20} />
      </motion.div>
    </motion.div>
  );
}

interface GallerySlideProps {
  photo: SitePhoto;
  index: number;
  isLast: boolean;
  onOpen: () => void;
}

// Extracted into its own component (rather than inline JSX inside
// MemoryGallery's photos.map()) specifically so it can call its own hooks
// (useInView/useState/useEffect below) — React's rules of hooks forbid
// calling hooks inside a .map() callback in the parent, since that isn't a
// stable per-item call site the way a genuinely separate component
// instance per photo is.
//
// FIX: photo stuck mid-blur. The previous version drove each slide's
// reveal off Framer Motion's generic `whileInView` + `viewport: {once:
// false, amount: 0.3}` — a live IntersectionObserver ratio crossing a
// fairly low, fixed threshold. In a scroll-snap context that's unstable:
// as a slide scrolls toward its snap point, the browser's own native
// snap-settle animation can briefly overshoot and correct, and that
// correction can make the visible ratio dip back below 30% and re-cross it
// — every crossing restarts the scaleBlurVariant "hidden" -> "visible"
// transition from scratch (opacity 0/scale 0.92/blur(8px) all over again),
// so a jittery settle can keep re-triggering faster than the 0.8s
// transition ever finishes, leaving the photo visibly stuck mid-blur
// instead of reaching blur(0px).
//
// Fix: a custom "settled" trigger instead of the generic viewport
// percentage. `useInView` still reports live intersection, now at a higher
// 0.6 threshold (a slide that's actually snapped into place is close to
// fully visible, so this alone already rejects most in-transit crossings),
// but the value that actually drives the animation (`settled`) only
// updates after that raw value has held steady for 150ms — i.e. only once
// the slide has genuinely stopped moving, not just technically crossed a
// ratio at some instant mid-scroll. Any renewed flicker within that window
// cancels and restarts the debounce (a standard debounce pattern), so
// continuous jitter simply keeps the photo at its last stable state rather
// than stuttering, and settles cleanly the moment scrolling actually stops
// — which is what "detecting when a slide has fully snapped into place"
// means in practice here.
function GallerySlide({ photo, index, isLast, onOpen }: GallerySlideProps) {
  const { src, caption } = photo;
  const isReversed = index % 2 === 1;

  const slideRef = useRef<HTMLDivElement>(null);
  const rawInView = useInView(slideRef, { amount: 0.6 });
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSettled(rawInView), 150);
    return () => window.clearTimeout(timeoutId);
  }, [rawInView]);

  return (
    // The stagger container itself (photo half uses scaleBlurVariant,
    // caption half uses fadeUpVariant with no delay of its own — the
    // container's staggerChildren/delayChildren is what gives the caption
    // its "arrives just after the photo" timing). Driven by `animate`
    // (the debounced `settled` boolean above) instead of `whileInView` —
    // variant propagation to the two children below works identically
    // either way, only the trigger mechanism changed.
    <motion.div
      ref={slideRef}
      initial="hidden"
      animate={settled ? "visible" : "hidden"}
      variants={staggerContainerVariant}
      className={`relative flex min-h-dvh w-full snap-center flex-col overflow-hidden md:flex-row ${
        isReversed ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Photo half — now ~62% of the slide's width on desktop (up from an
          even 50/50 split) and sized close to the full available height
          (md:max-h-[92vh], up from 78vh) so it genuinely dominates the
          slide rather than sitting in a large empty margin. Same gold-leaf
          frame/corner ornaments as before, untouched in style — only the
          photo's own size and the column's width share changed. */}
      <motion.div
        variants={scaleBlurVariant}
        className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-6 md:w-[62%] md:flex-none md:px-6 md:py-0"
      >
        <AmbientStars seed={6510 + index * 137} variant="photo" />

        {index === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 mb-6 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
          >
            Moments, Framed
          </motion.p>
        )}

        {/* Soft warm glow behind the frame — style/opacity/technique
            unchanged (this isn't the ambient star/glow system itself,
            which lives in AmbientStars above and stayed untouched; this is
            a frame-coupled glow that has to scale with the frame or it
            gets eclipsed by it, same reasoning as the previous pass's size
            bump). Re-sized again here to keep exceeding the now-larger
            photo's bounds. Placed before the button in DOM order (both
            default `static` stacking, so first-in-DOM paints behind)
            rather than via a negative z-index. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[95vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:w-[70vw] md:w-[62vw]"
          style={{ background: "radial-gradient(circle, rgba(212,175,122,0.16) 0%, rgba(212,175,122,0) 70%)" }}
        />

        <button
          type="button"
          onClick={onOpen}
          aria-label={caption ? `Enlarge photo: ${caption}` : `Enlarge memory ${index + 1}`}
          className="group relative z-10 cursor-pointer rounded-md bg-gradient-to-br from-[#d4af7a] via-[#f2dfb0] to-[#9c7a45] p-[3px] shadow-2xl shadow-black/50 transition-shadow duration-500 hover:shadow-[0_0_32px_-4px_rgba(212,175,122,0.5)] sm:p-[5px]"
        >
          <CornerOrnament position="tl" />
          <CornerOrnament position="tr" />
          <CornerOrnament position="bl" />
          <CornerOrnament position="br" />
          <FrameStarAccent position="tl" />
          <FrameStarAccent position="br" />

          <div className="rounded-[4px] bg-gradient-to-br from-[#f7ecd2] to-[#ecdab0] p-3 shadow-inner shadow-black/15 sm:p-5">
            {/* Mobile: ~58vh, unchanged from the prior pass (this fix is
                scoped to the split desktop layout, per the brief). md+:
                92vh (up from 78vh) — "near 100dvh" while still leaving a
                margin so the frame never touches the viewport edge — with
                a wider max-width (54vw, up from 42vw; lg cap raised from
                520px to 760px) matching the column's new 62% share.
                object-contain resolves whichever bound (height or width)
                actually binds for a given photo's own aspect ratio. Plain
                <img>, not next/image — see the BUG FIX comment near the top
                of this file. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Memory ${index + 1}`}
              className="block h-auto max-h-[58vh] w-auto max-w-[88vw] rounded-sm object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02] md:max-h-[92vh] md:max-w-[54vw] lg:max-w-[760px]"
            />
          </div>
        </button>
      </motion.div>

      {/* Caption half — now ~38% of the slide's width on desktop (down
          from 50%), still its own dedicated panel with guaranteed contrast
          against the plain dark background, never overlaid on the photo.
          Horizontal padding trimmed slightly (md:px-8, down from md:px-16)
          so the narrower column still has real usable width for the text
          rather than padding eating most of it — the caption's own text
          styling (size/color/italic/weight) is unchanged. */}
      <motion.div
        variants={fadeUpVariant}
        className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8 md:w-[38%] md:flex-none md:px-8 md:py-0"
      >
        <AmbientStars seed={6510 + index * 137 + 53} variant="caption" />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rotate-45 bg-[#f2dfb0] shadow-[0_0_10px_rgba(212,175,122,0.6)]"
          />

          <p
            className="font-display mt-6 text-2xl italic leading-snug text-[#f2dfb0] sm:text-3xl md:text-4xl"
            style={{ textShadow: "0 0 20px rgba(212,175,122,0.25)" }}
          >
            {caption}
          </p>

          <span className="mt-6 h-px w-16 bg-gradient-to-r from-transparent via-[#d4af7a] to-transparent" />
        </div>
      </motion.div>

      {!isLast && <ScrollHint />}
    </motion.div>
  );
}

// V2's counterpart to V1's gallery/SunlitPolaroids.tsx — same "one real
// memory per frame" intent, staged as a full-screen cinematic experience
// (CSS scroll-snap, one photo per viewport height) via a split-screen story
// spread rather than a single centered photo-and-caption stack.
//
// SCROLL-SNAP FIX: the previous version wrapped all the slides in their own
// `h-dvh overflow-y-scroll snap-y snap-mandatory` container — a fixed-height
// box with its own overflow, nested inside the page's normal scroll flow.
// That's a genuinely separate scrolling context with its own scrollbar,
// alongside the page's own scrollbar for everything else — the double
// scrollbar this fix addresses, same root-cause shape as the earlier
// SunlitPolaroids issue this session (a fixed-dimension container whose
// overflow setting didn't match how its content was actually meant to
// scroll). CSS scroll-snap-type only has any effect on the element that's
// genuinely the scroll container for that axis; since this section is
// meant to scroll as part of the PAGE's own single scroll (not a nested
// box), scroll-snap-type has to live on whatever the real scrolling
// element is — here, `<html>`/`<body>` (rendered by app/layout.tsx, not
// this file). The `useEffect` below sets it there imperatively for as long
// as this component is mounted, then restores whatever was there before on
// unmount — the same pattern this file's own Lightbox already uses to lock
// scroll on both elements (covering both because this app's layout makes
// it ambiguous which one is really the scrolling element). Individual
// slides keep `snap-center`; nothing else about how scroll-snap-align
// works changes. With the nested h-dvh/overflow-y-scroll wrapper gone,
// this section is now just a very tall section in the page's normal block
// flow — like every other section — so there's exactly one scrollbar.
//
// Each slide (see GallerySlide above) keeps the prior pass's ornamentation
// (CornerOrnament, FrameStarAccent, the per-half AmbientStars atmosphere,
// the caption's flourish) and alternates which side the photo sits on
// (isReversed = index % 2 === 1) — all untouched by this pass, which is
// scoped to the scrollbar, the reveal trigger, and photo/frame sizing.
//
// Click-to-enlarge lightbox (see Lightbox above) is completely unchanged —
// same prev/next wraparound navigation, Escape/backdrop-click/X close, in
// V2's own dark burgundy/gold tokens throughout.
export default function MemoryGallery({ photos }: MemoryGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlSnap = html.style.scrollSnapType;
    const previousBodySnap = body.style.scrollSnapType;
    html.style.scrollSnapType = "y mandatory";
    body.style.scrollSnapType = "y mandatory";
    return () => {
      html.style.scrollSnapType = previousHtmlSnap;
      body.style.scrollSnapType = previousBodySnap;
    };
  }, []);

  return (
    <section className="relative">
      {photos.map((photo, index) => (
        <GallerySlide
          key={photo.src + index}
          photo={photo}
          index={index}
          isLast={index === photos.length - 1}
          onOpen={() => setLightboxIndex(index)}
        />
      ))}

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
