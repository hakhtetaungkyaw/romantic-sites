"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Birthday V1 "Celebration Room" interactive object #5 — catch a shooting
// star, write a wish, release it. Adapts the shooting-star-catch mechanic
// from Anniversary V2's interactive/ShootingStarWish.tsx (timing/hit-area/
// trail lessons checked and reused below) into a fresh, fully local
// implementation — reimplemented, not imported, per this project's
// product-line isolation principle (nothing here imports from
// components/shared/ or any lib/v1*.ts Anniversary constants module), and
// doesn't import from this file's own siblings either.
//
// Framing: hero/BirthdayGate.tsx's own candle-blow is a silent, private
// wish — this is its bookend, letting the visitor put a wish into words
// and let it go. Unlike every other object in this room, this one is
// deliberately NOT a keepsake: the written wish is never sent anywhere,
// never stored anywhere, and is discarded the instant "Send" is tapped —
// see handleSend below for exactly where it stops existing.
//
// Palette: this is the one Birthday V1 object with a genuinely dark scene
// (a cosmic sky, not the light cream every other object sits on) — a
// deliberate, isolated exception, not a precedent for the rest of the
// product line. The sky itself (see `skyGradient` below) has since moved
// from an earlier warm dusk-brown pass to a deeper near-black-to-plum
// cosmic gradient for a more unambiguous "night sky" read; the wish card
// (see WishModal below) was recolored to match — both stay gold-starlit and
// plum/violet rather than Anniversary V2's own navy-blue
// ambient/NightSky.tsx / interactive/ShootingStarWish.tsx's own
// #d4af7a-family palette, so the two still read as distinct worlds even
// though both are now genuinely dark scenes.

interface WishLetterProps {
  /** Fired every time a wish is successfully sent — the object's own
   *  "discovered" signal (same fires-on-completion shape as
   *  onAllPopped/onWheelSpin). Safe to fire more than once per visit: the
   *  parent's own setState is idempotent past the first real call, same
   *  reasoning every other object's callback already relies on. */
  onWishSent?: () => void;
  onBack?: () => void;
}

// ---- Shooting star timing/geometry — same values
// interactive/ShootingStarWish.tsx's own tuning history arrived at (slower
// transit for real tap-ability, a visible trail, a pulsing "tap me" ring),
// reimplemented locally rather than imported. ----
const MIN_INTERVAL_MS = 8000;
const MAX_INTERVAL_MS = 13000;
const MIN_DURATION_S = 3;
const MAX_DURATION_S = 4.5;
const MIN_SPEED_PX_PER_S = 70;
const MAX_SPEED_PX_PER_S = 110;

interface StarConfig {
  id: number;
  startTop: number;
  startLeft: number;
  angleDeg: number;
  travelDistance: number;
  trailLength: number;
  duration: number;
}

// True runtime randomness, safe without seeding — same reasoning
// interactive/ShootingStarWish.tsx documents for its own randomStar:
// `star` starts at `null` on both server and client, and only this file's
// own useEffect below (which never runs during SSR) ever calls this, so
// there's nothing for hydration to compare against.
function randomStar(id: number): StarConfig {
  const duration = MIN_DURATION_S + Math.random() * (MAX_DURATION_S - MIN_DURATION_S);
  const speed = MIN_SPEED_PX_PER_S + Math.random() * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
  return {
    id,
    startTop: Math.random() * 30,
    startLeft: Math.random() * 55,
    angleDeg: 22 + Math.random() * 18,
    travelDistance: duration * speed,
    trailLength: 90 + Math.random() * 60,
    duration,
  };
}

const CATCH_FLASH_ANIMATE = { scale: [1, 1.7, 1.25], opacity: 1 };
const CATCH_FLASH_TRANSITION = { duration: 0.4, ease: "easeOut" as const };

// ---- Ambient dusk sky: layered stars, a warm glow orb, and slow-drifting
// clouds — a fixed-seed deterministic field (same mulberry32 + fixed-seed
// technique Anniversary V2's own ambient/NightSky.tsx documents for its own
// STARS/CLOUDS/Moon), reimplemented locally in warm dusk tones rather than
// that file's cool navy/gold palette. NOT the shared `twinkle` CSS keyframe
// in app/globals.css: that keyframe's own box-shadow glow color is
// hardcoded white, which would read as a cool accent against this warm
// scene — Framer Motion opacity/scale loops here instead keep every color
// warm and local to this file. No scroll-linked parallax (unlike
// NightSky.tsx's own 3-layer scroll parallax): this scene is a fixed
// full-screen panel, not a scrolling page section, so depth here comes from
// varied size/opacity/glow per layer instead — 3 layers (back/mid/front),
// front stars alone getting a soft glow halo, same "a few stars catch the
// eye, the rest twinkle subtly beneath" idea NightSky.tsx's own STARS
// generation uses (there, via a ~18% "featured" cut). ----
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
  color: string;
  minOpacity: number;
  maxOpacity: number;
  duration: number;
  delay: number;
  /** Front-layer stars only — a soft warm glow halo via box-shadow, so a
   *  handful of stars read as brighter/closer than the rest of the field. */
  glow: boolean;
}

const AMBIENT_STAR_COUNT = 34;
const AMBIENT_STAR_COLORS = ["#fdf6ec", "#e8b869", "#f0dfc0"];

const AMBIENT_STARS: AmbientStar[] = (() => {
  const rand = mulberry32(7031);
  return Array.from({ length: AMBIENT_STAR_COUNT }, () => {
    // Weighted toward the back layer (roughly 45% back / 37% mid / 18%
    // front) so the "a few stand out" effect stays an accent, not half the
    // field.
    const roll = rand();
    const front = roll > 0.82;
    const mid = !front && roll > 0.45;
    return {
      x: rand() * 100,
      y: rand() * 68,
      size: front ? 2.2 + rand() * 1.6 : mid ? 1.4 + rand() * 1 : 0.8 + rand() * 0.8,
      color: AMBIENT_STAR_COLORS[Math.floor(rand() * AMBIENT_STAR_COLORS.length)],
      minOpacity: front ? 0.35 + rand() * 0.15 : 0.12 + rand() * 0.15,
      maxOpacity: front ? 0.9 + rand() * 0.1 : mid ? 0.55 + rand() * 0.2 : 0.4 + rand() * 0.15,
      duration: 2 + rand() * 2.5,
      delay: rand() * 4,
      glow: front,
    };
  });
})();

function AmbientStarfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {AMBIENT_STARS.map((star, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            boxShadow: star.glow ? `0 0 ${star.size * 2.5}px rgba(232,184,105,0.7)` : undefined,
          }}
          animate={{ opacity: [star.minOpacity, star.maxOpacity, star.minOpacity] }}
          transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// Established 4-point sparkle glyph — checked interactive/RevealCard.tsx /
// interactive/ConstellationGame.tsx (Anniversary V2) for the exact path,
// reused here as shared visual vocabulary (the SVG path data itself), not
// shared code, per this file's own isolation note above. Distinct from
// this file's own simpler sparklePath() bezier diamond further below (used
// for the send confirmation / catch-flash) — this is a separate, more
// detailed glyph reserved for the 5 prominent shining stars below, so the
// two "sparkle families" don't get visually confused with each other.
const PROMINENT_STAR_PATH =
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";

interface ProminentStar {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// Hand-placed, not generated — exactly 5, same "needs to look deliberately
// arranged, not regenerated" reasoning every other fixed decorative layout
// in this project's Birthday files gives. Deliberately kept clear of the
// two caption lines' own text band (roughly x 12–88%, y 44–58%) and the
// corners already occupied by BackButton (top-left) / DuskGlowOrb
// (top-right) / the song player pill (bottom-right).
const PROMINENT_STARS: ProminentStar[] = [
  { x: 14, y: 16, size: 20, duration: 2.6, delay: 0 },
  { x: 88, y: 34, size: 16, duration: 3, delay: 0.6 },
  { x: 20, y: 64, size: 18, duration: 2.8, delay: 1.2 },
  { x: 80, y: 72, size: 15, duration: 3.2, delay: 1.8 },
  { x: 50, y: 8, size: 14, duration: 2.4, delay: 2.4 },
];

// 5 larger, prominent shining stars layered above the small ambient
// background field — same "outer plain div owns the static position, inner
// motion element owns only the animated properties" split this file's own
// ShootingStar/Lantern-style siblings already use elsewhere in this
// project: a static `transform` placed directly on a motion element that's
// ALSO animated via `animate` gets silently overridden by Framer's own
// generated transform, so the centering translate(-50%,-50%) lives on the
// outer, untouched div instead. Each star twinkles on its own independent
// opacity+scale loop (staggered delay per star) so the 5 don't pulse in
// unison.
function ProminentStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PROMINENT_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${star.x}%`, top: `${star.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <motion.svg
            viewBox="0 0 24 24"
            width={star.size}
            height={star.size}
            style={{
              filter: "drop-shadow(0 0 6px rgba(232,184,105,0.75)) drop-shadow(0 0 12px rgba(232,184,105,0.35))",
            }}
            initial={{ opacity: 0.5, scale: 0.85 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.18, 0.85] }}
            transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
          >
            <path d={PROMINENT_STAR_PATH} fill="#e8b869" stroke="#c96a4f" strokeWidth={0.6} />
          </motion.svg>
        </div>
      ))}
    </div>
  );
}

// A warm glow orb standing in for NightSky.tsx's own cool crescent moon — a
// soft amber halo behind a brighter gold-to-terracotta disc, evoking a
// dusk-adjacent sun/moon rather than a literal night-sky crescent. Same
// corner placement + slow breathing-opacity pulse as that file's own Moon,
// reimplemented locally with a plain radial-gradient disc instead of an
// SVG mask/crescent cutout — there's no "dark side" to cut away from a warm
// glow; the whole point is it reads as radiant, not lunar.
function DuskGlowOrb() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-6 h-20 w-20 sm:right-8 sm:top-10 sm:h-28 sm:w-28"
    >
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(232,184,105,0.55) 0%, rgba(232,184,105,0) 72%)" }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.94, 1.06, 0.94] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-[24%] rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #fdf3df 0%, #e8b869 55%, #c96a4f 100%)",
          boxShadow: "0 0 22px rgba(232,184,105,0.55)",
        }}
      />
    </div>
  );
}

interface DuskCloud {
  top: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  direction: 1 | -1;
}

// Hand-placed, not generated — only 2 instances, same reasoning every other
// small fixed decorative set in this project's Birthday files gives.
// Negative delay starts each cloud partway through its own drift cycle
// (same trick ambient/NightSky.tsx's own CLOUDS uses) so the two don't
// enter from the same edge together.
const DUSK_CLOUDS: DuskCloud[] = [
  { top: 16, scale: 1, opacity: 0.14, duration: 95, delay: -18, direction: 1 },
  { top: 38, scale: 0.78, opacity: 0.1, duration: 130, delay: -70, direction: -1 },
];

// 3 overlapping blurred blobs per cloud — same silhouette technique
// ambient/NightSky.tsx's own CloudShape uses, reimplemented locally in a
// warm cream tone (rather than that file's own #f7ecd2-on-navy) so it reads
// as a warm haze drifting past the dusk sky, not a cool night cloud.
function DuskCloudShape({ cloud }: { cloud: DuskCloud }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute h-14 w-44 sm:h-20 sm:w-64"
      style={{ top: `${cloud.top}%`, opacity: cloud.opacity, scale: cloud.scale }}
      animate={{ left: cloud.direction > 0 ? ["-30%", "130%"] : ["130%", "-30%"] }}
      transition={{ duration: cloud.duration, delay: cloud.delay, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full bg-[#fdf1da] blur-2xl" />
      <div className="absolute left-[15%] top-[15%] h-[65%] w-[55%] rounded-full bg-[#fdf1da] blur-2xl" />
      <div className="absolute right-[10%] top-[5%] h-[75%] w-[45%] rounded-full bg-[#fdf1da] blur-2xl" />
    </motion.div>
  );
}

function DuskClouds() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {DUSK_CLOUDS.map((cloud, i) => (
        <DuskCloudShape key={i} cloud={cloud} />
      ))}
    </div>
  );
}

function BackChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to celebration room"
      className="fixed left-3 top-3 z-30 flex h-11 items-center gap-1.5 rounded-full bg-[#fdf6ec]/80 py-2 pl-2.5 pr-4 text-sm text-[#6b4332] shadow-md shadow-[#6b4332]/20 transition-colors hover:bg-[#fdf6ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
    >
      <BackChevronIcon />
      Back
    </button>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Four-point sparkle silhouette — same simple geometric-star construction
// every other Birthday file's own sparklePath uses, reimplemented locally.
// Stands in for the ✨ this project's own no-emoji convention would
// otherwise rule out on the send confirmation below.
function sparklePath(size: number): string {
  const s = size;
  const inner = s * 0.15;
  return `M0,${-s} C${inner},${-inner} ${inner},${-inner} ${s},0 C${inner},${inner} ${inner},${inner} 0,${s} C${-inner},${inner} ${-inner},${inner} ${-s},0 C${-inner},${-inner} ${-inner},${-inner} 0,${-s} Z`;
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} width={size * 2} height={size * 2} aria-hidden="true">
      <path d={sparklePath(size)} fill="#e8b869" stroke="#c96a4f" strokeWidth={size * 0.08} />
    </svg>
  );
}

interface ShootingStarProps {
  star: StarConfig;
  caught: boolean;
  onCatch: () => void;
  onAnimationComplete: () => void;
}

// The transiting star itself — same shape
// interactive/ShootingStarWish.tsx's own button uses (trail + bright head
// core + pulsing discoverability ring + generous hit-area padding well
// past the visible streak), recolored to this file's own warm gold rather
// than V2's rose-gold #d4af7a.
function ShootingStar({ star, caught, onCatch, onAnimationComplete }: ShootingStarProps) {
  const rad = (star.angleDeg * Math.PI) / 180;
  const dx = star.travelDistance * Math.cos(rad);
  const dy = star.travelDistance * Math.sin(rad);
  const headX = star.trailLength * Math.cos(rad);
  const headY = star.trailLength * Math.sin(rad);
  // Hit area well over 2x the visible streak's own footprint, centered on
  // it — same reasoning interactive/ShootingStarWish.tsx documents: the
  // actual tap target needs to be far more forgiving than the thin
  // gradient line a viewer sees.
  const hitAreaSize = star.trailLength * 2.4;
  const gradientId = `wish-letter-star-${star.id}`;

  return (
    <motion.button
      key={star.id}
      type="button"
      onClick={onCatch}
      aria-label="Catch the shooting star"
      className="pointer-events-auto absolute flex items-center justify-center overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b869]"
      style={{ top: `${star.startTop}%`, left: `${star.startLeft}%`, width: hitAreaSize, height: hitAreaSize }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={caught ? CATCH_FLASH_ANIMATE : { x: dx, y: dy, opacity: [0, 1, 1, 0] }}
      transition={
        caught
          ? CATCH_FLASH_TRANSITION
          : {
            x: { duration: star.duration, ease: "easeOut" },
            y: { duration: star.duration, ease: "easeOut" },
            opacity: { duration: star.duration, times: [0, 0.12, 0.75, 1] },
          }
      }
      onAnimationComplete={onAnimationComplete}
    >
      {caught && (
        <motion.span
          aria-hidden="true"
          className="absolute rounded-full"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 2.2, 2.8] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            width: hitAreaSize * 0.5,
            height: hitAreaSize * 0.5,
            background: "radial-gradient(circle, rgba(253,243,223,0.9) 0%, rgba(232,184,105,0.5) 45%, transparent 75%)",
          }}
        />
      )}

      <svg width={star.trailLength} height={star.trailLength} className="overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={headX} y2={headY}>
            <stop offset="0%" stopColor="#e8b869" stopOpacity={0} />
            <stop offset="45%" stopColor="#e8b869" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#e8b869" stopOpacity={1} />
          </linearGradient>
        </defs>
        <line
          x1={0}
          y1={0}
          x2={headX}
          y2={headY}
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(232,184,105,0.85)) drop-shadow(0 0 8px rgba(232,184,105,0.4))" }}
        />
        <circle cx={headX} cy={headY} r={2.2} fill="#fdf3df" style={{ filter: "drop-shadow(0 0 3px rgba(253,243,223,0.9))" }} />
        <motion.circle
          cx={headX}
          cy={headY}
          r={4}
          fill="none"
          stroke="#e8b869"
          strokeWidth={1.5}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          style={{ transformOrigin: `${headX}px ${headY}px` }}
        />
      </svg>
    </motion.button>
  );
}

function noopSubscribe() {
  return () => { };
}

type WishModalPhase = "writing" | "releasing" | "sent";
const MAX_WISH_LENGTH = 280;
const RELEASE_DURATION_S = 0.95;
const SENT_HOLD_MS = 1500;

interface WishModalProps {
  onSend: () => void;
  onClose: () => void;
}

// A tiny 3-star constellation arc — the card's own decorative accent, in
// place of an earlier oversized quotation mark (that was part of the
// retired "paper letter" visual language; see this file's own WishModal
// doc comment below). Sits centered above the heading rather than pinned
// to a corner, since there's no second matching mark needed once the
// motif isn't a quote. Each dot twinkles on its own independent loop, same
// "staggered, not synced" idea this file's own AmbientStarfield/
// ProminentStars already use.
const CONSTELLATION_DOTS = [
  { x: 6, y: 15, size: 1.6, duration: 2.2, delay: 0 },
  { x: 30, y: 4, size: 2, duration: 2.6, delay: 0.5 },
  { x: 58, y: 12, size: 1.6, duration: 2.4, delay: 1 },
];

function CardConstellationAccent() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 20"
      width={64}
      height={20}
      className="pointer-events-none select-none"
    >
      <path d="M6,15 L30,4 L58,12" fill="none" stroke="#e8b869" strokeWidth={0.6} strokeLinecap="round" opacity={0.4} />
      {CONSTELLATION_DOTS.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.size}
          fill="#e8b869"
          style={{ filter: "drop-shadow(0 0 3px rgba(232,184,105,0.8))" }}
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

// Small gold sparkle accents at each corner of the card, standing in for
// message/SealedLetter.tsx's own oversized-quote-mark corner treatment —
// reused here as a much quieter "star-dot," not a busy pattern, per this
// card's own celestial redesign. Reuses this file's own sparklePath()
// bezier diamond (defined further below) rather than inventing a 3rd
// sparkle shape.
const CARD_CORNER_POSITIONS = [
  "left-2.5 top-2.5",
  "right-2.5 top-2.5",
  "left-2.5 bottom-2.5",
  "right-2.5 bottom-2.5",
] as const;

// Small hand-placed offsets (not generated) for the sparkle trail that
// scatters behind the card as it floats away — same "fixed, not random"
// reasoning every other small decorative set in this project's Birthday
// files gives. Spread loosely around the card's own centered footprint;
// each drifts further up than the last card position it "fell off of",
// with a staggered start so they read as a trail, not a single burst.
const RELEASE_SPARKLES = [
  { x: -70, y: 40, size: 7, delay: 0, rise: 130 },
  { x: 55, y: -30, size: 5, delay: 0.08, rise: 150 },
  { x: -30, y: -60, size: 6, delay: 0.16, rise: 170 },
  { x: 75, y: 60, size: 5, delay: 0.24, rise: 140 },
  { x: 10, y: 90, size: 6, delay: 0.32, rise: 160 },
];

// The letter-writing box — recolored from an earlier warm cream/paper
// letter aesthetic (checked message/SealedLetter.tsx / interactive/
// RevealCard.tsx for that vocabulary — paper grain, rose-gold border, an
// oversized quote mark) into a celestial card that belongs against the
// scene's own now much-darker cosmic sky: a deep plum/navy gradient
// coordinated with `skyGradient` above, a thin gold border with small
// corner star-dot accents and a 3-star constellation arc replacing the old
// quote mark, and a soft outer gold glow (see the card's own boxShadow
// below) — same "glowing softly against the night" idea this file's own
// shooting stars/prominent stars/DuskGlowOrb already establish. Still the
// same fixed+portal shape and amber-tinted scrim interactive/
// GiftUnwrap.tsx's own GiftReveal / interactive/BalloonReveal.tsx's own
// CompletionReveal already use — only the card's own colors/decoration
// changed, not its structure. Own phase machine
// (writing -> releasing -> sent) rather than props from the parent, since
// nothing about this sequence needs to survive a remount — each fresh
// catch mounts a brand-new instance (see WishLetter's own modalKey below),
// so a fresh "writing" start is already free.
//
// Phase machine fix: the card itself only ever renders while
// `phase !== "sent"` (unmounting cleanly the instant its own fly-away
// animation completes) rather than staying mounted with an animate target
// that reverts to "visible" once sent — that reversion was the earlier
// bug (the card would float up, then immediately snap back into place to
// show the confirmation inside itself, reading as "content just swapped
// in place" instead of a genuine release). The "Sent to the stars"
// confirmation is now a fully separate element, shown only once the card
// is gone, never layered inside the same box.
function WishModal({ onSend, onClose }: WishModalProps) {
  const [wishText, setWishText] = useState("");
  const [phase, setPhase] = useState<WishModalPhase>("writing");
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase === "writing") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, onClose]);

  useEffect(() => {
    if (phase !== "sent") return;
    const timeoutId = window.setTimeout(onClose, SENT_HOLD_MS);
    return () => window.clearTimeout(timeoutId);
  }, [phase, onClose]);

  // The ENTIRE point of this handler: the wish text is read once, to
  // decide whether Send is even allowed (see the disabled prop below), and
  // is then thrown away immediately — no fetch, no API route, no
  // localStorage, nothing written anywhere but this component's own
  // now-cleared local state. `onSend` (the parent's onWishSent) carries no
  // payload — the parent never sees the text either.
  function handleSend() {
    if (!wishText.trim()) return;
    onSend();
    setWishText("");
    setPhase("releasing");
  }

  return (
    isMounted &&
    createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(253,196,120,0.35)" }}
            onClick={() => phase === "writing" && onClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Sparkle trail — only while the card is actually flying away,
              positioned around the same centered point the card itself
              sits at, each rising/fading on its own staggered delay so
              they read as a trail left behind, not a synchronized burst. */}
          {phase === "releasing" && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {RELEASE_SPARKLES.map((sp, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ left: `calc(50% + ${sp.x}px)`, top: `calc(50% + ${sp.y}px)` }}
                  initial={{ opacity: 0, y: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], y: -sp.rise, scale: [0.4, 1, 0.6] }}
                  transition={{ duration: RELEASE_DURATION_S, delay: sp.delay, ease: "easeOut" }}
                >
                  <SparkleIcon size={sp.size} />
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {phase !== "sent" && (
              <motion.div
                key="wish-card"
                role="dialog"
                aria-modal="true"
                aria-label="Write a wish"
                initial={{ opacity: 0, scale: 0.92, y: 0, rotate: 0 }}
                animate={
                  phase === "releasing"
                    ? { opacity: 0, y: -180, scale: 0.72, rotate: -5 }
                    : { opacity: 1, scale: 1, y: 0, rotate: 0 }
                }
                transition={
                  phase === "releasing"
                    ? { duration: RELEASE_DURATION_S, ease: "easeIn" }
                    : { duration: 0.4, ease: "easeOut" }
                }
                onAnimationComplete={() => {
                  if (phase === "releasing") setPhase("sent");
                }}
                className="hide-scrollbar relative z-10 flex max-h-[85dvh] w-[90vw] max-w-sm flex-col items-center gap-4 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#e8b869]/35 px-6 py-8 text-center sm:px-8"
                style={{
                  background: "linear-gradient(165deg, #1a0f2e 0%, #26173f 55%, #2d1b4e 100%)",
                  boxShadow:
                    "0 0 55px 6px rgba(232,184,105,0.22), 0 0 100px 10px rgba(232,184,105,0.1), 0 25px 50px -12px rgba(2,1,10,0.65), inset 0 0 0 1px rgba(232,184,105,0.08)",
                }}
              >
                {/* Small gold star-dot accents at each corner — standing in
                    for the earlier oversized quote mark's own corner
                    presence, reused here as a much quieter celestial detail
                    (see CARD_CORNER_POSITIONS above for why). */}
                {CARD_CORNER_POSITIONS.map((position) => (
                  <svg
                    key={position}
                    aria-hidden="true"
                    viewBox="-4 -4 8 8"
                    width={7}
                    height={7}
                    className={`pointer-events-none absolute select-none opacity-55 ${position}`}
                    style={{ filter: "drop-shadow(0 0 2px rgba(232,184,105,0.7))" }}
                  >
                    <path d={sparklePath(4)} fill="#e8b869" />
                  </svg>
                ))}

                {phase === "writing" && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-[#e8d4b0]/60 transition-colors hover:bg-[#e8b869]/15 hover:text-[#fdf6ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b869]"
                  >
                    <CloseIcon />
                  </button>
                )}

                <div className="relative z-[1] flex w-full flex-col items-center gap-4">
                  <CardConstellationAccent />
                  <p className="font-display text-2xl font-medium text-[#e8b869] sm:text-3xl">What&rsquo;s your wish?</p>
                  <textarea
                    value={wishText}
                    onChange={(event) => setWishText(event.target.value.slice(0, MAX_WISH_LENGTH))}
                    disabled={phase !== "writing"}
                    placeholder="Write it here..."
                    rows={4}
                    maxLength={MAX_WISH_LENGTH}
                    aria-label="Your wish"
                    className="w-full resize-none rounded-xl border border-[#e8b869]/25 bg-[#12081f]/70 p-3 text-sm leading-relaxed text-[#fdf6ec] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] placeholder:text-[#c9a68a]/45 focus:outline-none focus-visible:border-[#e8b869]/70 focus-visible:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(232,184,105,0.4),0_0_14px_rgba(232,184,105,0.35)]"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!wishText.trim() || phase !== "writing"}
                    className="font-display flex min-h-11 items-center justify-center rounded-full border border-[#e8b869]/50 bg-gradient-to-b from-[#f3cf8e] to-[#c96a4f] px-9 py-3 text-base uppercase tracking-[0.2em] text-[#3d2419] shadow-lg shadow-[#150a24]/50 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b869] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0f2e] disabled:opacity-40"
                  >
                    Send
                  </button>
                  <p aria-hidden="true" className="text-[10px] uppercase tracking-[0.25em] text-[#c9a68a]/45">
                    Never saved — just yours, then the sky&rsquo;s
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation — a separate, brief moment over the still-visible
              scrim, never layered inside the card itself (see this file's
              own WishModal doc comment above for why that was the bug). */}
          <AnimatePresence>
            {phase === "sent" && (
              <motion.div
                key="wish-sent"
                role="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-2 text-center"
                style={{ filter: "drop-shadow(0 2px 6px rgba(61,36,25,0.35))" }}
              >
                <SparkleIcon />
                <p className="font-display text-xl font-medium text-[#fdf6ec]">Sent to the stars</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>,
      document.body,
    )
  );
}

export default function WishLetter({ onWishSent, onBack }: WishLetterProps) {
  const [star, setStar] = useState<StarConfig | null>(null);
  const [caught, setCaught] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Bumped every time a star is caught, then used as WishModal's own key —
  // a fresh key forces a genuine remount, which is what gives that
  // component's own phase/wishText a clean "writing" slate every time
  // without needing an effect to reset it.
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    let timeoutId = 0;
    const scheduleNext = () => {
      const delay = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      timeoutId = window.setTimeout(() => {
        setCaught(false);
        setStar((current) => randomStar((current?.id ?? 0) + 1));
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCatch = useCallback(() => {
    if (!star || caught) return;
    setCaught(true);
  }, [star, caught]);

  // Fires once the transiting star's own animate target (either the full
  // miss trajectory, or the shorter catch-flash) finishes — either way the
  // star's own lifecycle is over. Only a genuine catch opens the letter.
  // Missing a star has no penalty: it simply unmounts here, and the
  // scheduling loop above has already queued the next one.
  const handleAnimationComplete = useCallback(() => {
    const wasCaught = caught;
    setStar(null);
    if (wasCaught) {
      setModalKey((k) => k + 1);
      setShowModal(true);
    }
  }, [caught]);

  // Sky gradient — revised again from an earlier warm dusk-brown pass
  // (browns/ambers throughout) to this deeper near-black-to-plum cosmic
  // gradient for a clearer "night sky, not earth" read. Bottom stop
  // (#52258A) stays a warm-leaning violet rather than drifting into a true
  // blue, keeping it distinct from Anniversary V2's own flat navy
  // ambient/NightSky.tsx gradient — WishModal's own card below was
  // recolored to coordinate with these same stops.
  const skyGradient =
    "linear-gradient(180deg, #02010A 0%, #08041C 20%, #130632 40%, #23094E 60%, #38146B 80%, #52258A 100%)";
  return (
    <section
      className="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-10"
      style={{ background: skyGradient }}
    >
      {onBack && <BackButton onClick={onBack} />}

      <AmbientStarfield />
      <ProminentStars />
      <DuskClouds />
      <DuskGlowOrb />

      <p className="relative z-10 max-w-xs text-center text-xs uppercase tracking-[0.35em] text-[#fdf6ec]/80">
        Say your wish out loud this time
      </p>
      <p className="relative z-10 mt-3 max-w-[220px] text-center text-[10px] uppercase tracking-[0.25em] text-[#e8d4b0]/55">
        A star passes by every so often — catch one
      </p>

      {/* pointer-events-none at this wrapper level so the whole overlay
          never blocks anything else — only the star button itself
          (pointer-events-auto) is ever actually clickable. Same shape
          interactive/ShootingStarWish.tsx's own overlay uses. No
          aria-hidden here on the wrapper itself: it contains a genuinely
          interactive, keyboard/screen-reader-reachable button — only the
          purely-decorative "Catch it" hint text below gets its own
          aria-hidden, since it's redundant with that button's own
          aria-label. */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {star && (
          <ShootingStar star={star} caught={caught} onCatch={handleCatch} onAnimationComplete={handleAnimationComplete} />
        )}
        {star && (
          <motion.span
            key={`hint-${star.id}`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: caught ? 0 : [0, 1, 1, 0] }}
            transition={caught ? { duration: 0.3 } : { duration: star.duration, times: [0, 0.15, 0.7, 1] }}
            className="font-display absolute whitespace-nowrap text-xs uppercase tracking-[0.3em] text-[#e8b869]/90"
            style={{ top: `calc(${star.startTop}% + 28px)`, left: `${star.startLeft}%` }}
          >
            Catch it
          </motion.span>
        )}
      </div>

      {showModal && (
        <WishModal
          key={modalKey}
          onSend={() => onWishSent?.()}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import WishLetter from "@/components/birthdayShared/interactive/WishLetter";
//
// <WishLetter
//   onWishSent={() => setWishSent(true)}
//   onBack={() => setActiveView("hub")}
// />
//
// No SiteData field sourced here at all — unlike every sibling object,
// this one has no content to render FROM the site's own data (no message,
// no photos, no items), since the entire point is that the visitor writes
// something themselves and it's never kept. onBack is optional: omit it to
// keep this component fully standalone (no Back button renders, though
// there would then be no way back to a hub that doesn't exist either).
