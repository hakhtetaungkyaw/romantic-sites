"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";

import RevealCard from "@/components/shared/interactive/RevealCard";

interface ConstellationGameProps {
  /** Shown in the reveal card once all 6 stars are connected in order. */
  revealMessage?: string;
  /** Sourced from `SiteData.constellationRevealPhoto` (types/site.ts) — a
   *  dedicated field, not an index into `SiteData.photos[]`. That array is
   *  the gallery/Magazine.tsx's own full-array gallery, so any index
   *  reused here would always duplicate a photo the customer already sees
   *  there. This component itself stays agnostic to where the URL comes
   *  from; templates/AnniversaryV2.tsx does the actual sourcing. */
  photoUrl?: string;
}

// ---- Star layout ---------------------------------------------------------
// Base sampling is the same 7-point set (even 2π/7 ≈ 51.43° increments,
// t = k·2π/7 for k=0..6) off the classic parametric heart curve
// x=16sin³t, y=13cos t − 5cos 2t − 2cos 3t − cos 4t, scaled/centered into an
// 800x500 coordinate space (scale 12.5, origin (400,250), y negated since
// SVG y grows downward while the curve's math-y grows upward) — this wider
// spread reads more naturally than the tighter even-60° 6-point sampling
// tried earlier. Of those 7 points, k=3 (t=154.29°, (416,427)) and k=4
// (t=205.71°, (384,427)) land almost on top of each other, straddling the
// bottom tip only 32px apart — k=4 is dropped, keeping k=3 as the single
// bottom-tip star, which is what brings the count back down to 6.
// Sweeping k=0,1,2,3,5,6 in order still traces one continuous pen path
// around the silhouette — cusp -> upper-right lobe -> right descent ->
// bottom tip -> left descent -> upper-left lobe -> (closes back to cusp) —
// so the hidden tap order still reads as "around the outline," the same
// discoverable shape as before.
interface Point {
  x: number;
  y: number;
}

const CANVAS_W = 800;
const CANVAS_H = 500;

const STAR_SEQUENCE: Point[] = [
  { x: 400, y: 188 }, // k=0, t=0° — cusp (top-center dip)
  { x: 496, y: 101 }, // k=1, t=51.43° — upper-right lobe
  { x: 585, y: 253 }, // k=2, t=102.86° — right descent
  { x: 416, y: 427 }, // k=3, t=154.29° — bottom tip (k=4's near-duplicate dropped)
  { x: 215, y: 253 }, // k=5, t=257.14° — left descent
  { x: 304, y: 101 }, // k=6, t=308.57° — upper-left lobe
];

const STAR_COUNT = STAR_SEQUENCE.length;

// Four-point sparkle silhouette (24x24 viewBox) — lucide-react's own
// "Sparkle" icon path (already a project dependency, same source
// lucide-react ships for its <Sparkle> component), reproduced here as a
// bare path rather than the component so fill can be a gradient, opacity
// and drop-shadow filter can vary per star, and it stays a plain inline SVG
// consistent with how every other shape in this file (lines, ambient
// stars) is hand-drawn. Its outer tips AND inner waist corners are both
// drawn with elliptical-arc (`a`) segments, not straight lines — that's
// what gives the concave notches between points a genuine curve rather
// than a sharp diamond/rhombus angle. interactive/RevealCard.tsx keeps its
// own separate copy of this same path for its divider sparkle — not
// imported from here, per this project's convention of feature files
// staying independent of each other's implementation details.
const SPARKLE_PATH =
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";

// ---- Ambient background starfield ----------------------------------------
// Deterministic mulberry32 PRNG, computed once at module scope from a fixed
// seed — identical on server and client, so this needs no
// useSyncExternalStore/client-only gating to stay hydration-safe (the same
// technique UnlockGate.tsx's GATE_STARS and ambient/NightSky.tsx's STARS
// already use). A fresh local copy rather than an import from either of
// those files, per this project's rule that V2 component files never share
// code with each other.
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

const AMBIENT_STAR_COUNT = 55;

const AMBIENT_STARS: AmbientStar[] = (() => {
  const rand = mulberry32(6100);
  return Array.from({ length: AMBIENT_STAR_COUNT }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 1.4,
    minOpacity: 0.15 + rand() * 0.1,
    maxOpacity: 0.45 + rand() * 0.25,
    duration: 2.2 + rand() * 2.4,
    delay: rand() * 5,
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
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// ---- Interaction feedback -------------------------------------------------
const SHAKE_KEYFRAMES = { x: [0, -6, 6, -5, 5, -3, 3, 0], scale: 1 };
const SHAKE_TRANSITION = { duration: 0.45, ease: "easeInOut" as const };

const HINT_PULSE = { scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8], x: 0 };
const HINT_TRANSITION = { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const };

const REST_STATE = { x: 0, scale: 1, opacity: 1 };
const REST_TRANSITION = { duration: 0.2 };

const SEGMENT_DRAW_DURATION = 0.5;
const CLOSING_SEGMENT_DELAY = 0.35;
// Long enough for the final real segment (0.5s) plus the closing segment
// (starts 0.35s in, also takes 0.5s) to both finish drawing before the
// reveal card fades in on top of them.
const REVEAL_DELAY_MS = 1000;

const DEFAULT_REVEAL_MESSAGE =
  "ကြယ်တွေကြားက ရှာဖွေတွေ့ရှိလိုက်တဲ့ ချစ်ခြင်းမေတ္တာ — မင်းအတွက်ပဲ ရေးထားတဲ့ ငါ့နှလုံးသားလေး။";

export default function ConstellationGame({
  revealMessage = DEFAULT_REVEAL_MESSAGE,
  photoUrl,
}: ConstellationGameProps) {
  // `connected` = how many stars have been tapped correctly, in order, so
  // far (0-6). The next required tap is always STAR_SEQUENCE[connected] —
  // never shown to the player, just enforced.
  const [connected, setConnected] = useState(0);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const solved = connected === STAR_COUNT;

  const handleStarTap = useCallback(
    (index: number) => {
      if (solved) return;

      if (index === connected) {
        const next = connected + 1;
        setConnected(next);
        setShakeIndex(null);
        if (next === STAR_COUNT) {
          window.setTimeout(() => setShowReveal(true), REVEAL_DELAY_MS);
        }
        return;
      }

      // Wrong star: no message, no penalty — just a gentle shake so the
      // player naturally keeps exploring for the right next one.
      setShakeIndex(index);
    },
    [connected, solved],
  );

  // Dismissing the reveal (X button or backdrop click) clears connected/
  // shakeIndex along with showReveal — otherwise `solved` stays permanently
  // true (handleStarTap's early-return never releases), leaving the heart
  // stuck fully drawn with no way to play again.
  const handleCloseReveal = useCallback(() => {
    setShowReveal(false);
    setConnected(0);
    setShakeIndex(null);
  }, []);

  const getStarAnimate = (index: number) => {
    if (shakeIndex === index) return SHAKE_KEYFRAMES;
    if (index === 0 && connected === 0) return HINT_PULSE;
    return REST_STATE;
  };

  const getStarTransition = (index: number) => {
    if (shakeIndex === index) return SHAKE_TRANSITION;
    if (index === 0 && connected === 0) return HINT_TRANSITION;
    return REST_TRANSITION;
  };

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col items-center gap-4">
      {/* Same caption treatment as interactive/UnlockGate.tsx's "Tap to
          open" / message/LetterCard.tsx's "Tap to unroll" — dims out (not
          unmounted, so nothing shifts layout) once the player makes their
          first correct tap, rather than sitting there once the mechanic is
          already understood. */}
      <motion.p
        animate={{ opacity: connected === 0 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs uppercase tracking-[0.35em] text-[#d4af7a]/80"
      >
        Follow the stars, one by one
      </motion.p>

      {/* No boxed panel here on purpose — a flat rounded rectangle with its
          own border/background read as a discrete widget dropped onto the
          page rather than part of the surrounding night sky. Only a soft
          center-weighted vignette remains (rgba(26,10,18,...), the same
          #1a0a12 token AnniversaryV2.tsx's own page-level background
          gradient starts from), fading fully to transparent well before the
          edges — no straight border line anywhere — so the starfield reads
          as continuous with the page behind it. */}
      <div className="relative aspect-[8/5] w-full overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(26,10,18,0.5) 0%, rgba(26,10,18,0.2) 55%, transparent 82%)",
          }}
        />

        <AmbientStars />

      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {STAR_SEQUENCE.slice(1, connected).map((point, i) => {
          const prev = STAR_SEQUENCE[i];
          return (
            <motion.line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={point.x}
              y2={point.y}
              stroke="#d4af7a"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: SEGMENT_DRAW_DURATION, ease: "easeInOut" }}
              style={{
                filter:
                  "drop-shadow(0 0 4px rgba(212,175,122,0.6)) drop-shadow(0 0 9px rgba(212,175,122,0.35))",
              }}
            />
          );
        })}

        {solved && (
          <motion.line
            x1={STAR_SEQUENCE[STAR_COUNT - 1].x}
            y1={STAR_SEQUENCE[STAR_COUNT - 1].y}
            x2={STAR_SEQUENCE[0].x}
            y2={STAR_SEQUENCE[0].y}
            stroke="#d4af7a"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: SEGMENT_DRAW_DURATION,
              delay: CLOSING_SEGMENT_DELAY,
              ease: "easeInOut",
            }}
            style={{
              filter:
                "drop-shadow(0 0 4px rgba(212,175,122,0.6)) drop-shadow(0 0 9px rgba(212,175,122,0.35))",
            }}
          />
        )}
      </svg>

      {STAR_SEQUENCE.map((point, i) => {
        const isConnected = i < connected;
        const gradientId = `sparkle-fill-${i}`;
        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => handleStarTap(i)}
            aria-label="Constellation star"
            aria-pressed={isConnected}
            animate={getStarAnimate(i)}
            transition={getStarTransition(i)}
            style={{ left: `${(point.x / CANVAS_W) * 100}%`, top: `${(point.y / CANVAS_H) * 100}%` }}
            className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af7a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0a12] sm:h-11 sm:w-11"
          >
            {/* Same layered rgba(212,175,122,...) glow as the connecting
                lines/reveal card elsewhere in this file, applied as
                drop-shadow so it follows the sparkle's actual silhouette
                instead of a bounding box. */}
            <svg
              viewBox="0 0 24 24"
              className="h-full w-full"
              style={{
                filter: isConnected
                  ? "drop-shadow(0 0 4px rgba(212,175,122,0.6)) drop-shadow(0 0 9px rgba(212,175,122,0.35))"
                  : "drop-shadow(0 0 4px rgba(247,242,231,0.35))",
              }}
            >
              <defs>
                <radialGradient id={gradientId} cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="#fdf3df" />
                  <stop offset="100%" stopColor="#d4af7a" />
                </radialGradient>
              </defs>
              <path
                d={SPARKLE_PATH}
                fill={isConnected ? `url(#${gradientId})` : "#f7f2e7"}
                opacity={isConnected ? 1 : 0.6}
              />
            </svg>
          </motion.button>
        );
      })}

      {/* Minimal progress cue — small dots, not a HUD-style bar. One per
          star, filling solid gold (with the same glow language as the
          connected star dots above) as each is reached in order. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2"
      >
        {STAR_SEQUENCE.map((_, i) => {
          const filled = i < connected;
          return (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: filled ? "#d4af7a" : "rgba(247,242,231,0.3)",
                boxShadow: filled ? "0 0 6px 1px rgba(212,175,122,0.7)" : "none",
              }}
            />
          );
        })}
      </div>

      <RevealCard isOpen={showReveal} onClose={handleCloseReveal} message={revealMessage} photoUrl={photoUrl} />
      </div>
    </div>
  );
}

// ---- Usage (not yet wired into any page) ----------------------------------
// import ConstellationGame from "@/components/shared/interactive/ConstellationGame";
//
// <ConstellationGame
//   revealMessage={secretNote}
//   photoUrl={constellationRevealPhoto}
// />
//
// Suggested placement in components/templates/AnniversaryV2.tsx: after
// <PlacesWeveBeen places={places} /> and before <Signature ... />.
// PlacesWeveBeen is the last "content" beat before the closing signature, so
// a short interactive game right before the final goodbye reads as one last
// surprise rather than interrupting the earlier narrative flow (hero ->
// countdown -> typed phrases -> letter -> night sky -> gallery -> timeline
// -> places -> [game here] -> signature).
