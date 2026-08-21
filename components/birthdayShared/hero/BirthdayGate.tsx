"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import confettiAnimation from "@/public/animations/confetti.json";

// Birthday V1 "Celebration Room" opening gate — the same "wrap children,
// gate them behind an `opened` flag, lock body scroll until then" mechanism
// as hero/GiftBoxUnlock.tsx (Anniversary V1) and interactive/UnlockGate.tsx
// (Anniversary V2), reimplemented fully locally: nothing here imports from
// components/shared/ or any lib/v1*.ts Anniversary constants module, per
// this project's product-line isolation principle. Superseded
// interactive/CakeWish.tsx entirely — that file's flat/plain cake and its
// "blow out candles -> reveal card" role are both gone; this gate is a pure
// entrance transition with a freshly designed, more dimensional cake, no
// reveal card of its own.
//
// Confetti burst: same `public/animations/confetti.json` asset and
// `lottie-react` loading pattern closing/GrandFinale.tsx's own end-of-
// experience burst uses (loop={false} autoplay — a discrete one-shot beat,
// not looping rain) — this is a SEPARATE playback of that file, not shared
// state with GrandFinale's own instance; the two moments are independent
// and both keep working on their own. The asset's own natural duration is
// ~5s (126 frames at 25fps), far longer than this gate's own candles-out ->
// dim -> fade-to-Room sequence should take, so this doesn't wait for it to
// finish — it starts the gate's own 0.8s cross-fade exit a beat after the
// confetti launches (CONFETTI_LEAD_MS below), letting the burst's initial
// launch/spread read clearly while its slower-settling tail gets cut off by
// the fade rather than forcing the whole sequence to stall for ~5s.

interface BirthdayGateProps {
  children: ReactNode;
  onOpen?: () => void;
  age?: number;
  personName?: string;
}

type Stage = "greeting" | "building" | "lit" | "blowing";

const MAX_CANDLES = 12;
const DEFAULT_CANDLE_COUNT = 5;

// ---- Timings ----
const GREETING_HOLD_MS = 1400;
const TOP_TIER_DELAY_S = 0.3;
const CANDLES_START_DELAY_S = TOP_TIER_DELAY_S + 0.55;
const CANDLE_DROP_STAGGER_S = 0.14;
const CANDLE_FLAME_EXTRA_DELAY_S = 0.35;
const TIER_SPRING = { type: "spring" as const, stiffness: 260, damping: 18 };
const CANDLE_SPRING = { type: "spring" as const, stiffness: 300, damping: 16 };
const EXTINGUISH_DURATION_S = 0.5;
const EXTINGUISH_STAGGER_S = 0.18;
const DIM_HOLD_MS = 700;
// How long the confetti burst gets to play on its own before the gate
// starts fading out over it — short enough to stay snappy, long enough to
// see the actual burst (not just its very first frame).
const CONFETTI_LEAD_MS = 900;
// Gate's own exit fade lives directly on its <motion.div exit> transition
// below, matching hero/GiftBoxUnlock.tsx's own convention of keeping that
// one duration as a literal there rather than a constant here.

// ---- Cake geometry (local viewBox, not derived from anything shared) ----
const CAKE_W = 240;
const CAKE_H = 220;

const STAND_CY = 205;
const STAND_RX = 112;
const STAND_RY = 13;

const BOTTOM_TIER = { x: 25, y: 142, w: 190, h: 55, rx: 10 };
const BOTTOM_FROSTING = { x: 20, w: 200, baseY: 134, capHeight: 14, waveCount: 7, waveHeight: 5 };

const TOP_TIER = { x: 65, y: 92, w: 110, h: 48, rx: 9 };
const TOP_FROSTING = { x: 60, w: 120, baseY: 85, capHeight: 12, waveCount: 5, waveHeight: 4 };

const CANDLE_BASE_Y = TOP_FROSTING.baseY;
const CANDLE_HEIGHT = 26;
const CANDLE_TOP_Y = CANDLE_BASE_Y - CANDLE_HEIGHT;
const FLAME_HEIGHT = 12;
const FLAME_WIDTH = 7;

// ---- Piped-frosting wavy top edge — a series of quadratic-curve humps
// across the band's width, closing into a flat-bottomed ribbon shape. This
// is what item 2 of the visual-upgrade spec asks for in place of
// interactive/CakeWish.tsx's straight-edged frosting strip.
function frostingWavePath(x: number, baseY: number, width: number, waveCount: number, waveHeight: number, capHeight: number): string {
  const segment = width / waveCount;
  let path = `M${x},${baseY}`;
  for (let i = 0; i < waveCount; i++) {
    const midX = x + i * segment + segment / 2;
    const endX = x + (i + 1) * segment;
    path += ` Q${midX},${baseY - waveHeight} ${endX},${baseY}`;
  }
  path += ` L${x + width},${baseY + capHeight} L${x},${baseY + capHeight} Z`;
  return path;
}

// ---- Flame silhouette — pointed tip, rounded base on the wick. Same
// self-contained-boundary principle already applied in
// interactive/CakeWish.tsx (itself carried over from fixing
// interactive/PetalOracle.tsx's isolated-petal bug): every flame gets its
// own gradient fill + stroke, not just a shared glow behind it.
function flamePath(cx: number, tipY: number, height: number, width: number): string {
  const w = width / 2;
  const baseY = tipY + height;
  const midY = tipY + height * 0.62;
  return `M${cx},${tipY} C${cx + w},${tipY + height * 0.3} ${cx + w * 0.75},${midY} ${cx},${baseY} C${cx - w * 0.75},${midY} ${cx - w},${tipY + height * 0.3} ${cx},${tipY} Z`;
}

// Fixed, hand-placed confetti-sprinkle positions (not Math.random()) — same
// reasoning as every other V1-family sprinkle/jitter arrangement in this
// project: needs to look hand-decorated, not regenerate a different layout
// every session. Mix of small rounded rects and ovals, varied rotation and
// warm-palette color, across both frosting bands.
const SPRINKLES: { x: number; y: number; rotate: number; color: string; shape: "rect" | "oval" }[] = [
  { x: 38, y: 139, rotate: 15, color: "#d97a5f", shape: "rect" },
  { x: 55, y: 136, rotate: -22, color: "#FFC800", shape: "oval" },
  { x: 78, y: 140, rotate: 34, color: "#c9a68a", shape: "rect" },
  { x: 100, y: 137, rotate: -8, color: "#e8a598", shape: "oval" },
  { x: 128, y: 139, rotate: 20, color: "#FFC800", shape: "rect" },
  { x: 152, y: 136, rotate: -30, color: "#d97a5f", shape: "oval" },
  { x: 175, y: 140, rotate: 10, color: "#c9a68a", shape: "rect" },
  { x: 198, y: 137, rotate: -18, color: "#e8a598", shape: "oval" },
  { x: 72, y: 90, rotate: 12, color: "#c9a68a", shape: "rect" },
  { x: 92, y: 88, rotate: -25, color: "#d97a5f", shape: "oval" },
  { x: 118, y: 91, rotate: 28, color: "#FFC800", shape: "rect" },
  { x: 142, y: 88, rotate: -14, color: "#e8a598", shape: "oval" },
  { x: 165, y: 90, rotate: 18, color: "#c9a68a", shape: "rect" },
];

const IDLE_FLICKER = { scaleY: [1, 1.12, 0.94, 1.05, 1], opacity: [0.9, 1, 0.85, 0.95, 0.9] };
const IDLE_TRANSITION = { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const };
const EXTINGUISH_KEYFRAMES = { scaleY: [1, 1.5, 0.3, 0], opacity: [1, 1, 0.6, 0] };

function CakeIllustration({ candleCount, stage }: { candleCount: number; stage: Stage }) {
  const isLit = stage === "lit";
  const candleXs =
    candleCount === 1
      ? [CAKE_W / 2]
      : Array.from({ length: candleCount }, (_, i) => 78 + i * (84 / (candleCount - 1)));

  return (
    <svg viewBox={`0 0 ${CAKE_W} ${CAKE_H}`} width={CAKE_W} height={CAKE_H} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="birthday-gate-tier-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e4c3" />
          <stop offset="100%" stopColor="#d9a877" />
        </linearGradient>
        <linearGradient id="birthday-gate-frosting-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#fdf6ec" />
        </linearGradient>
        <linearGradient id="birthday-gate-stand-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#e8d4b0" />
        </linearGradient>
        <linearGradient id="birthday-gate-flame-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="30%" stopColor="#fde7b8" />
          <stop offset="70%" stopColor="#f9c97c" />
          <stop offset="100%" stopColor="#f0a05c" />
        </linearGradient>
        <filter id="birthday-gate-shadow-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="birthday-gate-flame-glow-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Item 5: soft ambient shadow beneath the whole cake, distinct from
          (and larger/softer than) the tighter stand shadow below — grounds
          the whole illustration rather than just the stand itself. */}
      <ellipse cx={CAKE_W / 2} cy={STAND_CY + 6} rx={STAND_RX + 20} ry={STAND_RY + 10} fill="#4a2f26" opacity={0.14} filter="url(#birthday-gate-shadow-blur)" />

      {/* Item 1: cake stand/plate — its own gradient + tighter drop-shadow,
          fades in as "building" starts, just ahead of the tiers dropping
          onto it. */}
      {stage !== "greeting" && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ellipse cx={CAKE_W / 2} cy={STAND_CY + 3} rx={STAND_RX} ry={STAND_RY} fill="#3d2419" opacity={0.3} filter="url(#birthday-gate-shadow-blur)" />
          <ellipse cx={CAKE_W / 2} cy={STAND_CY} rx={STAND_RX} ry={STAND_RY} fill="url(#birthday-gate-stand-gradient)" stroke="#c9a68a" strokeWidth={1.5} />
        </motion.g>
      )}

      {stage !== "greeting" && (
        <>
          {/* Bottom tier — falls from above, spring settle. Item 2: vertical
              gradient (lighter top -> deeper warm tone bottom) on the body,
              wavy piped-frosting band (not a straight strip) on top. */}
          <motion.g initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...TIER_SPRING, delay: 0 }}>
            <rect x={BOTTOM_TIER.x} y={BOTTOM_TIER.y} width={BOTTOM_TIER.w} height={BOTTOM_TIER.h} rx={BOTTOM_TIER.rx} fill="url(#birthday-gate-tier-gradient)" stroke="#a97c50" strokeWidth={1.5} />
            <path
              d={frostingWavePath(BOTTOM_FROSTING.x, BOTTOM_FROSTING.baseY, BOTTOM_FROSTING.w, BOTTOM_FROSTING.waveCount, BOTTOM_FROSTING.waveHeight, BOTTOM_FROSTING.capHeight)}
              fill="url(#birthday-gate-frosting-gradient)"
              stroke="#c9a68a"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </motion.g>

          {/* Top tier — same treatment, lands slightly after the bottom
              tier (TOP_TIER_DELAY_S). */}
          <motion.g initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...TIER_SPRING, delay: TOP_TIER_DELAY_S }}>
            <rect x={TOP_TIER.x} y={TOP_TIER.y} width={TOP_TIER.w} height={TOP_TIER.h} rx={TOP_TIER.rx} fill="url(#birthday-gate-tier-gradient)" stroke="#a97c50" strokeWidth={1.5} />
            <path
              d={frostingWavePath(TOP_FROSTING.x, TOP_FROSTING.baseY, TOP_FROSTING.w, TOP_FROSTING.waveCount, TOP_FROSTING.waveHeight, TOP_FROSTING.capHeight)}
              fill="url(#birthday-gate-frosting-gradient)"
              stroke="#c9a68a"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </motion.g>

          {/* Item 3: confetti sprinkles — mixed rects/ovals, varied
              rotation and warm-palette color, fade in with the tiers. */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: TOP_TIER_DELAY_S + 0.35 }}>
            {SPRINKLES.map((s, i) =>
              s.shape === "rect" ? (
                <rect key={i} x={s.x - 1.6} y={s.y - 3.2} width={3.2} height={6.4} rx={1.6} fill={s.color} transform={`rotate(${s.rotate} ${s.x} ${s.y})`} />
              ) : (
                <ellipse key={i} cx={s.x} cy={s.y} rx={2.6} ry={1.6} fill={s.color} transform={`rotate(${s.rotate} ${s.x} ${s.y})`} />
              ),
            )}
          </motion.g>

          {candleXs.map((x, i) => {
            const dropDelay = CANDLES_START_DELAY_S + i * CANDLE_DROP_STAGGER_S;
            const flameDelay = dropDelay + CANDLE_FLAME_EXTRA_DELAY_S;
            const flameTipY = CANDLE_TOP_Y - FLAME_HEIGHT;
            const flameMidY = (flameTipY + CANDLE_TOP_Y) / 2;

            return (
              <g key={i}>
                {/* Candle body — falls and lands (spring), own stroke for
                    definition regardless of neighboring candles. */}
                <motion.rect
                  x={x - 2}
                  y={CANDLE_TOP_Y}
                  width={4}
                  height={CANDLE_HEIGHT}
                  rx={1.5}
                  fill={i % 2 === 0 ? "#fdf6ec" : "#d97a5f"}
                  stroke="#c9a68a"
                  strokeWidth={0.6}
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...CANDLE_SPRING, delay: dropDelay }}
                />

                {/* Item 4: layered glow — a larger, blurred, lower-opacity
                    copy of the flame's own warm tone sits BEHIND the crisp
                    flame path, so each candle reads as genuinely lit even
                    alone in a static frame, not just from the drop-shadow
                    filter alone. */}
                <motion.ellipse
                  cx={x}
                  cy={flameMidY}
                  rx={FLAME_WIDTH * 1.7}
                  ry={FLAME_HEIGHT * 1.2}
                  fill="#f9c97c"
                  filter="url(#birthday-gate-flame-glow-blur)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isLit ? { opacity: [0.35, 0.55, 0.35], scale: 1 } : stage === "blowing" ? { opacity: 0, scale: 0 } : { opacity: 0.45, scale: 1 }}
                  transition={
                    isLit
                      ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }
                      : stage === "blowing"
                        ? { duration: EXTINGUISH_DURATION_S, delay: i * EXTINGUISH_STAGGER_S, ease: "easeIn" }
                        : { duration: 0.3, delay: flameDelay }
                  }
                  style={{ transformOrigin: `${x}px ${flameMidY}px` }}
                />

                <motion.path
                  d={flamePath(x, flameTipY, FLAME_HEIGHT, FLAME_WIDTH)}
                  fill="url(#birthday-gate-flame-gradient)"
                  stroke="rgba(107,67,50,0.25)"
                  strokeWidth={0.5}
                  style={{
                    transformOrigin: `${x}px ${CANDLE_TOP_Y}px`,
                    filter: "drop-shadow(0 0 3px rgba(249,178,96,0.7))",
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={
                    stage === "blowing"
                      ? EXTINGUISH_KEYFRAMES
                      : isLit
                        ? IDLE_FLICKER
                        : { opacity: 1, scaleY: 1 }
                  }
                  transition={
                    stage === "blowing"
                      ? { duration: EXTINGUISH_DURATION_S, delay: i * EXTINGUISH_STAGGER_S, ease: "easeIn" }
                      : isLit
                        ? { ...IDLE_TRANSITION, delay: i * 0.12 }
                        : { duration: 0.3, delay: flameDelay }
                  }
                />

                {/* Smoke puff — mounts fresh only once "blowing" starts (and
                    unmounts again on reset, since stage returns to
                    "greeting"), so it genuinely replays via normal
                    mount/unmount rather than relying on animate-value
                    comparison for a one-shot effect. */}
                {stage === "blowing" && (
                  <motion.circle
                    cx={x}
                    cy={flameTipY}
                    r={3}
                    fill="rgba(107,67,50,0.35)"
                    initial={{ opacity: 0, scale: 0.6, y: 0 }}
                    animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.2, 1.6], y: [0, -14, -26] }}
                    transition={{ duration: 0.9, delay: i * EXTINGUISH_STAGGER_S + 0.35, ease: "easeOut" }}
                  />
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

export default function BirthdayGate({ children, onOpen, age, personName }: BirthdayGateProps) {
  const [stage, setStage] = useState<Stage>("greeting");
  // `opened` is the actual gate: {opened && children} only ever renders
  // once, mirroring hero/GiftBoxUnlock.tsx's own {opened && children}
  // mechanism. `stage` drives the visual sequence leading up to it
  // (greeting -> building -> lit -> blowing); unlike a reveal card within
  // the room, this gate is never meant to replay once opened — there's no
  // reset/close handler here at all, same as GiftBoxUnlock/UnlockGate.

  const [opened, setOpened] = useState(false);
  // Mounts confetti.json fresh (autoplay picks it up from frame 0) the
  // moment the dim hold finishes — see this file's own top-level doc
  // comment for why the gate's own fade-out then starts CONFETTI_LEAD_MS
  // later rather than waiting for the full ~5s animation to finish.
  const [showConfetti, setShowConfetti] = useState(false);

  const candleCount = age ? Math.min(Math.max(1, Math.round(age)), MAX_CANDLES) : DEFAULT_CANDLE_COUNT;

  // Heading personalization: a birthday page is inherently about ONE named
  // person (unlike an Anniversary page, where the generic
  // lib/people.ts#formatPeopleHeading "for {name}"/"{a} & {b}" phrasing
  // already fits a relationship). Seeing your own name in "Happy Birthday,
  // {name}!" is a much more personal hook than a plain "Happy Birthday!",
  // so it's used whenever personName is provided — the prop is a plain
  // optional string rather than reusing lib/people.ts's SitePerson[]
  // system, since that system's multi-person formatting has no role here
  // (BirthdayCustomData already documents people[0].name as the single
  // birthday person to reuse). Falls back to the plain greeting when unset,
  // so the gate stays usable/testable without requiring a name.
  const heading = personName ? (
    <>
      Happy Birthday, <span className="text-[#4286d4]">{personName}</span>!
    </>
  ) : (
    "Happy Birthday!"
  );

  // Fully automatic entrance: greeting -> building -> lit, no tap required
  // until "lit". buildingDurationMs is scaled to candleCount so "lit" only
  // starts once the actual last candle has finished dropping and igniting,
  // however many there are — not a fixed guess.
  const buildingDurationMs = useMemo(() => {
    const lastCandleFlameStart = CANDLES_START_DELAY_S + (candleCount - 1) * CANDLE_DROP_STAGGER_S + CANDLE_FLAME_EXTRA_DELAY_S;
    return (lastCandleFlameStart + 0.6) * 1000;
  }, [candleCount]);

  // Mount-once kickoff, same plain window.setTimeout convention
  // hero/GiftBoxUnlock.tsx's own handleUnwrap uses for its timed sequence —
  // not tracked/cleared beyond this effect's own cleanup, since this only
  // ever fires once per mount and this gate is never remounted mid-sequence.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setStage("building"), GREETING_HOLD_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (stage !== "building") return;
    const timeoutId = window.setTimeout(() => setStage("lit"), buildingDurationMs);
    return () => window.clearTimeout(timeoutId);
  }, [stage, buildingDurationMs]);

  // Locks body scroll for as long as the gate is showing — same technique
  // hero/GiftBoxUnlock.tsx / interactive/UnlockGate.tsx use.
  useEffect(() => {
    if (opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  function handleBlow() {
    if (stage !== "lit") return;
    // Fired synchronously within this click handler, before any state
    // updates — same requirement onOpen documents on UnlockGate.tsx's own
    // prop: browser autoplay policies only allow audio playback started
    // this way to succeed.
    onOpen?.();
    setStage("blowing");

    const totalExtinguishMs = (candleCount - 1) * EXTINGUISH_STAGGER_S * 1000 + EXTINGUISH_DURATION_S * 1000 + 250;
    window.setTimeout(() => {
      window.setTimeout(() => {
        setShowConfetti(true);
        window.setTimeout(() => setOpened(true), CONFETTI_LEAD_MS);
      }, DIM_HOLD_MS);
    }, totalExtinguishMs);
  }

  return (
    <>
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="birthday-gate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center"
            style={{ background: "linear-gradient(to bottom, #ECE9E6 0%, #FFFFFF 100%)" }}
          >
            {/* Ambient tap-invite glow behind the cake, same visual
                language as hero/GiftBoxUnlock.tsx's own idle glow-pulse,
                reimplemented locally — active once the cake is tappable. */}
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ width: 420, height: 420, background: "radial-gradient(circle, rgba(217,122,95,0.28) 0%, rgba(217,122,95,0) 70%)" }}
              animate={stage === "lit" ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0 }}
              transition={{ duration: 3, repeat: stage === "lit" ? Infinity : 0, ease: "easeInOut" }}
            />

            {/* Soft full-screen vignette while blowing — a gentle dim, not
                a hard cut, matching the same technique already established
                in interactive/CakeWish.tsx. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[5]"
              style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(74,47,38,0.4) 100%)" }}
              animate={{ opacity: stage === "blowing" ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            />

            {/* Full-screen confetti burst — mounted only once showConfetti
                flips true (right after the dim hold, see handleBlow above),
                so autoplay always starts from frame 0. Sits above the dim
                vignette (z-[5]) and the heading/cake content (z-10) so it's
                unmistakably visible over the whole dimmed scene; still
                pointer-events-none since it's purely a celebratory beat, not
                interactive. Same asset + loop={false} one-shot playback as
                closing/GrandFinale.tsx's own confetti — see this file's own
                top-level doc comment for why this instance intentionally
                doesn't wait for that ~5s animation to finish before the gate
                starts fading out over it. */}
            {showConfetti && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                <Lottie animationData={confettiAnimation} loop={false} autoplay />
              </div>
            )}

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="font-display relative z-10 text-4xl font-normal text-[#4a2f26] sm:text-5xl md:text-6xl"
            >
              {heading}
            </motion.h1>

            <motion.button
              type="button"
              onClick={handleBlow}
              disabled={stage !== "lit"}
              aria-label={stage === "lit" ? "Blow out the candles and make a wish" : "Candles are still being lit"}
              className="relative z-10 mt-6 flex flex-col items-center gap-6 focus:outline-none"
              animate={stage === "lit" ? { y: [0, -6, 0] } : { y: 0 }}
              transition={{ duration: 3.4, repeat: stage === "lit" ? Infinity : 0, ease: "easeInOut" }}
            >
              <span className="relative flex items-center justify-center" style={{ width: CAKE_W, height: CAKE_H }}>
                <CakeIllustration candleCount={candleCount} stage={stage} />
              </span>

              {/* Standing convention for any text transition in this
                  project: AnimatePresence mode="wait" so an outgoing/
                  incoming string can never crossfade, even though there's
                  only one string mounted here today. */}
              <AnimatePresence mode="wait">
                {stage === "lit" && (
                  <motion.span
                    key="tap-to-wish"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
                  >
                    Tap to make a wish
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {opened && children}
    </>
  );
}

// ---- Usage (not yet wired into BirthdayV1.tsx) -----------------------------
// import BirthdayGate from "@/components/birthdayShared/hero/BirthdayGate";
//
// <BirthdayGate age={customData.birthday?.age} personName={people[0]?.name} onOpen={() => songPlayerRef.current?.play()}>
//   {/* the rest of the Celebration Room */}
// </BirthdayGate>
//
// No fixed + createPortal(document.body) here, unlike
// interactive/RevealCard.tsx or interactive/CakeWish.tsx's own (now
// removed) reveal card: this component IS the outermost wrapper of the
// whole template, the same architectural role hero/GiftBoxUnlock.tsx and
// interactive/UnlockGate.tsx already play for Anniversary — there's no
// smaller ancestor for its own `fixed inset-0` overlay to be trapped
// inside, so a portal would be solving a problem that doesn't exist here.
// No scrollable content either (no reveal card, no variable-length text
// that could overflow) — verified at ~375x560 that the heading + cake +
// prompt fit comfortably without any scroll mechanism being needed.
