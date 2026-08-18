"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";

interface PetalOracleProps {
  /** Shown in the reveal card once all 7 petals are plucked. */
  revealMessage?: string;
}

// V1's counterpart to interactive/ConstellationGame.tsx (V2) and the first
// file V1 has ever needed in a components/shared/interactive/ category — no
// equivalent existed before this. Follows V1's own established visual
// language throughout (message/SealedLetter.tsx's cream/paper/terracotta
// reveal-card pattern, hero/GiftBoxUnlock.tsx's tap-invite glow), not V2's
// dark gold-locket RevealCard — the two templates' interactive moments are
// deliberately NOT meant to look like the same system reskinned.

const PETAL_COUNT = 7;
const FLOWER_SIZE = 260;

// Same 0.44/0.36/0.24 width/length/center ratios established in
// message/SealedLetter.tsx's SunflowerBloom and hero/GiftBoxUnlock.tsx's
// sticker — reused here so this flower's silhouette matches the sunflower
// motif already established elsewhere in V1, not a new one invented for
// this file. Unlike those two (fixed 10-petal decorative blooms), this
// flower has exactly PETAL_COUNT petals and every one is independently
// interactive.
const PETAL_WIDTH_RATIO = 0.44;
const PETAL_LENGTH_RATIO = 0.36;
const PETAL_CENTER_RATIO = 0.24;
const PETAL_ANGLES = Array.from({ length: PETAL_COUNT }, (_, i) => (360 / PETAL_COUNT) * i);

const DEFAULT_REVEAL_MESSAGE = "Every petal said the same thing: I love you, completely.";

// ---- Sunflower petal path — same bezier construction as
// message/SealedLetter.tsx's sunflowerPetalPath / hero/GiftBoxUnlock.tsx's
// stickerPetalPath (wide overlapping-base petals, a small rounded arc at
// the tip instead of a hard cusp — two beziers meeting at one point always
// reads as a spiky "ray," however wide the base is). Reimplemented locally
// rather than imported, per V1's file self-containment convention.
function sunflowerPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

interface DepartingPetal {
  index: number;
  angleDeg: number;
  dx: number;
  dy: number;
  rotateDelta: number;
  duration: number;
}

// True runtime randomness for a departing petal's own trajectory — safe
// without seeding: this only ever runs from inside handlePluck below, which
// only ever fires from a real click, never during SSR/first paint (same
// reasoning hero/GiftBoxUnlock.tsx's own PetalBurst documents for its
// click-triggered randomization).
function randomDeparture(index: number, angleDeg: number): DepartingPetal {
  const angleRad = (angleDeg * Math.PI) / 180;
  const distance = 130 + Math.random() * 70;
  return {
    index,
    angleDeg,
    dx: Math.sin(angleRad) * distance,
    // Blends outward radial motion (continuing whichever direction the
    // petal was already pointing) with a general downward gravity bias, so
    // even a petal from the flower's top half still ends up drifting down
    // rather than flying straight up off the screen.
    dy: -Math.cos(angleRad) * distance * 0.45 + 70 + Math.random() * 40,
    rotateDelta: (200 + Math.random() * 100) * (Math.random() < 0.5 ? -1 : 1),
    duration: 1.2 + Math.random() * 0.5,
  };
}

function noopSubscribe() {
  return () => {};
}

// Bootstrap Icons' "x-lg" glyph, inlined as raw path data — same technique
// message/SealedLetter.tsx's own CloseIcon uses, reimplemented locally.
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Deterministic paper-grain texture (feTurbulence is a fixed algorithm
// given a seed, not Math.random()-backed) — same technique
// message/SealedLetter.tsx's own PaperGrain uses, reimplemented locally.
function PaperGrain() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply"
    >
      <filter id="v1-petal-oracle-paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={11} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#v1-petal-oracle-paper-grain)" />
    </svg>
  );
}

const CHAR_DELAY = 0.014;
const REVEAL_BASE_DELAY = 0.25;

// Same letter-by-letter reveal + oversized drop-cap first letter
// message/SealedLetter.tsx's own TypewriterText uses, reimplemented locally.
function TypewriterText({ text }: { text: string }) {
  const characters = Array.from(text);
  return (
    <p className="font-display relative text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: REVEAL_BASE_DELAY + i * CHAR_DELAY }}
          className={
            i === 0
              ? "float-left mr-3 text-6xl font-medium leading-[0.8] text-[#d97a5f] sm:text-7xl"
              : undefined
          }
        >
          {char}
        </motion.span>
      ))}
    </p>
  );
}

export default function PetalOracle({ revealMessage = DEFAULT_REVEAL_MESSAGE }: PetalOracleProps) {
  // `plucked` drives BOTH which static petals render (hidden once plucked)
  // and the progress dots — a petal's index can only ever enter this set
  // once, so it doubles as "already used" for its own hit-target button.
  const [plucked, setPlucked] = useState<Set<number>>(new Set());
  const [flavorText, setFlavorText] = useState<string | null>(null);
  const [departingPetal, setDepartingPetal] = useState<DepartingPetal | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const flavorTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  const started = plucked.size > 0;
  const complete = plucked.size === PETAL_COUNT;

  // Dismissing the reveal (X button, backdrop click, or Escape) resets
  // plucked/flavorText/departingPetal along with showReveal — same
  // reset-on-close behavior interactive/ConstellationGame.tsx (V2)
  // establishes, so the flower is fully re-pluckable afterward instead of
  // staying stuck bare with no way to play again.
  const handleClose = useCallback(() => {
    setShowReveal(false);
    setPlucked(new Set());
    setFlavorText(null);
    setDepartingPetal(null);
  }, []);

  useEffect(() => {
    return () => {
      if (flavorTimeoutRef.current !== null) window.clearTimeout(flavorTimeoutRef.current);
      if (revealTimeoutRef.current !== null) window.clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  // Escape-to-close + body-scroll-lock while the reveal card is open — same
  // convention message/SealedLetter.tsx's own modal uses.
  useEffect(() => {
    if (!showReveal) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showReveal, handleClose]);

  // Gates the portal below to client-only render passes — document.body
  // doesn't exist during SSR. Same useSyncExternalStore hydration trick
  // message/SealedLetter.tsx's own `isMounted` uses.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  function handlePluck(index: number) {
    if (plucked.has(index)) return;

    const pluckNumber = plucked.size + 1; // 1-based count once this pluck lands
    const isFinal = pluckNumber === PETAL_COUNT;

    setPlucked((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    setDepartingPetal(randomDeparture(index, PETAL_ANGLES[index]));

    // The alternating "loves me"/"loves me not" flavor is purely for
    // suspense on the way there. The FINAL pluck is hard-coded to always
    // read positively regardless of what strict alternation would produce
    // — a deliberate, explicit override, not a side effect of PETAL_COUNT
    // happening to be odd. This is what makes the ending never depend on
    // chance (or on this constant being changed later): the `isFinal`
    // branch always wins, full stop.
    const text = isFinal ? "loves me" : plucked.size % 2 === 0 ? "loves me" : "loves me not";
    setFlavorText(text);
    if (flavorTimeoutRef.current !== null) window.clearTimeout(flavorTimeoutRef.current);
    flavorTimeoutRef.current = window.setTimeout(() => setFlavorText(null), 1400);

    if (isFinal) {
      revealTimeoutRef.current = window.setTimeout(() => setShowReveal(true), 1300);
    }
  }

  const center = FLOWER_SIZE / 2;
  const centerRadius = FLOWER_SIZE * PETAL_CENTER_RATIO;
  const petalLength = FLOWER_SIZE * PETAL_LENGTH_RATIO;
  const petalWidth = FLOWER_SIZE * PETAL_WIDTH_RATIO;
  // Hit circles sit over each petal's outer-middle area (not the flower's
  // hard edge) and are sized generously beyond the visible petal — but
  // capped below the ~78px gap between adjacent petal centers at this
  // radius, so neighboring hit zones don't swallow each other.
  const hitRadius = centerRadius * 0.5 + petalLength * 0.6;
  const hitSize = Math.max(52, petalWidth * 0.65);
  // Base/tip Y coordinates in the SAME unrotated local space
  // sunflowerPetalPath itself computes internally — needed here too so the
  // petal gradient's own axis (defined once, shared by every rotated petal
  // instance) lines up with each petal's actual base-to-tip direction.
  const baseOffset = centerRadius * 0.5;
  const petalBaseY = center - baseOffset;
  const petalTipY = petalBaseY - petalLength;
  const shadowRadius = centerRadius + petalLength * 0.55;

  return (
    <section className="relative px-6 py-[120px]">
      <div className="relative mx-auto flex max-w-[520px] flex-col items-center text-center">
        {/* Same caption treatment as hero/GiftBoxUnlock.tsx's "Tap to
            unwrap" / message/SealedLetter.tsx's "Tap to open" — identical
            text-xs/uppercase/tracking-[0.35em]/text-[#6b4332]/55 styling —
            and the same AnimatePresence-mount-while-not-started dismissal
            technique those two files use, rather than V2's opacity-toggle
            approach, so this reads as V1's own established pattern. */}
        <AnimatePresence>
          {!started && (
            <motion.p
              key="petal-oracle-caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6 text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
            >
              Pluck the petals, one by one
            </motion.p>
          )}
        </AnimatePresence>

        <div className="relative" style={{ width: FLOWER_SIZE, height: FLOWER_SIZE }}>
          {/* Idle "tap me" signal — soft glow pulse behind the flower plus
              a gentle whole-flower sway, same visual language as
              hero/GiftBoxUnlock.tsx's own tap-invite glow+idle-bob
              (reimplemented locally), active for as long as any petal
              remains unplucked. Deliberately absent from
              ambient/GoldenSkySection.tsx's PetalDrift, which stays purely
              decorative with no such affordance — this pulse/sway is what
              tells these petals apart from that ambient drift at a glance. */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(217,122,95,0.28) 0%, rgba(217,122,95,0) 70%)" }}
            animate={complete ? { opacity: 0 } : { opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 3, repeat: complete ? 0 : Infinity, ease: "easeInOut" }}
          />

          <motion.div
            animate={complete ? { rotate: 0 } : { rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 5, repeat: complete ? 0 : Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            <svg
              viewBox={`0 0 ${FLOWER_SIZE} ${FLOWER_SIZE}`}
              width={FLOWER_SIZE}
              height={FLOWER_SIZE}
              className="overflow-visible"
              aria-hidden="true"
            >
              <defs>
                {/* Base(deep amber #f0a05c)->tip(gold #FFC800) gradient,
                    same warm stops GoldenSkySection.tsx's own Sun/LightRays
                    use elsewhere in V1. Defined once in the petals' shared
                    UNROTATED local axis (userSpaceOnUse, not
                    objectBoundingBox) — since each petal <path> below is
                    positioned by its own `transform="rotate(...)"` rather
                    than by different path coordinates, this single
                    gradient definition rotates along with whichever petal
                    references it and reads base-to-tip correctly at every
                    angle, with no need for a separate gradient per petal. */}
                <linearGradient
                  id="v1-petal-oracle-petal-gradient"
                  x1={center}
                  y1={petalBaseY}
                  x2={center}
                  y2={petalTipY}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#f0a05c" />
                  <stop offset="100%" stopColor={SUNFLOWER_PETAL_COLOR} />
                </linearGradient>

                <radialGradient id="v1-petal-oracle-disc-gradient" cx="42%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#8c5030" />
                  <stop offset="100%" stopColor={SUNFLOWER_CENTER_COLOR} />
                </radialGradient>

                <filter id="v1-petal-oracle-shadow-blur" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>

              {/* Soft warm grounding shadow behind the whole cluster —
                  drawn first (so it paints behind every petal + the disc),
                  offset slightly down and squashed so it reads as a cast
                  shadow rather than a second disc. */}
              <ellipse
                cx={center}
                cy={center + 6}
                rx={shadowRadius}
                ry={shadowRadius * 0.5}
                fill="#6b4332"
                opacity={0.22}
                filter="url(#v1-petal-oracle-shadow-blur)"
              />

              {/* Each petal gets its own thin warm-brown stroke in addition
                  to the gradient fill above — this is what fixes the
                  "shapeless blob" bug: the underlying sunflowerPetalPath
                  geometry was never actually malformed (it's the same
                  proven bezier construction message/SealedLetter.tsx's
                  SunflowerBloom and hero/GiftBoxUnlock.tsx's sticker use),
                  but a single isolated petal — no longer surrounded by
                  overlapping neighbors whose edges give the eye a contrast
                  reference — rendered as one flat, unbroken #FFC800 fill
                  with no boundary definition of its own, especially against
                  the similarly warm-toned blurred glow behind it. The
                  stroke + gradient together give every petal a crisp,
                  self-contained silhouette that reads as "petal" whether
                  it's one of seven or the very last one remaining. */}
              {PETAL_ANGLES.map((angle, i) =>
                !plucked.has(i) ? (
                  <path
                    key={i}
                    d={sunflowerPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
                    fill="url(#v1-petal-oracle-petal-gradient)"
                    stroke="rgba(107,67,50,0.3)"
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                    transform={`rotate(${angle} ${center} ${center})`}
                  />
                ) : null,
              )}

              {departingPetal && (
                <motion.g
                  key={departingPetal.index}
                  initial={{ x: 0, y: 0, rotate: departingPetal.angleDeg, opacity: 1 }}
                  animate={{
                    x: departingPetal.dx,
                    y: departingPetal.dy,
                    rotate: departingPetal.angleDeg + departingPetal.rotateDelta,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: departingPetal.duration, ease: "easeIn" }}
                  style={{ transformOrigin: `${center}px ${center}px` }}
                  onAnimationComplete={() =>
                    setDepartingPetal((current) => (current?.index === departingPetal.index ? null : current))
                  }
                >
                  <path
                    d={sunflowerPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
                    fill="url(#v1-petal-oracle-petal-gradient)"
                    stroke="rgba(107,67,50,0.3)"
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                  />
                </motion.g>
              )}

              <circle cx={center} cy={center} r={centerRadius} fill="url(#v1-petal-oracle-disc-gradient)" />
            </svg>
          </motion.div>

          {/* Real <button> hit targets, one per still-attached petal —
              generously padded beyond the visible petal shape (same
              standard interactive/ShootingStarWish.tsx and
              interactive/ConstellationGame.tsx, both V2, hold their own
              star hit-areas to), positioned via trigonometry rather than
              inside the SVG so they stay simple HTML buttons (real
              accessible tap targets, no foreignObject needed). */}
          {PETAL_ANGLES.map((angle, i) => {
            if (plucked.has(i)) return null;
            const angleRad = (angle * Math.PI) / 180;
            const hitX = center + hitRadius * Math.sin(angleRad);
            const hitY = center - hitRadius * Math.cos(angleRad);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePluck(i)}
                aria-label="Pluck a petal"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
                style={{ left: hitX, top: hitY, width: hitSize, height: hitSize }}
              />
            );
          })}

          <AnimatePresence mode="wait">
            {flavorText && (
              <motion.span
                key={`${flavorText}-${plucked.size}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="font-display pointer-events-none absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap text-2xl italic text-[#6b4332] sm:text-3xl"
              >
                {flavorText}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal progress cue — small dots, not a HUD-style bar. Same
            "one per unit, filled as reached" convention
            interactive/ConstellationGame.tsx (V2) uses, reimplemented here
            in V1's own warm terracotta (#d97a5f) rather than V2's gold. */}
        <div aria-hidden="true" className="mt-14 flex justify-center gap-2">
          {PETAL_ANGLES.map((_, i) => {
            const filled = plucked.has(i);
            return (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: filled ? "#d97a5f" : "rgba(107,67,50,0.25)",
                  boxShadow: filled ? "0 0 5px 1px rgba(217,122,95,0.6)" : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Portaled to document.body, same technique + reasoning as
          message/SealedLetter.tsx's own modal: a `position: fixed`
          descendant needs to escape this section's own local stacking
          order entirely to guarantee a correct full-viewport overlay
          regardless of whatever ancestor context it ends up placed inside
          once wired into the page. */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {showReveal && (
              <motion.div
                className="fixed inset-0 z-40 flex items-center justify-center p-6"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                {/* Warm amber-tinted scrim (same rgba(253,196,120,...)
                    family ambient/GoldenSkySection.tsx's own Sun/LightRays
                    glows use) instead of a neutral dark brown/grey dimmer —
                    reads as part of V1's golden-hour world rather than a
                    generic modal backdrop. */}
                <motion.div
                  className="absolute inset-0 backdrop-blur-sm"
                  style={{ background: "rgba(253,196,120,0.35)" }}
                  onClick={handleClose}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="A petal's answer"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative z-10 max-h-[88dvh] w-[90vw] max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl border border-[#c9a68a]/60 bg-[#fdf6ec] px-8 py-10 shadow-[0_25px_50px_-12px_rgba(107,67,50,0.25),inset_0_0_0_1px_rgba(255,251,244,0.5)] sm:px-12 sm:py-16"
                >
                  <PaperGrain />

                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#4a2f26]/50 transition-colors hover:bg-[#c9a68a]/15 hover:text-[#4a2f26]"
                  >
                    <CloseIcon />
                  </button>

                  <span
                    aria-hidden="true"
                    className="font-display pointer-events-none absolute left-4 top-0 overflow-hidden select-none text-8xl leading-none text-[#c9a68a]/30 sm:left-6 sm:text-9xl"
                  >
                    &ldquo;
                  </span>

                  <TypewriterText text={revealMessage} />

                  <span
                    aria-hidden="true"
                    className="font-display pointer-events-none absolute bottom-0 right-4 overflow-hidden select-none text-8xl leading-none text-[#c9a68a]/30 sm:right-6 sm:text-9xl"
                  >
                    &rdquo;
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}

// ---- Usage (not yet wired into any page) -----------------------------------
// import PetalOracle from "@/components/shared/interactive/PetalOracle";
//
// <PetalOracle revealMessage="Every petal said the same thing: I love you, completely." />
//
// Suggested placement in components/templates/AnniversaryV1.tsx: after
// <SunflowerCountdown /> and before <SunsetSignature /> — keeps it clear of
// the opening beats (GoldenSkySection/SunsetHero) and of SealedLetter (V1's
// other "unwrap something" moment), so the two don't read as back-to-back
// repeats of the same gesture; landing it right before the closing
// signature mirrors how interactive/ConstellationGame.tsx (V2) was placed
// right before that template's own closing section.
//
// Message sourcing: message/SealedLetter.tsx sources its own reveal text
// from SiteData.message (types/site.ts). AnniversaryV1.tsx currently
// destructures only { people, groupTitle, title, message, specialDate,
// photos, closingLine, milestones, songs } from SiteData — secretNote is
// not used anywhere in the V1 template today, making it the natural,
// still-distinct field for this component once wired:
//   <PetalOracle revealMessage={secretNote} />
// DEFAULT_REVEAL_MESSAGE above is the fallback for whenever that field is
// unset for a given order.
