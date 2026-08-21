"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Birthday V1 "Celebration Room" interactive object #3 — a tap-to-unwrap
// gift box, unwrapped across 3 distinct layers (ribbon -> wrapping paper ->
// box lid) rather than one single tap, each revealing progressively more
// before the final portal-modal payoff. Fully self-contained: nothing here
// imports from components/shared/ (Anniversary's tree) or any lib/v1*.ts
// Anniversary constants module, per this project's product-line isolation
// principle — every shape/gradient/animation below is a local
// reimplementation, even where it deliberately echoes an established look
// (see the palette note below). Also doesn't import from this file's own
// sibling interactive/BalloonReveal.tsx — per the project's standing
// convention (documented in Anniversary's own interactive/RevealCard.tsx)
// that feature-level interactive/ components stay independent of each
// other's implementation details even when they happen to share a small
// technique (e.g. both files' own progress-dot rows).
//
// Palette: checked hero/GiftBoxUnlock.tsx (Anniversary's own gift box) per
// this task's own instruction. Its box-body gradient (#f6e4c3 -> #d9a877,
// stroke #a97c50) is the SAME token pair hero/BirthdayGate.tsx's cake tiers
// already reuse, so it's already an established cross-family "wrapped
// gift/parcel" body color, not an Anniversary-exclusive one — reused here
// as-is for that continuity. The ribbon and bow are deliberately NOT copied
// 1:1 from GiftBoxUnlock's own muted tan/rose-gold (#c9a68a) — that reads
// as Anniversary's quiet, elegant object. This one uses Birthday's own
// terracotta ribbon (#d97a5f) and gold bow (#FFC800), the same two accents
// hero/BirthdayGate.tsx and interactive/BalloonReveal.tsx both already
// establish as Birthday's own festive signature. The new wrapping-paper
// layer uses a coral/peach family (#e8a598 -> #d97a5f) already established
// by interactive/BalloonReveal.tsx's own balloon palette, so the box's 3
// unwrap layers (ribbon, paper, box) each read as distinct materials
// without introducing a color nowhere else in Birthday's world.
//
// Two distinct reveal UIs, same split this file's sibling
// interactive/BalloonReveal.tsx already establishes: layers 1 and 2 (the
// heart/keyword and the short phrase) are small INLINE reveals below the
// box, not modals — reading them is quick and there are only 2 of them, so
// a modal per layer would be excessive. Layer 3 (the box fully open) DOES
// open a proper fixed+portal modal (GiftReveal below) — this is the single
// one-time final payoff, the same shape as
// interactive/BalloonReveal.tsx's own CompletionReveal and Anniversary's
// interactive/PetalOracle.tsx reveal.
//
// Reset-on-close removed: GiftReveal's own close button used to re-wrap the
// whole box back to layer 0 so the sequence could be replayed. That
// conflicted with templates/BirthdayV1.tsx's hub-and-spoke navigation,
// which needs the landed item to survive a "Back to hub" round trip rather
// than being wiped every time the reveal modal is dismissed — this
// component now genuinely unmounts on Back rather than just hiding in
// place. Closing the modal is now a no-op besides hiding it; once landed,
// `landedItem` stays set and layer 3 renders a compact "already claimed"
// summary (see the render below) instead of replaying the unwrap+spin.
// Only a real page reload resets this component to a blank state.

interface GiftUnwrapProps {
  giftMessage: string;
  /** Shown inline after layer 1 (the ribbon) is removed. */
  giftLayerOneKeyword: string;
  /** Shown inline after layer 2 (the wrapping paper) is removed. */
  giftLayerTwoPhrase: string;
  /** The 7 spin-wheel segment labels shown once the box (layer 3) opens. */
  giftWheelItems: string[];
  /** Fired once the wheel has been spun and lands (not on the tap itself —
   *  a spin that hasn't settled yet isn't really "discovered"), with the
   *  landed item's label, so a parent template can track this object as
   *  done for its own progress indicator AND remember what was won, without
   *  knowing anything about this component's internal layer/wheel state. */
  onWheelSpin?: (landedItem: string) => void;
  /** Seeds `layer`/`landedItem` on mount — lets a parent template (see
   *  templates/BirthdayV1.tsx's own hub-and-spoke navigation) restore
   *  "already spun and landed on X" the next time this component mounts,
   *  since it now genuinely unmounts/remounts on hub navigation rather than
   *  just hiding/showing in place. When set, the box/wheel sequence is
   *  skipped entirely in favor of a compact "already claimed" summary — see
   *  this file's own render below. */
  initialLandedItem?: string;
  /** When provided, a "Back" button appears (fixed, top-left, 44x44px real
   *  tap target) that calls this instead of any in-component reset —
   *  leaving this object via the hub is a genuinely different action from
   *  dismissing the final reveal modal, see this file's own updated doc
   *  comment on why that no longer resets anything either. */
  onBack?: () => void;
}

// How many of the 3 layers have been removed so far: 0 = fully wrapped
// (ribbon + paper + closed lid), 1 = ribbon gone, 2 = ribbon + paper gone,
// 3 = box fully open (lid lifted). `isAnimating` tracks whether the
// removal animation for the NEXT layer is currently playing — kept
// separate from `layer` itself (rather than folding both into one bigger
// stage enum) since which specific visual pieces are mid-animation differs
// per layer, and deriving that from (layer, isAnimating) together in the
// illustration below is simpler than naming out 7 discrete stage strings.
type Layer = 0 | 1 | 2 | 3;

// ---- Timings ----
const RIBBON_REMOVE_MS = 700;
const PAPER_REMOVE_MS = 650;
const BOX_OPEN_MS = 700;

function durationForLayer(layer: Layer): number {
  if (layer === 0) return RIBBON_REMOVE_MS;
  if (layer === 1) return PAPER_REMOVE_MS;
  return BOX_OPEN_MS;
}

// ---- Box geometry (local viewBox) ----
const BOX_W = 220;
const BOX_H = 200;

const BODY = { x: 40, y: 95, w: 140, h: 80, rx: 10 };
const LID = { x: 30, y: 72, w: 160, h: 32, rx: 12 };
const PAPER = { x: BODY.x - 2, y: BODY.y - 2, w: BODY.w + 4, h: BODY.h + 4, rx: 10 };
const RIBBON_CX = BOX_W / 2;
const RIBBON_V_W = 20;
const RIBBON_H_H = 20;
const RIBBON_H_INSET = 10;
const BOW_CX = RIBBON_CX;
const BOW_CY = LID.y;
const BOW_LOOP_LENGTH = 26;
const BOW_LOOP_WIDTH = 20;
const BOW_LOOP_ANGLE = 35;

// Same loop construction technique as every other hand-drawn shape in this
// project's Birthday files (a pointed attachment point widening into a
// rounded bulge, closing back to a point) — reimplemented locally rather
// than copied from hero/GiftBoxUnlock.tsx's own version.
function bowLoopPath(length: number, width: number): string {
  const w = width / 2;
  return `M0,0 C${w},${-length * 0.3} ${w},${-length * 0.9} 0,${-length} C${-w},${-length * 0.9} ${-w},${-length * 0.3} 0,0 Z`;
}

// Four-point sparkle/twinkle silhouette, centered on its own origin — a
// simple geometric star (not copied from Anniversary's own icon-derived
// SPARKLE_PATH in interactive/RevealCard.tsx), used both for the idle
// "there's something special here" glints and the layer-3 burst.
function sparklePath(size: number): string {
  const s = size;
  const inner = s * 0.15;
  return `M0,${-s} C${inner},${-inner} ${inner},${-inner} ${s},0 C${inner},${inner} ${inner},${inner} 0,${s} C${-inner},${inner} ${-inner},${inner} ${-s},0 C${-inner},${-inner} ${-inner},${-inner} 0,${-s} Z`;
}

// Simple heart silhouette (two rounded lobes meeting at a point) — the
// layer-1 icon. Centered on its own origin like sparklePath above so both
// can be positioned via a plain translate.
function heartPath(size: number): string {
  const s = size;
  return `M0,${s * 0.3} C${-s},${-s * 0.6} ${-s * 0.5},${-s * 1.3} 0,${-s * 0.5} C${s * 0.5},${-s * 1.3} ${s},${-s * 0.6} 0,${s * 0.3} Z`;
}

interface IdleSparkle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

// Hand-placed, not random — same reasoning every other fixed decorative
// layout in this project's Birthday files gives (hero/BirthdayGate.tsx's
// SPRINKLES, interactive/BalloonReveal.tsx's BALLOON_SLOTS): needs to look
// identical every time, not regenerate on each render.
const IDLE_SPARKLES: IdleSparkle[] = [
  { x: 34, y: 70, size: 9, delay: 0, duration: 2.6 },
  { x: 186, y: 82, size: 7, delay: 0.9, duration: 2.2 },
  { x: 50, y: 130, size: 6, delay: 1.6, duration: 2.4 },
  { x: 172, y: 140, size: 7, delay: 0.4, duration: 2.8 },
];

interface PaperDot {
  x: number;
  y: number;
  r: number;
}

// Fixed "polka dot" print on the wrapping-paper layer — same hand-placed
// reasoning as IDLE_SPARKLES above, scattered within PAPER's own bounds.
const PAPER_DOTS: PaperDot[] = [
  { x: 62, y: 112, r: 4 },
  { x: 92, y: 102, r: 3 },
  { x: 122, y: 116, r: 4 },
  { x: 152, y: 106, r: 3 },
  { x: 72, y: 148, r: 3 },
  { x: 104, y: 152, r: 4 },
  { x: 136, y: 146, r: 3 },
  { x: 160, y: 136, r: 4 },
];

interface BurstPiece {
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  color: string;
}

const BURST_COLORS = ["#FFC800", "#d97a5f", "#fdf6ec"];

// True runtime randomness — safe without seeding, same reasoning
// Anniversary's interactive/PetalOracle.tsx documents for its own
// click-triggered randomDeparture: this only ever runs from inside
// handleTap, which only ever fires from a real click, never during
// SSR/first paint.
function randomBurst(): BurstPiece[] {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (360 / 8) * i + Math.random() * 20;
    const rad = (angle * Math.PI) / 180;
    const distance = 40 + Math.random() * 30;
    return {
      dx: Math.cos(rad) * distance,
      dy: Math.sin(rad) * distance - 20,
      rotate: Math.random() * 180,
      size: 4 + Math.random() * 3,
      color: BURST_COLORS[i % BURST_COLORS.length],
    };
  });
}

function BurstSparkles() {
  const [pieces] = useState(randomBurst);
  return (
    <g aria-hidden="true">
      {pieces.map((piece, i) => (
        <motion.path
          key={i}
          d={sparklePath(piece.size)}
          fill={piece.color}
          style={{ transformOrigin: `${BOX_W / 2}px ${BODY.y}px`, translate: `${BOX_W / 2}px ${BODY.y}px` }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{ opacity: 0, x: piece.dx, y: piece.dy, rotate: piece.rotate, scale: 1.1 }}
          transition={{ duration: 0.7, delay: 0.15 + i * 0.02, ease: "easeOut" }}
        />
      ))}
    </g>
  );
}

// Box illustration — every piece (body, paper, lid, ribbon, bow) gets its
// own gradient/stroke pairing rather than sharing one flat fill, so each
// reads as a distinct, dimensional part of the box even in a static frame
// (the standing "self-contained boundary" lesson from
// hero/BirthdayGate.tsx's cake and interactive/BalloonReveal.tsx's
// balloons). Layer order back-to-front matches physical reality: plain box
// body, then the wrapping paper covering it, then the lid (never covered
// by paper — a plain-colored lid on a wrapped body is a common real gift
// box look), then the ribbon + bow wrapped around the very outside of all
// of it — which is also the order layers come OFF in reverse (ribbon
// first, then paper, then the lid opens).
function GiftBoxIllustration({ layer, isAnimating }: { layer: Layer; isAnimating: boolean }) {
  const isRibbonAnimating = layer === 0 && isAnimating;
  const isPaperAnimating = layer === 1 && isAnimating;
  const isBoxOpening = layer === 2 && isAnimating;

  const showRibbon = layer === 0;
  const showPaper = layer <= 1;
  const lidOpen = isBoxOpening || layer === 3;
  const glowVisible = isBoxOpening || layer === 3;

  return (
    <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} width={BOX_W} height={BOX_H} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="gift-unwrap-body-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e4c3" />
          <stop offset="100%" stopColor="#d9a877" />
        </linearGradient>
        <linearGradient id="gift-unwrap-paper-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8a598" />
          <stop offset="100%" stopColor="#d97a5f" />
        </linearGradient>
        <linearGradient id="gift-unwrap-lid-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#f3dcae" />
        </linearGradient>
        <linearGradient id="gift-unwrap-lid-highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gift-unwrap-interior-glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#f9c97c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f9c97c" stopOpacity="0" />
        </radialGradient>
        {/* Seam shadow — same technique hero/GiftBoxUnlock.tsx's own
            giftSeamShadow gradient uses for the shadow a lid casts onto the
            body just below where they meet, reimplemented locally. */}
        <linearGradient id="gift-unwrap-seam-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2f26" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4a2f26" stopOpacity="0" />
        </linearGradient>
        <filter id="gift-unwrap-shadow-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Grounding shadow — its own blur/opacity, independent of every
          other piece above it. Deepened slightly (was 0.32) — part of this
          pass's fix for the box reading flat/ungrounded overall. */}
      <ellipse
        cx={BOX_W / 2}
        cy={BODY.y + BODY.h + 8}
        rx={78}
        ry={11}
        fill="#3d2419"
        opacity={0.4}
        filter="url(#gift-unwrap-shadow-blur)"
      />

      {/* Idle glints — pulse whenever the box is resting between taps
          (layer 0/1/2, not mid-animation), not just before the very first
          tap — keeps some visual interest alive at every stage rather than
          only the untouched box getting the sparkle treatment. Each has
          its own timing so they don't blink in unison. Opacity floor
          raised from 0 to 0.4 (was a full 0->0.9->0 pulse) — live-sampled
          the previous version's computed opacity at random points in time
          and it regularly landed near 0 (0.002, 0.004, 0.013), meaning any
          single screenshot or short video frame had a real chance of
          catching them essentially invisible even though the code was
          correctly rendering them; they were just too easy to miss in a
          static capture. Sizes bumped too (was 4-6, now 6-9) for the same
          reason — small enough to still read as a delicate accent, large
          enough to actually register at a glance. */}
      {!isAnimating &&
        layer < 3 &&
        IDLE_SPARKLES.map((sparkle, i) => (
          <motion.path
            key={i}
            d={sparklePath(sparkle.size)}
            fill="#fff3d6"
            stroke="#f0a05c"
            strokeWidth={0.5}
            style={{ transformOrigin: `${sparkle.x}px ${sparkle.y}px`, translate: `${sparkle.x}px ${sparkle.y}px` }}
            initial={{ opacity: 0.4, scale: 0.7 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.7, 1.05, 0.7] }}
            transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay, ease: "easeInOut" }}
          />
        ))}

      {/* Interior glow — hidden until the lid actually lifts. */}
      <motion.ellipse
        cx={BOX_W / 2}
        cy={BODY.y + BODY.h * 0.4}
        rx={54}
        ry={30}
        fill="url(#gift-unwrap-interior-glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowVisible ? 1 : 0 }}
        transition={{ duration: 0.4, delay: isBoxOpening ? 0.25 : 0 }}
      />

      {/* Body — always mounted (never conditionally removed), since it's
          the base every other layer sits on top of or gets stripped away
          from. Only ever covered visually by the paper layer above it,
          never unmounted itself. */}
      <rect
        x={BODY.x}
        y={BODY.y}
        width={BODY.w}
        height={BODY.h}
        rx={BODY.rx}
        fill="url(#gift-unwrap-body-gradient)"
        stroke="#a97c50"
        strokeWidth={2}
      />

      {/* Body highlight — a soft diagonal sheen so the body reads as a
          rounded volume rather than a flat-colored rectangle once the
          paper comes off (item 1's "still needs to look like a gift box"
          fix). Sits under the paper while present, same as the seam
          shadow below — invisible until layer 2 actually reveals it. */}
      <ellipse
        cx={BODY.x + BODY.w * 0.32}
        cy={BODY.y + BODY.h * 0.28}
        rx={BODY.w * 0.28}
        ry={BODY.h * 0.22}
        fill="#ffffff"
        opacity={0.22}
      />

      {/* Seam shadow — the shadow the lid casts onto the body right where
          they meet, fading out once the lid actually lifts (nothing left
          to cast it). Same technique hero/GiftBoxUnlock.tsx's own
          giftSeamShadow uses, reimplemented locally. */}
      <motion.rect
        x={BODY.x + 4}
        y={BODY.y}
        width={BODY.w - 8}
        height={9}
        fill="url(#gift-unwrap-seam-shadow)"
        initial={{ opacity: 1 }}
        animate={{ opacity: lidOpen ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Wrapping paper (layer 2 of 3) — its own gradient + stroke +
          polka-dot print, peels away on its own removal tap rather than
          just fading in place. Also its own highlight sheen + top-edge
          fold shadow now (both were previously only on the plain box body
          underneath, which stays hidden behind this paper for all of
          layer 0/1 — meaning the box read as flat at idle, the very first
          thing anyone actually sees, since the depth treatment only ever
          became visible after tapping through to layer 2. Giving the
          paper layer its own depth cues fixes that: the box now reads
          dimensional immediately, not just after two taps.) */}
      {showPaper && (
        <motion.g
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={isPaperAnimating ? { x: 50, y: -50, rotate: 30, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: PAPER_REMOVE_MS / 1000, ease: "easeIn" }}
          style={{ transformOrigin: `${PAPER.x}px ${PAPER.y}px` }}
        >
          <rect
            x={PAPER.x}
            y={PAPER.y}
            width={PAPER.w}
            height={PAPER.h}
            rx={PAPER.rx}
            fill="url(#gift-unwrap-paper-gradient)"
            stroke="#a9573d"
            strokeWidth={2}
          />
          <ellipse
            cx={PAPER.x + PAPER.w * 0.32}
            cy={PAPER.y + PAPER.h * 0.26}
            rx={PAPER.w * 0.26}
            ry={PAPER.h * 0.2}
            fill="#ffffff"
            opacity={0.3}
          />
          {PAPER_DOTS.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill="#fdf6ec" opacity={0.55} />
          ))}
          <rect x={PAPER.x + 4} y={PAPER.y} width={PAPER.w - 8} height={8} fill="url(#gift-unwrap-seam-shadow)" opacity={0.7} />
        </motion.g>
      )}

      {/* Lid — always mounted; lifts open once layer 3's own tap fires and
          stays lifted/open afterward rather than snapping back shut. */}
      <motion.g
        initial={{ y: 0, rotate: 0, opacity: 1 }}
        animate={lidOpen ? { y: -70, rotate: -22, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: BOX_OPEN_MS / 1000, ease: "easeInOut" }}
        style={{ transformOrigin: `${LID.x}px ${LID.y}px` }}
      >
        <rect
          x={LID.x}
          y={LID.y}
          width={LID.w}
          height={LID.h}
          rx={LID.rx}
          fill="url(#gift-unwrap-lid-gradient)"
          stroke="#c9a68a"
          strokeWidth={2}
        />
        <rect x={LID.x + 8} y={LID.y + 3} width={LID.w - 16} height={5} rx={2.5} fill="url(#gift-unwrap-lid-highlight)" />
      </motion.g>

      {/* Ribbon + bow (layer 1 of 3) — wraps around the very outside of
          the lid + paper-covered body, so it's drawn last (on top) and is
          the first thing to come off. The two pieces now depart
          INDEPENDENTLY rather than as one rigid block: the ribbon bands
          drop straight down and fade, while the bow tumbles up and away
          with a full spin, on a brief delay behind the bands — reads as
          the ribbon actually coming loose and the bow flying free of it,
          not everything just fading in place together (this pass's fix
          for the previously "abrupt" removal). Both keep the brief
          whole-box shake wobble beforehand. */}
      {showRibbon && (
        <>
          <motion.g
            initial={{ opacity: 1, y: 0, rotate: 0 }}
            animate={
              isRibbonAnimating
                ? { opacity: 0, y: 60, rotate: 6 }
                : { opacity: 1, y: 0, rotate: 0 }
            }
            transition={{ duration: RIBBON_REMOVE_MS / 1000, ease: "easeIn" }}
          >
            <motion.g
              animate={isRibbonAnimating ? { x: [0, -6, 6, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: (RIBBON_REMOVE_MS / 1000) * 0.55, ease: "easeInOut" }}
            >
              <rect
                x={RIBBON_CX - RIBBON_V_W / 2}
                y={LID.y}
                width={RIBBON_V_W}
                height={BODY.y + BODY.h - LID.y}
                fill="#d97a5f"
                stroke="#a9573d"
                strokeWidth={1}
              />
              <rect
                x={BODY.x + RIBBON_H_INSET}
                y={BODY.y + BODY.h / 2 - RIBBON_H_H / 2}
                width={BODY.w - RIBBON_H_INSET * 2}
                height={RIBBON_H_H}
                fill="#d97a5f"
                stroke="#a9573d"
                strokeWidth={1}
              />
            </motion.g>
          </motion.g>

          <motion.g
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={
              isRibbonAnimating
                ? { opacity: 0, x: 34, y: -55, rotate: 130 }
                : { opacity: 1, x: 0, y: 0, rotate: 0 }
            }
            transition={{
              duration: RIBBON_REMOVE_MS / 1000,
              ease: "easeOut",
              delay: isRibbonAnimating ? 0.08 : 0,
            }}
            style={{ transformOrigin: `${BOW_CX}px ${BOW_CY}px` }}
          >
            <g transform={`translate(${BOW_CX} ${BOW_CY}) rotate(${-BOW_LOOP_ANGLE})`}>
              <path d={bowLoopPath(BOW_LOOP_LENGTH, BOW_LOOP_WIDTH)} fill="#FFC800" stroke="#c99400" strokeWidth={1} />
            </g>
            <g transform={`translate(${BOW_CX} ${BOW_CY}) rotate(${BOW_LOOP_ANGLE})`}>
              <path d={bowLoopPath(BOW_LOOP_LENGTH, BOW_LOOP_WIDTH)} fill="#FFC800" stroke="#c99400" strokeWidth={1} />
            </g>
            <path d={`M${BOW_CX - 5},${BOW_CY} L${BOW_CX - 12},${BOW_CY + 15} L${BOW_CX - 3},${BOW_CY + 13} Z`} fill="#FFC800" stroke="#c99400" strokeWidth={0.75} />
            <path d={`M${BOW_CX + 5},${BOW_CY} L${BOW_CX + 12},${BOW_CY + 15} L${BOW_CX + 3},${BOW_CY + 13} Z`} fill="#FFC800" stroke="#c99400" strokeWidth={0.75} />
            <circle cx={BOW_CX} cy={BOW_CY} r={8} fill="#f0a05c" stroke="#c99400" strokeWidth={1} />
          </motion.g>
        </>
      )}

      {/* Burst sparkles — fire once as the lid lifts on layer 3's own tap. */}
      {isBoxOpening && <BurstSparkles />}
    </svg>
  );
}

// ---- Spin wheel (replaces the box once layer 3's own box-opening
// animation finishes) --------------------------------------------------

const MAX_WHEEL_ITEMS = 7;
// Scaled up from an original 240 (~1.25x) — the largest that reliably
// fits with zero horizontal overflow at this project's established 375px
// mobile testing width: WHEEL_VIEW below (316px) plus the section's own
// px-4 padding (32px, trimmed from px-6 specifically to reclaim room for
// this) totals 348px, safely under 375px. A fuller 1.4-1.6x (336-384px of
// wheel alone) would need more horizontal room than a 375px viewport has
// left over after ANY padding, so 1.25x is the real ceiling here, not a
// stylistic choice — going further would either overflow or require
// near-zero side padding.
const WHEEL_DIAMETER = 300;
const WHEEL_RADIUS = WHEEL_DIAMETER / 2;
const WHEEL_CENTER = WHEEL_RADIUS + 8; // small margin so the outer stroke isn't clipped
const WHEEL_VIEW = WHEEL_CENTER * 2;
const SPIN_DURATION_S = 4.2;
const LANDED_HOLD_MS = 750;

// 7 warm, harmonious variants — a revised palette after the first pass's
// #8a9b6e (olive/sage) and #FFC800 (neon-saturated gold) both read as
// clashing with the rest of Birthday V1's world once seen on screen. Every
// color here is an already-established V1 token, checked directly against
// ambient/GoldenSkySection.tsx's own documented palette
// (terracotta #d97a5f, dusty rose #d4919a, rose gold #c9a68a, muted gold
// #b8935f) plus this file's own cream/amber/blush/deep-terracotta tokens
// already used elsewhere on the box — no new hues invented, and nothing
// green or neon. Each fill is paired with whichever text color (cream or
// warm dark brown) actually reads clearly against it, not the same text
// color for all 7.
const WHEEL_SEGMENT_STYLES: { fill: string; text: string }[] = [
  { fill: "#d97a5f", text: "#fdf6ec" }, // terracotta
  { fill: "#e8b869", text: "#4a2f26" }, // warm gold/amber
  { fill: "#d4919a", text: "#4a2f26" }, // dusty rose
  { fill: "#f0dfc0", text: "#6b4332" }, // champagne cream
  { fill: "#f0a05c", text: "#4a2f26" }, // peach
  { fill: "#c96a4f", text: "#fdf6ec" }, // deep rust
  { fill: "#c9a68a", text: "#4a2f26" }, // rose-gold
];

// Consistent budget for every label regardless of how long the
// customer-provided text is. Previously all 7 labels were force-stretched
// to one exact pixel width via SVG's textLength/lengthAdjust — which is
// what made a short word like "Money" render visibly larger/more spread
// out than longer labels (the same fixed width, divided across far fewer
// characters), while still not reliably preventing genuinely long labels
// from overflowing their own wedge. Truncating to one shared character
// budget and rendering every label at the same plain font size fixes both
// at once: every label now shares one true visual size, and nothing can
// run past its segment regardless of the source string's length.
const WHEEL_LABEL_MAX_CHARS = 14;

function truncateWheelLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return `${label.slice(0, maxChars - 1).trimEnd()}…`;
}

// Angle 0 = straight up (12 o'clock), increasing clockwise — matches where
// the fixed pointer sits, so segment i's own center angle is directly
// comparable to the pointer's fixed position when computing where the
// wheel needs to stop.
function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wheelSegmentPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y} Z`;
}

// How far (in degrees, always positive and always several full turns) the
// wheel needs to rotate so segment `landedIndex`'s own center ends up
// under the fixed top pointer. Extra full spins are for suspense/visual
// drama only — the math only actually cares about the final resting
// angle, mod 360.
function computeWheelRotation(landedIndex: number, itemCount: number, fullSpins: number): number {
  const segmentCenter = (landedIndex + 0.5) * (360 / itemCount);
  const snapAngle = (360 - segmentCenter) % 360;
  return fullSpins * 360 + snapAngle;
}

// True runtime randomness — safe without seeding, same reasoning
// Anniversary's interactive/PetalOracle.tsx documents for its own
// click-triggered randomness: this only ever runs from inside handleSpin
// below, which only ever fires from a real tap, never during SSR/first
// paint. Kept as a plain top-level function (matching this file's own
// randomBurst above) rather than inlined into handleSpin itself — the
// project's react-hooks/purity lint rule flags Math.random() called
// directly inside a function whose lexical scope sits inside a component
// body, even when that function is genuinely only ever invoked from an
// event handler; moving the impure call into its own top-level function
// (outside any component's render closure) satisfies the rule the same
// way randomBurst already does. 6-8 full spins (also randomized) so
// repeated plays don't all take visually the same amount of time to
// settle, on top of landing on a different segment.
function pickRandomSpinResult(itemCount: number): { index: number; fullSpins: number } {
  return {
    index: Math.floor(Math.random() * itemCount),
    fullSpins: 6 + Math.floor(Math.random() * 3),
  };
}

interface WheelSegmentLabelProps {
  cx: number;
  cy: number;
  radius: number;
  startDeg: number;
  endDeg: number;
  label: string;
  color: string;
}

// Text is rotated to point outward along its own segment's radius (the
// classic "wheel of fortune" label style) rather than staying horizontal,
// so a 7-way-divided circle still has room for each word. Segments on the
// wheel's left half get an extra 180° flip (+ anchor/offset swap) so their
// text still reads left-to-right upright instead of upside down — without
// this, roughly half the labels would render inverted. Every label shares
// one fontSize/fontWeight (no per-label stretching to a forced width —
// see WHEEL_LABEL_MAX_CHARS above for why that was the actual bug), and
// the caller has already truncated `label` to a safe shared character
// budget before it ever reaches this component.
function WheelSegmentLabel({ cx, cy, radius, startDeg, endDeg, label, color }: WheelSegmentLabelProps) {
  const center = (startDeg + endDeg) / 2;
  const rawRotate = center - 90;
  const normalized = ((rawRotate % 360) + 360) % 360;
  const flipped = normalized > 90 && normalized < 270;
  const rotate = flipped ? rawRotate + 180 : rawRotate;
  const anchor = flipped ? "end" : "start";
  const xOffset = flipped ? -(radius * 0.32) : radius * 0.32;

  return (
    <text
      x={cx + xOffset}
      y={cy}
      textAnchor={anchor}
      dominantBaseline="middle"
      transform={`rotate(${rotate} ${cx} ${cy})`}
      fill={color}
      fontSize={11}
      fontWeight={600}
    >
      {label}
    </text>
  );
}

interface WheelSpinProps {
  items: string[];
  onLanded: (item: string) => void;
}

// Self-contained spin state (phase/landedIndex/rotation) — not lifted to
// the parent, since the parent only ever needs the FINAL landed label
// (passed up via onLanded once the landing hold finishes). This also
// means a fresh spin naturally gets a fresh random result on replay: this
// component fully unmounts when GiftUnwrap resets back to layer 0 (see
// its own return below — the wheel and the box are mutually exclusive
// branches of one AnimatePresence), so there's no stale rotation/landed
// state left over to reset by hand.
function WheelSpin({ items, onLanded }: WheelSpinProps) {
  const wheelItems = items.slice(0, MAX_WHEEL_ITEMS);
  const segmentDeg = 360 / wheelItems.length;

  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");
  const [landedIndex, setLandedIndex] = useState<number | null>(null);
  const [targetRotation, setTargetRotation] = useState(0);

  function handleSpin() {
    if (phase !== "idle") return;
    const { index, fullSpins } = pickRandomSpinResult(wheelItems.length);
    setLandedIndex(index);
    setTargetRotation(computeWheelRotation(index, wheelItems.length, fullSpins));
    setPhase("spinning");
  }

  function handleSpinSettled() {
    setPhase("landed");
    window.setTimeout(() => {
      if (landedIndex !== null) onLanded(wheelItems[landedIndex]);
    }, LANDED_HOLD_MS);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Standing convention for any text transition in this project:
          AnimatePresence mode="wait" — this caption disappears for good
          once spun (nothing else replaces it in this slot), but the same
          wrapping keeps this file consistent with every other caption in
          the Birthday product line. */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.p
            key="wheel-caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4 text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
          >
            Give the wheel a spin
          </motion.p>
        )}
      </AnimatePresence>

      <div className="relative" style={{ width: WHEEL_VIEW, height: WHEEL_VIEW }}>
        {/* Fixed layer — pointer + grounding shadow, both outside the
            rotating group below, so they stay put while the wheel spins
            underneath them. */}
        <svg
          viewBox={`0 0 ${WHEEL_VIEW} ${WHEEL_VIEW}`}
          width={WHEEL_VIEW}
          height={WHEEL_VIEW}
          className="absolute inset-0 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Same cream-to-muted-gold radial pairing
                hero/BirthdayGate.tsx's own cake-stand gradient uses
                (#fffbf2 -> #e8d4b0) for a metallic-ring read — reused here
                for the pointer's own gem, reimplemented locally. */}
            <radialGradient id="gift-wheel-pointer-gradient" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fffbf2" />
              <stop offset="100%" stopColor="#b8935f" />
            </radialGradient>
            <filter id="gift-wheel-pointer-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id="gift-wheel-shadow-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Soft outer drop-shadow grounding the whole wheel — same
              technique the box's own grounding shadow uses, reimplemented
              locally here rather than shared between the two. */}
          <ellipse
            cx={WHEEL_CENTER}
            cy={WHEEL_CENTER + WHEEL_RADIUS + 6}
            rx={WHEEL_RADIUS * 0.72}
            ry={12}
            fill="#3d2419"
            opacity={0.28}
            filter="url(#gift-wheel-shadow-blur)"
          />

          {/* Pointer — a small gold gem (V1's own established metallic
              gold family, #b8935f/#c9a68a — deliberately not V2's
              champagne gold #d4af7a, which
              hero/SunsetHero.tsx's own palette comment explicitly
              documents as a DIFFERENT, Anniversary-V2-only token) with a
              soft glow behind it, replacing the earlier plain brown
              triangle. Sized up alongside the wheel's own 1.25x increase
              so it still reads as correctly proportioned rather than
              suddenly small against the bigger wheel. */}
          <rect
            x={WHEEL_CENTER - 10}
            y={2}
            width={20}
            height={20}
            rx={4}
            fill="url(#gift-wheel-pointer-gradient)"
            opacity={0.55}
            filter="url(#gift-wheel-pointer-glow)"
            transform={`rotate(45 ${WHEEL_CENTER} 13)`}
          />
          <rect
            x={WHEEL_CENTER - 9}
            y={4}
            width={18}
            height={18}
            rx={3}
            fill="url(#gift-wheel-pointer-gradient)"
            stroke="#8a6a3f"
            strokeWidth={1.25}
            transform={`rotate(45 ${WHEEL_CENTER} 13)`}
          />
        </svg>

        <motion.svg
          viewBox={`0 0 ${WHEEL_VIEW} ${WHEEL_VIEW}`}
          width={WHEEL_VIEW}
          height={WHEEL_VIEW}
          className="absolute inset-0 overflow-visible"
          initial={{ rotate: 0 }}
          animate={{ rotate: phase === "idle" ? 0 : targetRotation }}
          transition={
            phase === "spinning" || phase === "landed"
              ? { duration: SPIN_DURATION_S, ease: [0.12, 0.72, 0.15, 1] }
              : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (phase === "spinning") handleSpinSettled();
          }}
          style={{ transformOrigin: `${WHEEL_CENTER}px ${WHEEL_CENTER}px` }}
        >
          <defs>
            <filter id="gift-wheel-landed-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            {/* Soft radial sheen, lighter toward the center — drawn once
                as a single overlay circle spanning every segment (see
                below) rather than duplicated per-segment, so all 7 pick up
                the same subtle "lit from the hub" volume in one pass. Same
                depth-via-highlight approach hero/BirthdayGate.tsx's cake
                and interactive/GiftUnwrap.tsx's own box body use, applied
                here as a shared overlay instead of a per-shape gradient
                fill since every segment already needs its own flat color. */}
            <radialGradient id="gift-wheel-sheen" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            {/* Same cream-to-muted-gold pairing the pointer's own gradient
                above uses, for the hub's metallic-ring read. */}
            <radialGradient id="gift-wheel-hub-gradient" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fffbf2" />
              <stop offset="100%" stopColor="#b8935f" />
            </radialGradient>
          </defs>

          {/* Outer rim — its own stroke, independent boundary around the
              whole wheel regardless of which segments sit at the edge. */}
          <circle cx={WHEEL_CENTER} cy={WHEEL_CENTER} r={WHEEL_RADIUS} fill="none" stroke="#a97c50" strokeWidth={4} />

          {wheelItems.map((label, i) => {
            const startDeg = i * segmentDeg;
            const endDeg = startDeg + segmentDeg;
            const style = WHEEL_SEGMENT_STYLES[i % WHEEL_SEGMENT_STYLES.length];
            const isLanded = phase === "landed" && landedIndex === i;
            return (
              <g key={i}>
                <path
                  d={wheelSegmentPath(WHEEL_CENTER, WHEEL_CENTER, WHEEL_RADIUS, startDeg, endDeg)}
                  fill={style.fill}
                  stroke="#fdf6ec"
                  strokeWidth={2}
                />
                {/* Landing confirmation — a soft glow stroke traced over
                    just the winning segment, on top of the plain
                    segment boundary above. */}
                {isLanded && (
                  <motion.path
                    d={wheelSegmentPath(WHEEL_CENTER, WHEEL_CENTER, WHEEL_RADIUS, startDeg, endDeg)}
                    fill="none"
                    stroke="#fff3d6"
                    strokeWidth={5}
                    filter="url(#gift-wheel-landed-glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
                <WheelSegmentLabel
                  cx={WHEEL_CENTER}
                  cy={WHEEL_CENTER}
                  radius={WHEEL_RADIUS}
                  startDeg={startDeg}
                  endDeg={endDeg}
                  label={truncateWheelLabel(label, WHEEL_LABEL_MAX_CHARS)}
                  color={style.text}
                />
              </g>
            );
          })}

          {/* Sheen overlay — one circle spanning the whole wheel, on top
              of every segment but below the hub, so it reads as ambient
              light rather than a separate flat layer. */}
          <circle
            cx={WHEEL_CENTER}
            cy={WHEEL_CENTER}
            r={WHEEL_RADIUS}
            fill="url(#gift-wheel-sheen)"
            style={{ pointerEvents: "none" }}
          />

          {/* Center hub — a small metallic-gold ring (same established V1
              gold family as the pointer above), replacing the earlier
              bare white circle, echoing the box's own ribbon/bow motif
              without needing a literal tiny bow at this scale. */}
          <circle cx={WHEEL_CENTER} cy={WHEEL_CENTER} r={18} fill="url(#gift-wheel-hub-gradient)" stroke="#8a6a3f" strokeWidth={2} />
          <circle cx={WHEEL_CENTER} cy={WHEEL_CENTER} r={9} fill="#fdf6ec" stroke="#b8935f" strokeWidth={1.25} />
        </motion.svg>
      </div>

      {/* Real <button>, generous touch target (px-9 py-3.5 comfortably
          clears 44px tall) — same real-<button> convention every tappable
          target in this project's Birthday files uses. Gradient (lighter
          coral top -> deeper terracotta bottom) + a heavier shadow than a
          flat fill would need, so it reads as a raised, premium pill
          rather than a flat solid-color rectangle. Sized up (px-8->px-9,
          py-3->py-3.5, text-sm->text-base) alongside the wheel's own
          1.25x increase so it still feels correctly weighted next to it. */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={phase !== "idle"}
        aria-label={phase === "idle" ? "Spin the wheel" : "Wheel is spinning"}
        className="font-display mt-8 rounded-full border border-[#a9573d]/40 bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-9 py-3.5 text-base uppercase tracking-[0.2em] text-[#fdf6ec] shadow-lg shadow-[#6b4332]/30 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {phase === "idle" ? "Spin" : "Spinning..."}
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

function BackChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

// The hub-navigation "leave this object" affordance — reimplemented locally
// rather than shared with interactive/BalloonReveal.tsx's own identical
// BackButton, per this project's standing sibling-file-isolation
// convention. Same dedicated fixed/top-left treatment as that file's
// version, for the same reason: this object's own idle view (the box) has
// no existing top-of-screen chrome to repurpose.
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

interface LayerRevealProps {
  layer: Layer;
  layerOneKeyword: string;
  layerTwoPhrase: string;
}

// The two small inline reveals (layer 1's heart+keyword, layer 2's
// phrase) — never both mounted at once, so AnimatePresence mode="wait"
// (this project's standing convention for any text transition) guarantees
// one is fully gone before the next fades in rather than the two
// crossfading over each other. Text styling matches
// ambient/GoldenSkySection.tsx's own emphasis-paragraph treatment
// (text-3xl font-medium text-[#d97a5f]) — vivid terracotta, not the
// muted/low-contrast gray this pass replaces — since this word/phrase is
// the actual payoff of the tap, not a caption; "Layer X of 3" stays the
// small muted secondary cue it already was. Entrance now pops in (a
// slight overshoot via scale keyframes) rather than just fading, so it
// reads as a small celebratory reveal.
const REVEAL_POP_TRANSITION = { duration: 0.45, ease: "easeOut" as const };

function LayerReveal({ layer, layerOneKeyword, layerTwoPhrase }: LayerRevealProps) {
  return (
    <div className="relative mt-6 min-h-[128px] w-full max-w-sm text-center">
      <AnimatePresence mode="wait">
        {layer === 1 && (
          <motion.div
            key="gift-layer-reveal-1"
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: [0.7, 1.1, 1] }}
            exit={{ opacity: 0, y: -6, scale: 0.92, transition: { duration: 0.2 } }}
            transition={REVEAL_POP_TRANSITION}
            className="flex flex-col items-center gap-2"
          >
            <svg viewBox="-10 -13 20 17" width={30} height={26} aria-hidden="true">
              <path d={heartPath(9)} fill="#d05f0e" stroke="#a9573d" strokeWidth={0.75} />
            </svg>
            <p className="font-display text-3xl font-medium text-[#d97a5f] sm:text-4xl">{layerOneKeyword}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#6b4332]/50">Layer 1 of 3</p>
          </motion.div>
        )}
        {layer === 2 && (
          <motion.div
            key="gift-layer-reveal-2"
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: [0.7, 1.06, 1] }}
            exit={{ opacity: 0, y: -6, scale: 0.92, transition: { duration: 0.2 } }}
            transition={REVEAL_POP_TRANSITION}
            className="flex flex-col items-center gap-2"
          >
            <p className="font-display px-4 text-2xl font-medium leading-snug text-[#d97a5f] sm:text-3xl">
              {layerTwoPhrase}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#6b4332]/50">Layer 2 of 3</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GiftRevealProps {
  isOpen: boolean;
  onClose: () => void;
  landedItem: string;
  message: string;
}

function noopSubscribe() {
  return () => { };
}

// The gift's own FINAL reveal — now the payoff of the spin wheel (layer
// 3), not the box opening directly. A proper fixed+portal modal,
// reimplemented locally with the same shape Anniversary's
// interactive/PetalOracle.tsx and this file's sibling
// interactive/BalloonReveal.tsx's own CompletionReveal both already use:
// `fixed` (not `absolute`) portaled to document.body, since a `fixed`
// element only reliably escapes to the true viewport if no ancestor has a
// transform/filter/perspective — this component's eventual placement
// inside the Celebration Room's own ambient/ scene wrapper may well have
// one. Same warm amber-tinted scrim family (rgba(253,196,120,...))
// ambient/GoldenSkySection.tsx's own glows and the other two Birthday
// reveals already use, so all three read as one consistent "world."
function GiftReveal({ isOpen, onClose, landedItem, message }: GiftRevealProps) {
  // Gates the portal to client-only render passes — document.body doesn't
  // exist during SSR. Same useSyncExternalStore hydration trick every
  // other portaled modal in this project uses.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Body-scroll-lock + Escape-to-close while open — same convention
  // Anniversary's interactive/PetalOracle.tsx and this file's sibling
  // interactive/BalloonReveal.tsx's own CompletionReveal both use.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    isMounted &&
    createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-6"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: "rgba(253,196,120,0.35)" }}
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your gift"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="hide-scrollbar relative z-10 flex max-h-[85dvh] w-[90vw] max-w-sm flex-col items-center gap-4 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#c9a68a]/60 bg-[#fdf6ec] px-6 py-10 text-center shadow-[0_25px_50px_-12px_rgba(107,67,50,0.25),inset_0_0_0_1px_rgba(255,251,244,0.5)] sm:px-10"
            >
              {/* h-11 w-11 (44x44px) real tap target regardless of the 16px
                  icon inside it — same convention every close button in
                  this project's Birthday files uses. Closing this one no
                  longer resets anything (see this file's own top-level doc
                  comment for why that changed) — it just closes the modal;
                  the landed item stays remembered either way, surfaced
                  afterward via the compact "already claimed" summary below. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-[#4a2f26]/50 transition-colors hover:bg-[#c9a68a]/15 hover:text-[#4a2f26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
              >
                <CloseIcon />
              </button>

              {/* The wheel's own payoff — the actual landed item, styled
                  as the modal's primary focus (same vivid-terracotta
                  emphasis treatment LayerReveal's own keyword/phrase text
                  uses), with giftMessage below it now reading as
                  supporting context rather than the modal's sole
                  content. */}
              <p className="font-display text-2xl font-medium text-[#d97a5f] sm:text-3xl">
                You get: {landedItem}! 🎉
              </p>

              <p className="font-display text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">{message}</p>

              {/* Small completion indicator — same tone as
                  interactive/BalloonReveal.tsx's own "Every message found
                  ✨" line, styled as a small badge here since this reveal
                  is a modal rather than an inline caption. */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a68a]/40 bg-[#fdf6ec] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#d97a5f]">
                Gift Opened 🎁
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
  );
}

export default function GiftUnwrap({
  giftMessage,
  giftLayerOneKeyword,
  giftLayerTwoPhrase,
  giftWheelItems,
  onWheelSpin,
  initialLandedItem,
  onBack,
}: GiftUnwrapProps) {
  // Seeded once at mount from initialLandedItem — see this component's own
  // props doc comment above for why: a hub-navigation remount needs to
  // restore "already spun and landed on X" without replaying the sequence.
  const [layer, setLayer] = useState<Layer>(initialLandedItem ? 3 : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [landedItem, setLandedItem] = useState(initialLandedItem ?? "");

  function handleTap() {
    if (isAnimating || showReveal || layer >= 3) return;
    setIsAnimating(true);
    window.setTimeout(() => {
      setLayer((prev) => (prev + 1) as Layer);
      setIsAnimating(false);
    }, durationForLayer(layer));
  }

  // Layer 3 no longer auto-opens the final modal (that used to fire off a
  // brief hold timer the moment `layer` became 3) — it now shows the spin
  // wheel instead (see the JSX below), and only THIS callback, fired once
  // WheelSpin's own landing hold finishes, actually opens the modal.
  function handleWheelLanded(item: string) {
    setLandedItem(item);
    setShowReveal(true);
    onWheelSpin?.(item);
  }

  // No longer resets on close — see this file's own top-level doc comment
  // for why (templates/BirthdayV1.tsx's hub-and-spoke navigation needs
  // `landedItem` to survive a "Back to hub" round trip, which this used to
  // wipe every time the reveal modal was dismissed). Just closes the modal
  // now; the box stays open at layer 3, showing the "already claimed"
  // summary below.
  function handleClose() {
    setShowReveal(false);
  }

  const ariaLabel = isAnimating
    ? "Unwrapping..."
    : layer === 0
      ? "Untie the ribbon"
      : layer === 1
        ? "Unwrap the paper"
        : layer === 2
          ? "Open the box"
          : "Gift box is open";

  return (
    <section className="relative px-4 py-12">
      {onBack && <BackButton onClick={onBack} />}
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        {/* Standing convention for any text transition in this project:
            AnimatePresence mode="wait" — only ever one string mounted here
            (it disappears once the first tap lands), but the same wrapping
            keeps this file consistent with every other caption in the
            Birthday product line. */}
        <AnimatePresence mode="wait">
          {layer === 0 && !isAnimating && (
            <motion.p
              key="gift-unwrap-caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
            >
              There might be something inside...
            </motion.p>
          )}
        </AnimatePresence>

        {/* mt-10 clearance above the canvas, same fix
            interactive/BalloonReveal.tsx needed after its own idle bounce
            was found overlapping its heading text — kept here even though
            this box's own bounce is smaller (a single object, not a
            bouquet), so the same lesson doesn't need relearning per
            component. Box and wheel are mutually exclusive branches of one
            AnimatePresence (crossfade between them) rather than the wheel
            just appearing stacked below the emptied box — the box's job is
            done once layer 3's own opening animation finishes, so it steps
            aside instead of sitting there empty next to the wheel. */}
        <AnimatePresence mode="wait">
          {layer < 3 ? (
            <motion.button
              key="gift-box"
              type="button"
              onClick={handleTap}
              disabled={isAnimating}
              aria-label={ariaLabel}
              className="relative mt-10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
              style={{ width: BOX_W, height: BOX_H }}
              animate={layer === 0 && !isAnimating ? { y: [0, -10, 0], rotate: [-2, 2, -2] } : { y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3 } }}
              transition={{ duration: 3.2, repeat: layer === 0 && !isAnimating ? Infinity : 0, ease: "easeInOut" }}
            >
              <GiftBoxIllustration layer={layer} isAnimating={isAnimating} />
            </motion.button>
          ) : landedItem ? (
            // Already spun and landed (either seeded via initialLandedItem
            // on mount, or landed this session and its reveal modal since
            // dismissed) — skip the wheel entirely rather than letting it
            // remount into a fresh idle state, which would misleadingly
            // offer a second spin. See this file's own top-level doc
            // comment for why reset-on-close no longer clears this.
            <motion.div
              key="gift-claimed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3 } }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-10 flex flex-col items-center gap-4 text-center"
            >
              <p className="font-display text-2xl font-medium text-[#d97a5f] sm:text-3xl">
                You got: {landedItem}! 🎉
              </p>
              <button
                type="button"
                onClick={() => setShowReveal(true)}
                className="font-display rounded-full border border-[#a9573d]/40 bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-8 py-3 text-sm uppercase tracking-[0.2em] text-[#fdf6ec] shadow-lg shadow-[#6b4332]/30 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] focus-visible:ring-offset-2"
              >
                View your gift again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="gift-wheel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-3"
            >
              <WheelSpin items={giftWheelItems} onLanded={handleWheelLanded} />
            </motion.div>
          )}
        </AnimatePresence>

        {layer < 3 && (
          <LayerReveal layer={layer} layerOneKeyword={giftLayerOneKeyword} layerTwoPhrase={giftLayerTwoPhrase} />
        )}

        {/* Minimal progress cue — 3 dots, one per unwrap layer, filling
            solid as each comes off. Same "one per unit, filled as reached"
            convention this file's sibling
            interactive/BalloonReveal.tsx uses for its own 7 balloons,
            reimplemented here (not imported) in the same warm terracotta.
            Only shown for layer < 3: once the wheel takes over, all 3 dots
            are already permanently filled (there's nothing left to track
            unwrapping — "remaining spins" isn't a real concept here, since
            there's exactly one spin per session) and would just sit there
            statically maxed-out through the whole wheel/spin/modal
            experience, so it's hidden rather than kept as an inert
            leftover. */}
        {layer < 3 && (
          <div aria-hidden="true" className="mt-4 flex justify-center gap-2">
            {[0, 1, 2].map((i) => {
              const filled = layer > i;
              return (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: filled ? "#f13b09" : "rgba(107,67,50,0.25)",
                    boxShadow: filled ? "0 0 5px 1px rgba(217,122,95,0.6)" : "none",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <GiftReveal
        isOpen={showReveal}
        onClose={handleClose}
        landedItem={landedItem}
        message={giftMessage}
      />
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import GiftUnwrap from "@/components/birthdayShared/interactive/GiftUnwrap";
//
// <GiftUnwrap
//   giftMessage={customData.birthday?.giftMessage ?? ""}
//   giftLayerOneKeyword={customData.birthday?.giftLayerOneKeyword ?? ""}
//   giftLayerTwoPhrase={customData.birthday?.giftLayerTwoPhrase ?? ""}
//   giftWheelItems={customData.birthday?.giftWheelItems ?? []}
//   initialLandedItem={landedItem}
//   onWheelSpin={setLandedItem}
//   onBack={() => setActiveView("hub")}
// />
//
// initialLandedItem/onWheelSpin let the parent template keep its own copy
// of the landed item alive across a full unmount (navigating to the hub and
// back only remounts this component, it doesn't reload the page) — see
// this file's own top-level doc comment for why that's necessary now.
// onBack is optional: omit it to keep this component fully standalone (no
// Back button renders).
//
// No photo prop: the final reveal modal used to optionally show
// customData.birthday.giftPhoto above the landed item, but that photo was
// removed from this modal (keeping it landed-item + giftMessage only), and
// photoUrl wasn't used anywhere else in this file — so the prop itself was
// removed too rather than left as dead plumbing. giftPhoto itself is still
// a real field on BirthdayCustomData in types/site.ts (untouched by this
// change) in case a future Birthday object wants it; this component simply
// no longer consumes it.
//
// Layer 3 (box opens) no longer transitions straight to the final modal —
// it now shows a spin wheel (WheelSpin above) built from giftWheelItems,
// and only THAT landing (not the box opening) triggers GiftReveal, which
// now leads with the landed item ("You get: {item}! 🎉") and shows
// giftMessage as supporting text beneath it, not the modal's sole content.
//
// GiftReveal (this file's own final modal) uses fixed +
// createPortal(document.body) — see its own doc comment above for why, and
// for how that choice differs from LayerReveal's lighter inline treatment
// for layers 1 and 2, and from interactive/BalloonReveal.tsx's own lighter
// per-balloon MessagePanel.
