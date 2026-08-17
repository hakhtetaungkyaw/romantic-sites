"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TypedPhrasesProps {
  phrases?: string[];
}

const TYPE_MS = 75;
const DELETE_MS = 30;
const PAUSE_MS = 2000;

function useTypewriter(phrases: string[]) {
  // Empty string on both server and first client paint — identical either
  // way, so there's nothing for hydration to mismatch on. The actual typing
  // loop only starts inside the effect, after mount. Untouched by this pass.
  const [text, setText] = useState("");

  useEffect(() => {
    if (phrases.length === 0) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex % phrases.length];

      if (!deleting) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeoutId = setTimeout(tick, PAUSE_MS);
          return;
        }
        timeoutId = setTimeout(tick, TYPE_MS);
      } else {
        charIndex -= 1;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex += 1;
          timeoutId = setTimeout(tick, TYPE_MS);
          return;
        }
        timeoutId = setTimeout(tick, DELETE_MS);
      }
    };

    timeoutId = setTimeout(tick, TYPE_MS);
    return () => clearTimeout(timeoutId);
  }, [phrases]);

  return text;
}

// ---- Ambient star/glow background — own local reimplementation of the
// enriched star technique built earlier this session for
// message/LetterCard.tsx, gallery/Magazine.tsx, and interactive/
// UnlockGate.tsx (same mulberry32 PRNG, same globals.css `twinkle`
// keyframe via CSS custom properties, same "featured star" tier — a
// brighter/bigger/glowing minority among plainer stars — same warm-white/
// gold color mix), not imported from any of them: per this project's
// architecture convention V2 files stay independent of each other's
// component code. Fully deterministic from a fixed seed, computed once at
// module scope — no Math.random() anywhere in this file. Untouched by this
// pass. ----
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

interface PhraseStar {
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

const PHRASE_STAR_COUNT = 50;
const PHRASE_STAR_WARM_WHITE = "#f7f2e7";
const PHRASE_STAR_GOLD = "#f2dfb0";

const PHRASE_STARS: PhraseStar[] = (() => {
  const rand = mulberry32(5117);
  return Array.from({ length: PHRASE_STAR_COUNT }, () => {
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
      color: rand() < 0.35 ? PHRASE_STAR_GOLD : PHRASE_STAR_WARM_WHITE,
    };
  });
})();

function PhraseAmbientStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PHRASE_STARS.map((star, i) => (
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
      <div
        className="absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:w-[50vw]"
        style={{ background: "radial-gradient(circle, rgba(212,175,122,0.13) 0%, rgba(212,175,122,0) 70%)" }}
      />
    </div>
  );
}

// Unique id so this file's grain filter can never collide with another SVG
// <filter> elsewhere on the page (message/LetterCard.tsx has its own,
// differently-named one).
const GRAIN_FILTER_ID = "typed-phrases-grain";

// ---- Corner ornament — elevated this pass from a single flat diamond into
// a small nested "jeweled" accent: a soft radiating glow, a larger dim
// outer diamond, and a smaller bright inner diamond on top, all in a richer
// (less desaturated/muted) gold than the previous single flat shape used.
// Same color family as gallery/Magazine.tsx's CornerOrnament, reimplemented
// fresh here rather than imported.
function CornerAccent({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const placement: Record<typeof position, string> = {
    tl: "-left-1.5 -top-1.5",
    tr: "-right-1.5 -top-1.5",
    bl: "-left-1.5 -bottom-1.5",
    br: "-right-1.5 -bottom-1.5",
  };
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${placement[position]} flex h-3.5 w-3.5 items-center justify-center`}
    >
      <span
        className="absolute inset-0 rounded-full blur-[3px]"
        style={{ background: "radial-gradient(circle, rgba(242,223,176,0.75) 0%, rgba(242,223,176,0) 75%)" }}
      />
      <span
        className="absolute h-3.5 w-3.5 rotate-45 rounded-[1px]"
        style={{ background: "linear-gradient(135deg, #f8e6b0 0%, #c9932f 100%)", opacity: 0.6 }}
      />
      <span
        className="relative h-1.5 w-1.5 rotate-45 rounded-[1px] bg-[#fdf3df]"
        style={{ boxShadow: "0 0 4px rgba(253,243,223,0.9)" }}
      />
    </span>
  );
}

// ---- Constellation heart — ten star points traced along a heart
// silhouette, connected in sequence by straight gold line segments (closing
// back to the first point), each drawing in via a staggered pathLength
// animation, each point popping in then settling into a continuous
// breathing pulse. Same technique built for interactive/UnlockGate.tsx
// earlier this session, reimplemented fresh here rather than imported, per
// V2's file-independence convention. Untouched by this pass. ----
const CONSTELLATION_POINTS: { x: number; y: number }[] = [
  { x: 50, y: 10 }, // top-center dip
  { x: 27, y: -2 }, // left lobe peak
  { x: 4, y: 15 }, // left upper outer
  { x: 0, y: 32 }, // left widest outer
  { x: 14, y: 55 }, // left lower descent
  { x: 50, y: 88 }, // bottom tip
  { x: 86, y: 55 }, // right lower descent
  { x: 100, y: 32 }, // right widest outer
  { x: 96, y: 15 }, // right upper outer
  { x: 73, y: -2 }, // right lobe peak
];

const CONSTELLATION_SEGMENTS = CONSTELLATION_POINTS.map((point, i) => {
  const next = CONSTELLATION_POINTS[(i + 1) % CONSTELLATION_POINTS.length];
  return { x1: point.x, y1: point.y, x2: next.x, y2: next.y };
});

const SEGMENT_STAGGER = 0.15;
const SEGMENT_DRAW_DURATION = 0.5;

function ConstellationHeart() {
  return (
    <>
      {CONSTELLATION_SEGMENTS.map((segment, i) => (
        <motion.line
          key={i}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke="#d4af7a"
          strokeWidth={0.8}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: SEGMENT_DRAW_DURATION, delay: i * SEGMENT_STAGGER, ease: "easeInOut" }}
          style={{
            filter: "drop-shadow(0 0 3px rgba(212,175,122,0.55)) drop-shadow(0 0 7px rgba(212,175,122,0.3))",
          }}
        />
      ))}

      {CONSTELLATION_POINTS.map((point, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * SEGMENT_STAGGER + SEGMENT_DRAW_DURATION * 0.6, ease: "easeOut" }}
          style={{ transformOrigin: `${point.x}px ${point.y}px` }}
        >
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={2.4}
            fill="#fdf3df"
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2.4 + (i % 4) * 0.3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              transformOrigin: `${point.x}px ${point.y}px`,
              filter: "drop-shadow(0 0 3px rgba(253,243,223,0.85))",
            }}
          />
        </motion.g>
      ))}
    </>
  );
}

// V2's typed-quote card — color and chrome enriched this pass:
//   - Border: was one thin gradient-padding line at reduced opacity
//     (from-[#d4af7a]/60 ... to-[#9c7a45]/60). Now a layered "double
//     border": an outer p-[3px] ring at a richer, fully-opaque gold
//     gradient with inset highlight/shadow (an embossed-metal read, not a
//     flat line), a small near-black gap ring, and a subtle 1px inset gold
//     line around the card itself — a visible reveal between two distinct
//     gold edges instead of one line.
//   - Fill: was a flat two-tone burgundy-to-black gradient. Now a 4-stop
//     blend (deep burgundy -> a plum/violet middle -> back toward burgundy
//     -> near-black) for tonal richness, plus a faint fractal-noise grain
//     (an inline SVG filter, no external asset) and a proper vignette
//     (warmest near the heart, darkening toward the card's own edges)
//     instead of the previous flat single top-half glow.
//   - CornerAccent: was one flat diamond; now a small nested "jeweled"
//     accent (radiating glow + dim outer diamond + bright inner diamond).
// The constellation heart, the "A promise, on repeat" label, the typed
// quote text, the divider line, and the typewriter logic are all
// byte-for-byte unchanged — text stays text-[#faf5f0] on a background that
// never lightens past mid-dark tones, so contrast holds regardless of the
// added texture/gradient richness.
export default function TypedPhrases({ phrases }: TypedPhrasesProps) {
  const text = useTypewriter(phrases ?? []);

  if (!phrases || phrases.length === 0) return null;

  return (
    <section className="relative overflow-hidden px-6 py-[120px]">
      <PhraseAmbientStars />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mb-10 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
      >
        A promise, on repeat
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-2xl rounded-2xl p-[3px]"
        style={{
          background: "linear-gradient(135deg, #e8c37a 0%, #f9ecc0 25%, #c99a3f 55%, #8a6a3c 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.35), 0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        <CornerAccent position="tl" />
        <CornerAccent position="tr" />
        <CornerAccent position="bl" />
        <CornerAccent position="br" />

        {/* Small near-black gap ring, then the card itself with its own
            subtle inset gold line — the "outer thin gold line + inner
            secondary line with a gap between them" double-border. */}
        <div className="rounded-[13px] bg-[#0d0509] p-[2px]">
          <div
            className="relative overflow-hidden rounded-[11px] px-8 py-14 text-center backdrop-blur-sm sm:px-14 sm:py-16"
            style={{
              background: "linear-gradient(160deg, #2b0f1a 0%, #3a1a35 38%, #23101d 68%, #0d0509 100%)",
              boxShadow: "inset 0 0 0 1px rgba(212,175,122,0.3)",
            }}
          >
            {/* Very faint fractal-noise grain — velvet/paper texture at a
                subtlety that adds tactile richness without ever competing
                with the text's own legibility. */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay"
            >
              <filter id={GRAIN_FILTER_ID}>
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.6 0" />
              </filter>
              <rect width="100%" height="100%" filter={`url(#${GRAIN_FILTER_ID})`} />
            </svg>

            {/* Warm glow centered where the heart sits (roughly the card's
                own upper fifth), fading out well before it reaches the
                quote text below — a vignette (darkening toward the card's
                own edges) layered underneath draws the eye back toward
                that same warm center instead of the frame. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(232,195,122,0.22) 0%, rgba(232,195,122,0) 55%)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(13,5,9,0.55) 100%)" }}
            />

            <motion.div
              aria-hidden="true"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 mx-auto mb-7 h-12 w-12 sm:h-14 sm:w-14"
            >
              <svg viewBox="0 0 100 90" className="h-full w-full overflow-visible">
                <ConstellationHeart />
              </svg>
            </motion.div>

            <p className="font-display relative z-10 min-h-[2.6em] text-2xl italic leading-relaxed text-[#faf5f0] sm:min-h-[2em] sm:text-3xl">
              {text}
              <span
                aria-hidden="true"
                className="typewriter-cursor ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] bg-[#d4af7a] align-middle"
              />
            </p>

            <div className="relative z-10 mx-auto mt-8 h-px w-16 bg-[#d4af7a]/40" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
