"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { formatPeopleHeading } from "@/lib/people";
import { BUTTERFLY_FILTER_GOLD } from "@/lib/v1ButterflyFilters";
import { V1_BACKGROUND_GRADIENT } from "@/lib/v1SectionGradients";
import { SUNFLOWER_CENTER_COLOR, SUNFLOWER_PETAL_COLOR } from "@/lib/v1SunflowerColors";
import type { SitePerson } from "@/types/site";

import butterflyAnimation from "@/public/animations/butterfly.json";

// V1's new opening gate — reimagined as a wrapped gift box rather than V2's
// UnlockGate.tsx heart icon, but the same underlying job: a full-screen
// tap-to-enter moment that gates the rest of the template behind it. Fully
// self-contained per V1's file-separation rule — nothing here is imported
// from or shared with interactive/UnlockGate.tsx, even though the "gate
// children behind an opened flag, lock body scroll while closed" mechanism
// is deliberately the same well-known pattern that file already uses (a
// generic React technique, not that file's own code).

interface GiftBoxUnlockProps {
  people: SitePerson[];
  groupTitle?: string;
  children: ReactNode;
}

type Phase = "closed" | "opening" | "revealed";

// ---- Timings (ms) ----
// OPEN_ANIMATION_MS: lid lift + ribbon untie + light burst + petal burst +
// butterfly launch all play out within this window.
// REVEAL_HOLD_MS: how long the couple's names stay up once they've faded
// in, before the whole gate starts its own exit fade.
// Gate's own exit fade duration lives on its <motion.div exit> transition
// below (0.8s) — kept as a literal there rather than a third constant here
// since it's consumed directly by Framer Motion's own prop, not by a
// setTimeout.
const OPEN_ANIMATION_MS = 1200;
const REVEAL_HOLD_MS = 1800;

// ---- Sunflower sticker on the box's front — the corrected rounded-petal
// construction (wide overlapping-base petals, rounded tip, 10 petals)
// established in message/SealedLetter.tsx's SunflowerBloom and reused
// verbatim (same formula, same 0.44/0.36/0.24 width/length/center ratios)
// across every V1 sunflower silhouette, reimplemented locally here per
// V1's per-file self-containment convention rather than imported. Sits in
// the body's bottom-left quadrant, clear of both ribbon bands — do not
// move without checking it stays clear of RIBBON_CX/RIBBON_H_H below. ----
function stickerPetalPath(cx: number, cy: number, baseOffset: number, length: number, width: number): string {
  const topY = cy - baseOffset;
  const tipY = topY - length;
  const midY1 = topY - length * 0.15;
  const midY2 = topY - length * 0.55;
  const tipHalfWidth = width * 0.06;
  const w = width / 2;
  return `M${cx},${topY} C${cx - w},${midY1} ${cx - w * 0.6},${midY2} ${cx - tipHalfWidth},${tipY + length * 0.04} Q${cx},${tipY} ${cx + tipHalfWidth},${tipY + length * 0.04} C${cx + w * 0.6},${midY2} ${cx + w},${midY1} ${cx},${topY} Z`;
}

const STICKER_SIZE = 28;
const STICKER_PETAL_COUNT = 10;
const STICKER_ANGLES = Array.from({ length: STICKER_PETAL_COUNT }, (_, i) => (360 / STICKER_PETAL_COUNT) * i);

function SunflowerStickerPaths() {
  const center = STICKER_SIZE / 2;
  const centerRadius = STICKER_SIZE * 0.24;
  const petalLength = STICKER_SIZE * 0.36;
  const petalWidth = STICKER_SIZE * 0.44;

  return (
    <>
      <g fill={SUNFLOWER_PETAL_COLOR}>
        {STICKER_ANGLES.map((angle) => (
          <path
            key={angle}
            d={stickerPetalPath(center, center, centerRadius * 0.5, petalLength, petalWidth)}
            transform={`rotate(${angle} ${center} ${center})`}
          />
        ))}
      </g>
      <circle cx={center} cy={center} r={centerRadius} fill={SUNFLOWER_CENTER_COLOR} />
    </>
  );
}

// ---- Corner butterfly: one persistent element whose `animate` target
// switches from a gentle idle wing-bob (resting on the lid) to a one-shot
// arc-shaped flight path once the box opens, rather than two separate
// components/instances — Framer Motion smoothly interpolates FROM
// whatever the element's current animated position is when its `animate`
// target changes, so this reads as the same butterfly launching off the
// box, not a swap. ----
function LaunchButterfly({ launched }: { launched: boolean }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ width: 40, height: 40, filter: BUTTERFLY_FILTER_GOLD, right: 6, top: -8 }}
      animate={
        launched
          ? {
              x: [0, 40, 130],
              y: [0, -70, -220],
              rotate: [0, -12, 18],
              opacity: [1, 1, 0],
            }
          : { rotate: [0, -6, 6, 0] }
      }
      transition={
        launched
          ? { duration: 1.5, ease: "easeOut" }
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <Lottie
        animationData={butterflyAnimation}
        loop
        autoplay
        lottieRef={lottieRef}
        onDOMLoaded={() => lottieRef.current?.setSpeed(1.4)}
      />
    </motion.div>
  );
}

// ---- Falling petal burst — a short celebratory burst tied to the open
// action, not GoldenSkySection.tsx's continuous ambient drift (this plays
// once and is done, same "burst not ambient" distinction
// message/SealedLetter.tsx's own PetalBurst makes). Positions/timing ARE
// randomized (unlike SealedLetter's fixed hand-placed burst) per this
// task's own request, so this goes through the same useSyncExternalStore
// hydration-safe pattern established in ambient/FloatingHearts.tsx: an
// empty, deterministic snapshot on the server and first client paint (this
// component only ever mounts after a user click anyway, so there's no real
// hydration risk either way, but the pattern is cheap to apply and keeps
// this consistent with the rest of the codebase). ----
function fallingPetalPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = length * 0.18;
  const midY2 = length * 0.6;
  return `M0,0 C${-w},${midY1} ${-w * 0.55},${midY2} 0,${length} C${w * 0.55},${midY2} ${w},${midY1} 0,0 Z`;
}

interface BurstPetalConfig {
  id: number;
  dx: number;
  dy: number;
  size: number;
  duration: number;
  delay: number;
  rotateStart: number;
  color: string;
}

const BURST_PETAL_COUNT = 16;
const BURST_PETAL_COLORS = ["#dd9a42", "#d4919a", "#c9a68a"];

function randomBurstPetal(id: number): BurstPetalConfig {
  // Upward-biased fan (-150deg to -30deg, i.e. up-left through up-right),
  // so the burst reads as bursting up and outward from the box rather than
  // scattering in every direction including straight down into it.
  const angleDeg = -150 + Math.random() * 120;
  const angle = (angleDeg * Math.PI) / 180;
  const distance = 140 + Math.random() * 220;
  return {
    id,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 10 + Math.random() * 8,
    duration: 1.1 + Math.random() * 0.6,
    delay: Math.random() * 0.15,
    rotateStart: Math.random() * 360,
    color: BURST_PETAL_COLORS[id % BURST_PETAL_COLORS.length],
  };
}

const EMPTY_BURST_PETALS: BurstPetalConfig[] = [];

function noopSubscribeBurst() {
  return () => {};
}

function PetalBurst() {
  const cacheRef = useRef<BurstPetalConfig[] | null>(null);

  const petals = useSyncExternalStore(
    noopSubscribeBurst,
    () => {
      if (!cacheRef.current) {
        cacheRef.current = Array.from({ length: BURST_PETAL_COUNT }, (_, i) => randomBurstPetal(i));
      }
      return cacheRef.current;
    },
    () => EMPTY_BURST_PETALS,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute left-1/2 top-1/2"
          style={{ color: petal.color }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: petal.rotateStart, scale: 0.6 }}
          animate={{
            x: petal.dx,
            y: petal.dy,
            opacity: [0, 1, 1, 0],
            rotate: petal.rotateStart + 260,
            scale: 1,
          }}
          transition={{ duration: petal.duration, delay: petal.delay, ease: "easeOut" }}
        >
          <svg viewBox="0 0 16 32" width={petal.size} height={petal.size * 2}>
            <path d={fallingPetalPath(26, 10)} fill="currentColor" transform="translate(8 3)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ---- Light burst — a sudden, celebratory flash (not the slow ambient
// pulse ambient/GoldenSkySection.tsx's own Sun uses): a fast-expanding
// core glow plus radiating wedges, similar underlying idea to that file's
// LightRays (wedge shapes fanning out) but reimplemented locally, tuned
// for a one-shot burst instead of a continuous soft glow. ----
const BURST_RAY_ANGLES = [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180, -120, -150];

function LightBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,250,240,0.95) 0%, rgba(253,213,150,0.5) 45%, rgba(253,213,150,0) 75%)",
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{ width: 820, height: 820, opacity: [0, 1, 0] }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {BURST_RAY_ANGLES.map((angle) => (
        <motion.div
          key={angle}
          className="absolute left-1/2 top-1/2"
          style={{ transformOrigin: "0% 50%", transform: `rotate(${angle}deg)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div
            style={{
              width: 260,
              height: 10,
              background: "linear-gradient(to right, rgba(255,244,218,0.9), rgba(253,213,150,0))",
              filter: "blur(2px)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ---- Scene atmosphere behind the box — added so the box doesn't read as a
// small isolated element floating in an otherwise empty section. A large
// soft radial glow (same warm terracotta family as the box's own tap-invite
// glow, just bigger/softer/independent of it) plus a handful of drifting
// light motes, the same "small warm particles" language as
// hero/SunsetHero.tsx's own light-mote field, reimplemented locally.
// Mounted for the gate's whole lifetime (not phase-gated) so the atmosphere
// carries through into the revealed couple-names moment too. Mote positions
// are randomized and this renders on first paint (unlike the click-only
// bursts above), so it goes through the same useSyncExternalStore
// hydration-safe pattern as ambient/FloatingHearts.tsx. ----
interface AmbientMote {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const AMBIENT_MOTE_COUNT = 7;

function randomMote(id: number): AmbientMote {
  return {
    id,
    left: 22 + Math.random() * 56,
    top: 14 + Math.random() * 55,
    size: 3 + Math.random() * 4,
    duration: 6 + Math.random() * 5,
    delay: -(Math.random() * 6),
    opacity: 0.3 + Math.random() * 0.4,
  };
}

const EMPTY_MOTES: AmbientMote[] = [];

function noopSubscribeMotes() {
  return () => {};
}

function SceneAmbience() {
  const cacheRef = useRef<AmbientMote[] | null>(null);

  const motes = useSyncExternalStore(
    noopSubscribeMotes,
    () => {
      if (!cacheRef.current) {
        cacheRef.current = Array.from({ length: AMBIENT_MOTE_COUNT }, (_, i) => randomMote(i));
      }
      return cacheRef.current;
    },
    () => EMPTY_MOTES,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: 640,
          height: 640,
          background:
            "radial-gradient(circle, rgba(217,122,95,0.32) 0%, rgba(217,122,95,0.14) 45%, rgba(217,122,95,0) 75%)",
        }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {motes.map((mote) => (
        <motion.span
          key={mote.id}
          className="absolute rounded-full"
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            width: mote.size,
            height: mote.size,
            background: "radial-gradient(circle, rgba(253,213,150,0.95) 0%, rgba(253,213,150,0) 70%)",
          }}
          animate={{ y: [0, -20, 0], opacity: [0, mote.opacity, 0] }}
          transition={{ duration: mote.duration, delay: mote.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ---- Bow loop — pinched at the base (where it meets the knot), bulging to
// full width, then rounding over the top on a shallow arc instead of
// tapering to a point — a rounded "balloon" loop instead of a flower-petal
// lens, which is what read as a thin triangular/mustache shape before. Two
// mirrored instances rotated outward from a shared pivot form the bow. ----
function bowLoopPath(length: number, width: number): string {
  const w = width / 2;
  const midY1 = -length * 0.28;
  const midY2 = -length * 0.82;
  const tipHalfWidth = width * 0.3;
  const tipY = -length;
  const overshoot = width * 0.18;
  return `M0,0 C${w},${midY1} ${w},${midY2} ${tipHalfWidth},${tipY} Q0,${tipY - overshoot} ${-tipHalfWidth},${tipY} C${-w},${midY2} ${-w},${midY1} 0,0 Z`;
}

// ---- The box illustration: body + a lid that lifts open + a ribbon-and-
// bow group that fades/scales away together (a tasteful simplification of
// "untying" — animating individual ribbon strands physically coming
// undone is a lot of construction for a detail this small, and the light/
// petal burst plus lid lift already carry the "unwrapping" moment).
//
// Geometry is laid out so nothing collides: the bow's knot rests on the
// lid's surface but its loops rise above the lid's top edge, and even its
// hanging tails stop well short of the lid/body seam, so it never touches
// the body's outline. Both ribbon bands are inset from the body and lid's
// own edges so they read as wrapped around the box rather than floating
// past its outline, and the sunflower sticker sits in the one body
// quadrant neither ribbon band crosses. Depth comes from: a visibly dark
// blurred drop-shadow ellipse grounding the box in the scene, a lid
// gradient noticeably lighter/warmer than the body's deeper gradient (the
// lid is the top-facing surface catching the most light), and a bright
// highlight strip along the lid's own top edge. Box dims are a fixed local
// viewBox, not derived from anything shared. ----
const BOX_W = 200;
const BOX_H = 170;

const BODY_X = 30;
const BODY_Y = 84;
const BODY_W = 140;
const BODY_H = 74;
const BODY_RX = 10;

const LID_X = 22;
const LID_Y = 58;
const LID_W = 156;
const LID_H = 28;
const LID_RX = 8;

const RIBBON_CX = 100;
const RIBBON_V_W = 14;
const RIBBON_H_H = 14;
const RIBBON_H_INSET = 6;

const BOW_CX = RIBBON_CX;
const BOW_CY = LID_Y + 6;
const BOW_LOOP_LENGTH = 40;
const BOW_LOOP_WIDTH = 34;
const BOW_LOOP_ANGLE = 46;

function GiftBox({ phase }: { phase: Phase }) {
  const isOpening = phase === "opening";

  return (
    <div className="relative" style={{ width: BOX_W, height: BOX_H }}>
      <svg
        viewBox={`0 0 ${BOX_W} ${BOX_H}`}
        width={BOX_W}
        height={BOX_H}
        className="absolute inset-0 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="giftBodyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6e4c3" />
            <stop offset="100%" stopColor="#d9a877" />
          </linearGradient>
          <linearGradient id="giftLidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbf2" />
            <stop offset="100%" stopColor="#f3dcae" />
          </linearGradient>
          <linearGradient id="giftSeamShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a2f26" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4a2f26" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="giftLidHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="giftBoxShadowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Grounding drop shadow beneath the box — dark enough to read
            clearly against the pale background, not just a faint tint */}
        <ellipse
          cx={BOX_W / 2}
          cy={BODY_Y + BODY_H + 10}
          rx={84}
          ry={12}
          fill="#3d2419"
          opacity={0.38}
          filter="url(#giftBoxShadowBlur)"
        />

        {/* Body */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          rx={BODY_RX}
          fill="url(#giftBodyGradient)"
          stroke="#a97c50"
          strokeWidth={2}
        />

        {/* Soft shadow cast by the lid onto the body, just below the seam */}
        <rect x={BODY_X + 4} y={BODY_Y} width={BODY_W - 8} height={9} fill="url(#giftSeamShadow)" />

        {/* Sunflower sticker — bottom-left quadrant, clear of both ribbon bands */}
        <g transform="translate(44, 129)">
          <SunflowerStickerPaths />
        </g>

        {/* Ribbon + bow — fades/scales away together on open. Both bands are
            inset from the body/lid's own edges so they read as wrapped
            around the box rather than overflowing its outline. */}
        <motion.g
          animate={isOpening ? { opacity: 0, scale: 0.7, rotate: 12 } : { opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeIn" }}
          style={{ transformOrigin: `${RIBBON_CX}px ${(LID_Y + BODY_Y + BODY_H) / 2}px` }}
        >
          {/* Vertical band: lid top to body bottom, centered under the bow */}
          <rect
            x={RIBBON_CX - RIBBON_V_W / 2}
            y={LID_Y}
            width={RIBBON_V_W}
            height={BODY_Y + BODY_H - LID_Y}
            fill="#c9a68a"
          />
          {/* Horizontal band: inset from the body's own left/right edges */}
          <rect
            x={BODY_X + RIBBON_H_INSET}
            y={BODY_Y + BODY_H / 2 - RIBBON_H_H / 2}
            width={BODY_W - RIBBON_H_INSET * 2}
            height={RIBBON_H_H}
            fill="#c9a68a"
          />

          {/* Bow: two rounded loops symmetric about the vertical band's
              center, meeting at a knot resting on the lid's surface, well
              clear of the body below */}
          <g transform={`translate(${BOW_CX} ${BOW_CY}) rotate(-${BOW_LOOP_ANGLE})`}>
            <path d={bowLoopPath(BOW_LOOP_LENGTH, BOW_LOOP_WIDTH)} fill="#c9a68a" />
          </g>
          <g transform={`translate(${BOW_CX} ${BOW_CY}) rotate(${BOW_LOOP_ANGLE})`}>
            <path d={bowLoopPath(BOW_LOOP_LENGTH, BOW_LOOP_WIDTH)} fill="#c9a68a" />
          </g>

          {/* Short hanging tails, stopping well short of the lid/body seam */}
          <path d={`M${BOW_CX - 6},${BOW_CY} L${BOW_CX - 13},${BOW_CY + 16} L${BOW_CX - 4},${BOW_CY + 14} Z`} fill="#c9a68a" />
          <path d={`M${BOW_CX + 6},${BOW_CY} L${BOW_CX + 13},${BOW_CY + 16} L${BOW_CX + 4},${BOW_CY + 14} Z`} fill="#c9a68a" />

          {/* Knot */}
          <circle cx={BOW_CX} cy={BOW_CY} r={9} fill="#b8935f" />
        </motion.g>

        {/* Lid — lifts open on trigger, hinged at the back-left corner */}
        <motion.g
          animate={isOpening ? { y: -55, rotate: -30, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ transformOrigin: `${LID_X}px ${LID_Y}px` }}
        >
          <rect
            x={LID_X}
            y={LID_Y}
            width={LID_W}
            height={LID_H}
            rx={LID_RX}
            fill="url(#giftLidGradient)"
            stroke="#c9a68a"
            strokeWidth={2}
          />
          {/* Highlight along the lid's top edge, catching the light */}
          <rect x={LID_X + 8} y={LID_Y + 3} width={LID_W - 16} height={5} rx={2.5} fill="url(#giftLidHighlight)" />
        </motion.g>
      </svg>

      <div className="absolute" style={{ right: 10, top: 20, width: 40, height: 40 }}>
        <LaunchButterfly launched={phase !== "closed"} />
      </div>
    </div>
  );
}

export default function GiftBoxUnlock({ people, groupTitle, children }: GiftBoxUnlockProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  // `opened` is the actual gate: {opened && children} only ever renders
  // once, mirroring interactive/UnlockGate.tsx's own {opened && children}
  // mechanism — a standard React technique, not that file's code. `phase`
  // drives the visual sequence leading up to it (closed -> opening ->
  // revealed); `opened` flips true only after the couple's names have had
  // time to settle, so the gate's own exit fade below is the very last
  // thing that happens before the rest of the page appears.
  const [opened, setOpened] = useState(false);
  const heading = formatPeopleHeading(people, groupTitle);

  // Locks body scroll for as long as the gate is showing — same technique
  // interactive/UnlockGate.tsx uses (reimplemented, not imported).
  useEffect(() => {
    if (opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  function handleUnwrap() {
    if (phase !== "closed") return;
    setPhase("opening");
    window.setTimeout(() => setPhase("revealed"), OPEN_ANIMATION_MS);
    window.setTimeout(() => setOpened(true), OPEN_ANIMATION_MS + REVEAL_HOLD_MS);
  }

  return (
    <>
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="gift-box-gate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center"
            style={{ background: V1_BACKGROUND_GRADIENT }}
          >
            <SceneAmbience />

            {phase === "opening" && <LightBurst />}
            {phase === "opening" && <PetalBurst />}

            {phase !== "revealed" && (
              <button
                type="button"
                onClick={handleUnwrap}
                aria-label="Unwrap your gift"
                className="group relative flex flex-col items-center gap-6 focus:outline-none"
              >
                <span className="relative flex items-center justify-center" style={{ width: BOX_W, height: BOX_H }}>
                  {/* Soft ambient glow pulse behind the box, inviting a tap
                      — same "gentle bounce/glow pulse" idle language
                      interactive/UnlockGate.tsx's own heart glow uses,
                      reimplemented locally. Stops once opening starts (the
                      light/petal burst take over as the section's energy
                      from that point on). */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(217,122,95,0.28) 0%, rgba(217,122,95,0) 70%)",
                    }}
                    animate={phase === "closed" ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0 }}
                    transition={{ duration: 3, repeat: phase === "closed" ? Infinity : 0, ease: "easeInOut" }}
                  />

                  <motion.div
                    animate={phase === "closed" ? { y: [0, -8, 0] } : { y: 0 }}
                    transition={{ duration: 3.4, repeat: phase === "closed" ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <GiftBox phase={phase} />
                  </motion.div>
                </span>

                {phase === "closed" && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
                  >
                    Tap to unwrap
                  </motion.span>
                )}
              </button>
            )}

            {phase === "revealed" && (
              <motion.h1
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-display text-5xl font-normal text-[#4a2f26] sm:text-6xl md:text-7xl"
              >
                {heading}
              </motion.h1>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {opened && children}
    </>
  );
}
