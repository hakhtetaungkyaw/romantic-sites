"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useRef, useState } from "react";

import confettiAnimation from "@/public/animations/confetti.json";

// Birthday V1 "Celebration Room" interactive object #4 — decorate your own
// cake (frosting + candles + toppings), then save the result as a PNG to
// your own device. Fully self-contained: nothing here imports from
// components/shared/ or any lib/v1*.ts Anniversary constants module, and
// doesn't import from this file's own siblings (interactive/BalloonReveal,
// interactive/GiftUnwrap, interactive/MemoryFrames, hero/BirthdayGate)
// either — per this project's standing sibling-file-isolation convention.
// The cake illustration reuses hero/BirthdayGate.tsx's own 2-tier
// depth-treated design (gradient tiers, wavy piped frosting bands, cake
// stand, layered candle-flame glow, extinguish/smoke technique) —
// reimplemented fully locally at the same fidelity, not imported, since
// this customizer needs to drive it from per-candle tap state rather than
// the gate's own automatic build-then-blow sequence.
//
// State-lifting shape matches every sibling object built this session:
// initialFrosting/initialToppings seed once on mount, onSelectionChange
// reports every change upward so templates/BirthdayV1.tsx's own hub
// round-trip preserves progress; onCakeCustomized fires once, on mount —
// same "opening the object at all is the discovery signal" shape
// interactive/MemoryFrames.tsx's own onGalleryOpen-on-autoOpen effect
// already uses, not tied to the Save button (a cake, like a photo gallery,
// has no single "done" moment to gate discovery on). Candle lit/unlit
// state is deliberately NOT lifted — it's
// a purely playful, replay-anytime detail with no bearing on "discovered,"
// same reasoning interactive/BalloonReveal.tsx's own MessagePanel dismiss
// was never treated as progress either.
//
// Palette: warm family only — chocolate brown, cream vanilla, dusty-rose
// strawberry, muted-gold lemon, and caramel, all already-established V1
// tokens or close warm-family variants. Mint and Blueberry (both frosting
// and topping) are traditionally cool-toned flavors, recolored to stay
// warm-compatible rather than left saturated green/blue — see FROSTINGS'
// own comment below for the specific recoloring.
//
// Save confetti: same `public/animations/confetti.json` asset and
// `lottie-react` loading pattern closing/GrandFinale.tsx's own end-of-
// experience burst and hero/BirthdayGate.tsx's own post-candle-blow burst
// both use (loop={false} autoplay — a discrete one-shot beat) — a third,
// fully independent playback of that same file, not shared state with
// either of those. Unlike both of those (which either sit inert afterward
// or get covered by a whole-screen cross-fade), this one fades ITSELF back
// out after a beat via a plain AnimatePresence exit — there's no screen
// transition to hide behind here, saving a cake decoration doesn't
// navigate anywhere, so the overlay has to clean up after its own
// celebration and hand the customizer back, fully visible and usable.

export type FrostingId = "chocolate" | "vanilla" | "strawberry" | "lemon" | "caramel" | "mint" | "blueberry";
export type ToppingId =
  | "strawberries"
  | "sprinkles"
  | "chocolateChips"
  | "goldPearls"
  | "blueberries"
  | "mintLeaves"
  | "cherries";

interface CakeCustomizerProps {
  /** Seeds frosting/toppings on mount — see this file's own top-level doc
   *  comment for why (hub navigation genuinely unmounts/remounts this
   *  component). */
  initialFrosting?: FrostingId | null;
  initialToppings?: ToppingId[];
  /** Fired after every selection change with the full current state. */
  onSelectionChange?: (frosting: FrostingId | null, toppings: ToppingId[]) => void;
  /** Fired once, on mount — the object's own "discovered" signal, matching
   *  interactive/MemoryFrames.tsx's own onGalleryOpen-on-autoOpen effect
   *  (opening the object at all is the signal, not any specific action
   *  taken once inside it). */
  onCakeCustomized?: () => void;
  onBack?: () => void;
}

// ---- Frosting + topping data ---------------------------------------------
interface FrostingConfig {
  id: FrostingId;
  label: string;
  top: string;
  bottom: string;
}

const FROSTINGS: FrostingConfig[] = [
  { id: "chocolate", label: "Chocolate", top: "#8a5a3c", bottom: "#5c3722" },
  { id: "vanilla", label: "Vanilla", top: "#fffbf2", bottom: "#e8d4b0" },
  { id: "strawberry", label: "Strawberry", top: "#eeb3ae", bottom: "#d4747a" },
  { id: "lemon", label: "Lemon", top: "#f6dfa0", bottom: "#e8b869" },
  { id: "caramel", label: "Caramel", top: "#d19d63", bottom: "#a9683a" },
  { id: "mint", label: "Mint", top: "#eef0dc", bottom: "#d6d2a8" },
  { id: "blueberry", label: "Blueberry", top: "#c2a0b0", bottom: "#8f6478" },
];

const DEFAULT_FROSTING: FrostingConfig = {
  id: "vanilla",
  label: "Plain",
  top: "#f6e4c3",
  bottom: "#d9a877",
};

interface ToppingPieceSpec {
  x: number;
  y: number;
  rotate: number;
}

interface ToppingConfig {
  id: ToppingId;
  label: string;
  pieces: ToppingPieceSpec[];
}

// Fixed, hand-placed piece positions (not random) — same reasoning every
// other decorative layout in this project's Birthday files gives: needs to
// look intentionally scattered, not regenerate differently every render.
// Coordinates sit on the top tier's own frosting band/surface (see
// TOP_TIER/TOP_FROSTING below), interspersed around the 3 candles rather
// than avoiding them entirely — real sprinkles and candles coexist on a
// real cake.
const TOPPINGS: ToppingConfig[] = [
  {
    id: "strawberries",
    label: "Strawberries",
    pieces: [
      { x: 85, y: 92, rotate: -12 },
      { x: 140, y: 90, rotate: 16 },
      { x: 110, y: 96, rotate: -4 },
    ],
  },
  {
    id: "sprinkles",
    label: "Sprinkles",
    pieces: [
      { x: 72, y: 88, rotate: 20 },
      { x: 95, y: 93, rotate: -35 },
      { x: 122, y: 90, rotate: 50 },
      { x: 148, y: 88, rotate: -18 },
      { x: 165, y: 94, rotate: 10 },
    ],
  },
  {
    id: "chocolateChips",
    label: "Chocolate chips",
    pieces: [
      { x: 80, y: 90, rotate: 0 },
      { x: 105, y: 95, rotate: 0 },
      { x: 135, y: 92, rotate: 0 },
      { x: 158, y: 89, rotate: 0 },
    ],
  },
  {
    id: "goldPearls",
    label: "Gold pearls",
    pieces: [
      { x: 90, y: 94, rotate: 0 },
      { x: 118, y: 89, rotate: 0 },
      { x: 150, y: 93, rotate: 0 },
    ],
  },
  {
    id: "blueberries",
    label: "Blueberries",
    pieces: [
      { x: 76, y: 94, rotate: 0 },
      { x: 128, y: 88, rotate: 0 },
      { x: 155, y: 95, rotate: 0 },
    ],
  },
  {
    id: "mintLeaves",
    label: "Mint leaves",
    pieces: [
      { x: 98, y: 91, rotate: -20 },
      { x: 132, y: 94, rotate: 25 },
      { x: 160, y: 90, rotate: -10 },
    ],
  },
  {
    id: "cherries",
    label: "Cherries",
    pieces: [
      { x: 82, y: 88, rotate: 0 },
      { x: 112, y: 93, rotate: 0 },
      { x: 145, y: 90, rotate: 0 },
    ],
  },
];

const SPRINKLE_COLORS = ["#d97a5f", "#e8b869", "#d4919a", "#c05e3d"];

// ---- Cake geometry — same 2-tier layout hero/BirthdayGate.tsx's own cake
// uses (identical constants, since this is meant to read as the SAME cake
// at the SAME quality bar, just reimplemented locally per this project's
// sibling-file-isolation convention rather than imported). --------------
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

// 3 candles, not the gate's own age-scaled count — this cake is a
// decoration canvas, not a candle-count-means-age moment, and 3 leaves
// each candle's own tap target as large as this composition can give it
// (see Candle's own doc comment below on why that still falls short of a
// true 44px target here).
const CANDLE_COUNT = 3;
const CANDLE_XS = Array.from({ length: CANDLE_COUNT }, (_, i) => 78 + i * (84 / (CANDLE_COUNT - 1)));

// ---- Piped-frosting wavy top edge — same technique
// hero/BirthdayGate.tsx's own frostingWavePath uses, reimplemented locally.
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

// ---- Flame silhouette — same technique hero/BirthdayGate.tsx's own
// flamePath uses, reimplemented locally.
function flamePath(cx: number, tipY: number, height: number, width: number): string {
  const w = width / 2;
  const baseY = tipY + height;
  const midY = tipY + height * 0.62;
  return `M${cx},${tipY} C${cx + w},${tipY + height * 0.3} ${cx + w * 0.75},${midY} ${cx},${baseY} C${cx - w * 0.75},${midY} ${cx - w},${tipY + height * 0.3} ${cx},${tipY} Z`;
}

const IDLE_FLICKER = { scaleY: [1, 1.12, 0.94, 1.05, 1], opacity: [0.9, 1, 0.85, 0.95, 0.9] };
const IDLE_TRANSITION = { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const };
const EXTINGUISH_TRANSITION = { duration: 0.5, ease: "easeIn" as const };
// How long the save confetti stays fully visible before it starts fading
// itself back out — long enough to read as a real celebratory beat (this
// one isn't rushing into a screen transition the way
// hero/BirthdayGate.tsx's own post-candle-blow burst is), short of the
// confetti.json asset's own ~5s natural runtime so the customizer doesn't
// sit obscured for that whole duration.
const CONFETTI_VISIBLE_MS = 2400;

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

// ---- Candle — individually tappable lit/unlit, same layered-glow +
// flame-flicker + extinguish-puff treatment hero/BirthdayGate.tsx's own
// candles use, reimplemented locally and driven by per-candle `lit` state
// instead of one shared automatic stage.
interface CandleProps {
  x: number;
  index: number;
  lit: boolean;
  smokeKey: number | undefined;
  onToggle: (index: number) => void;
}

function Candle({ x, index, lit, smokeKey, onToggle }: CandleProps) {
  const flameTipY = CANDLE_TOP_Y - FLAME_HEIGHT;
  const flameMidY = (flameTipY + CANDLE_TOP_Y) / 2;

  function handleKeyDown(event: React.KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(index);
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={lit ? `Extinguish candle ${index + 1}` : `Light candle ${index + 1}`}
      aria-pressed={lit}
      onClick={() => onToggle(index)}
      onKeyDown={handleKeyDown}
      className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d97a5f] focus-visible:outline-offset-2"
      style={{ cursor: "pointer" }}
    >
      {/* Enlarged invisible hit area — candles sit closer together (~42
          units apart) than a true 44px target could allow without
          overlapping neighbors ambiguously. This is a composition
          constraint (realistic candle spacing on a small illustration),
          not a UI-chrome one — every REAL control in this component
          (frosting/topping/save/back buttons below) still meets the full
          44x44px standard; this is a deliberate, documented exception for
          an illustration-embedded micro-interaction, sized as large as the
          spacing allows rather than the full convention. fill uses a
          near-zero alpha rather than "none" — SVG shapes with no fill
          don't receive pointer events across their interior, only along
          their stroke. */}
      <rect x={x - 17} y={flameTipY - 6} width={34} height={CANDLE_HEIGHT + FLAME_HEIGHT + 12} fill="rgba(0,0,0,0.001)" />

      <rect
        x={x - 2}
        y={CANDLE_TOP_Y}
        width={4}
        height={CANDLE_HEIGHT}
        rx={1.5}
        fill={index % 2 === 0 ? "#fdf6ec" : "#d97a5f"}
        stroke="#c9a68a"
        strokeWidth={0.6}
      />

      {/* Layered glow — TWO layers now, not one, since there's no dark
          backdrop panel anymore to lean on for contrast (see this file's
          own return JSX below for that reversion): a large, wide-blurred,
          more saturated amber glow sits BEHIND everything, and a smaller,
          brighter, tighter-blurred halo ring sits between that outer glow
          and the crisp flame path itself — the same "soft bloom + bright
          core" layering real light sources read as, rather than one flat
          blurred blob. data-candle-glow/data-candle-glow-inner mark these
          for handleSave's own export touch-up below — see that function's
          own comment on why. */}
      <motion.ellipse
        data-candle-glow={index}
        cx={x}
        cy={flameMidY}
        rx={FLAME_WIDTH * 2.2}
        ry={FLAME_HEIGHT * 1.5}
        fill="#f0930f"
        filter="url(#cake-customizer-flame-glow-blur)"
        initial={{ opacity: 0, scale: 0 }}
        animate={lit ? { opacity: [0.5, 0.75, 0.5], scale: 1 } : { opacity: 0, scale: 0 }}
        transition={lit ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : EXTINGUISH_TRANSITION}
        style={{ transformOrigin: `${x}px ${flameMidY}px` }}
      />

      <motion.ellipse
        data-candle-glow-inner={index}
        cx={x}
        cy={flameMidY}
        rx={FLAME_WIDTH * 1.15}
        ry={FLAME_HEIGHT * 0.9}
        fill="#ffe3a3"
        filter="url(#cake-customizer-flame-halo-blur)"
        initial={{ opacity: 0, scale: 0 }}
        animate={lit ? { opacity: [0.65, 0.9, 0.65], scale: 1 } : { opacity: 0, scale: 0 }}
        transition={lit ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 } : EXTINGUISH_TRANSITION}
        style={{ transformOrigin: `${x}px ${flameMidY}px` }}
      />

      <motion.path
        data-candle-flame={index}
        d={flamePath(x, flameTipY, FLAME_HEIGHT, FLAME_WIDTH)}
        fill="url(#cake-customizer-flame-gradient)"
        stroke="rgba(107,67,50,0.25)"
        strokeWidth={0.5}
        style={{
          transformOrigin: `${x}px ${CANDLE_TOP_Y}px`,
          // Stronger, more saturated drop-shadow than the earlier 3px/0.7
          // opacity version — a subtle-but-real "separation" cue right at
          // the flame tip, on top of the two glow layers above, helping
          // it read against a light background specifically (the earlier
          // dark backdrop panel made this less necessary; without it, the
          // flame's own edge needed a bit more definition).
          filter: "drop-shadow(0 0 4px rgba(240,147,10,0.85))",
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={lit ? IDLE_FLICKER : { opacity: 0, scaleY: 0 }}
        transition={lit ? IDLE_TRANSITION : EXTINGUISH_TRANSITION}
      />

      {/* Smoke puff — keyed by smokeKey, which only ever changes (forcing
          a fresh mount + replay) the moment THIS candle is extinguished;
          undefined (never rendered) until that first happens. */}
      {smokeKey !== undefined && (
        <motion.circle
          key={smokeKey}
          cx={x}
          cy={flameTipY}
          r={3}
          fill="rgba(107,67,50,0.35)"
          initial={{ opacity: 0, scale: 0.6, y: 0 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.2, 1.6], y: [0, -14, -26] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
    </g>
  );
}

interface StrawberryPieceProps {
  piece: ToppingPieceSpec;
  delay: number;
}

function StrawberryPiece({ piece, delay }: StrawberryPieceProps) {
  // Static positioning (translate/rotate to this piece's own spot on the
  // cake) lives on a plain, non-animated outer <g> — Framer Motion owns the
  // `transform` it generates for whichever element it animates, so a static
  // `transform` attribute placed directly on that same motion element gets
  // overridden by Motion's own transform (same conflict this file's own
  // Candle glow/flame above avoids by animating opacity/scale only, never
  // position, on elements that also carry a static transformOrigin).
  // AnimatePresence still correctly waits for the inner motion.g's own exit
  // here: motion children register with the nearest AnimatePresence via
  // context regardless of how many plain wrapper elements sit between them.
  return (
    <g transform={`translate(${piece.x} ${piece.y}) rotate(${piece.rotate})`}>
      <motion.g
        initial={{ y: -36, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 420, damping: 14, delay }}
      >
        <path d="M0,-5 C4,-5 6,-1 4.5,4 C3.5,7 -3.5,7 -4.5,4 C-6,-1 -4,-5 0,-5 Z" fill="#c9524f" stroke="#8a2f2c" strokeWidth={0.5} />
        <path d="M-2,-5 L0,-8 L2,-5 Z" fill="#c05e3d" opacity={0.8} />
        <circle cx={-1.5} cy={0} r={0.5} fill="#fdf6ec" opacity={0.8} />
        <circle cx={1.5} cy={2} r={0.5} fill="#fdf6ec" opacity={0.8} />
        <circle cx={0} cy={-1.5} r={0.5} fill="#fdf6ec" opacity={0.8} />
      </motion.g>
    </g>
  );
}

function SprinklePiece({ piece, delay, color }: StrawberryPieceProps & { color: string }) {
  return (
    <g transform={`translate(${piece.x} ${piece.y}) rotate(${piece.rotate})`}>
      <motion.g
        initial={{ y: -30, opacity: 0, scale: 0.4 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 460, damping: 15, delay }}
      >
        <rect x={-3.2} y={-1} width={6.4} height={2} rx={1} fill={color} />
      </motion.g>
    </g>
  );
}

function ChocolateChipPiece({ piece, delay }: StrawberryPieceProps) {
  return (
    <g transform={`translate(${piece.x} ${piece.y})`}>
      <motion.g
        initial={{ y: -34, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 440, damping: 14, delay }}
      >
        <path d="M0,-3.4 C2.2,-3.4 3.4,-1.6 3,0.6 C2.6,2.8 -2.6,2.8 -3,0.6 C-3.4,-1.6 -2.2,-3.4 0,-3.4 Z" fill="#5c3722" stroke="#3d2419" strokeWidth={0.4} />
        <circle cx={-0.8} cy={-0.8} r={0.6} fill="#8a5a3c" opacity={0.7} />
      </motion.g>
    </g>
  );
}

function GoldPearlPiece({ piece, delay }: StrawberryPieceProps) {
  return (
    <g transform={`translate(${piece.x} ${piece.y})`}>
      <motion.g
        initial={{ y: -32, opacity: 0, scale: 0.4 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 460, damping: 15, delay }}
      >
        <circle cx={0} cy={0} r={3.2} fill="#e8b869" stroke="#a9683a" strokeWidth={0.4} />
        <circle cx={-1} cy={-1} r={1} fill="#fff3d6" opacity={0.8} />
      </motion.g>
    </g>
  );
}

function BlueberryPiece({ piece, delay }: StrawberryPieceProps) {
  return (
    <g transform={`translate(${piece.x} ${piece.y})`}>
      <motion.g
        initial={{ y: -32, opacity: 0, scale: 0.4 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 460, damping: 15, delay }}
      >
        <circle cx={0} cy={0} r={2.8} fill="#8f6478" stroke="#5c3f4c" strokeWidth={0.4} />
        <path d="M0,-2.6 L-0.5,-3.4 L0.5,-3.4 Z" fill="#5c3f4c" opacity={0.7} />
        <circle cx={-0.8} cy={-0.8} r={0.6} fill="#c2a0b0" opacity={0.7} />
      </motion.g>
    </g>
  );
}

function MintLeafPiece({ piece, delay }: StrawberryPieceProps) {
  return (
    <g transform={`translate(${piece.x} ${piece.y}) rotate(${piece.rotate})`}>
      <motion.g
        initial={{ y: -34, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 440, damping: 14, delay }}
      >
        <path d="M0,-4.5 C3.4,-3.6 3.4,2.4 0,4.5 C-3.4,2.4 -3.4,-3.6 0,-4.5 Z" fill="#c9c9a0" stroke="#8a8a5c" strokeWidth={0.4} />
        <path d="M0,-3.6 L0,3.6" stroke="#8a8a5c" strokeWidth={0.35} opacity={0.7} />
      </motion.g>
    </g>
  );
}

function CherryPiece({ piece, delay }: StrawberryPieceProps) {
  return (
    <g transform={`translate(${piece.x} ${piece.y})`}>
      <motion.g
        initial={{ y: -36, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 420, damping: 14, delay }}
      >
        <path d="M-1.4,-1 C-2.4,-3.4 -0.6,-4.4 0.4,-5.6" fill="none" stroke="#6b4332" strokeWidth={0.5} />
        <path d="M1.8,-1.2 C2.2,-3.6 1,-4.8 0.4,-5.6" fill="none" stroke="#6b4332" strokeWidth={0.5} />
        <circle cx={-1.6} cy={0.4} r={2.1} fill="#a8342e" stroke="#6e1f1a" strokeWidth={0.4} />
        <circle cx={1.8} cy={0.6} r={2.1} fill="#c0453d" stroke="#6e1f1a" strokeWidth={0.4} />
        <circle cx={-2.1} cy={-0.2} r={0.5} fill="#e08a7a" opacity={0.8} />
        <circle cx={1.3} cy={0} r={0.5} fill="#e08a7a" opacity={0.8} />
      </motion.g>
    </g>
  );
}

function ToppingGroup({ topping, active }: { topping: ToppingConfig; active: boolean }) {
  return (
    <AnimatePresence>
      {active &&
        topping.pieces.map((piece, i) => {
          const delay = i * 0.08;
          if (topping.id === "strawberries") return <StrawberryPiece key={i} piece={piece} delay={delay} />;
          if (topping.id === "sprinkles")
            return <SprinklePiece key={i} piece={piece} delay={delay} color={SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]} />;
          if (topping.id === "chocolateChips") return <ChocolateChipPiece key={i} piece={piece} delay={delay} />;
          if (topping.id === "goldPearls") return <GoldPearlPiece key={i} piece={piece} delay={delay} />;
          if (topping.id === "blueberries") return <BlueberryPiece key={i} piece={piece} delay={delay} />;
          if (topping.id === "mintLeaves") return <MintLeafPiece key={i} piece={piece} delay={delay} />;
          return <CherryPiece key={i} piece={piece} delay={delay} />;
        })}
    </AnimatePresence>
  );
}

interface CakeIllustrationProps {
  frosting: FrostingConfig;
  toppings: Set<ToppingId>;
  pourFrostingId: string;
  litCandles: Set<number>;
  smokeKeys: Record<number, number>;
  onToggleCandle: (index: number) => void;
}

// The cake itself — 2-tier, same depth treatment as
// hero/BirthdayGate.tsx's own cake (gradient tiers, wavy piped frosting
// bands, cake stand, soft grounding shadow). Frosting color swaps
// INSTANTLY on both tier bodies the moment a flavor is selected (no
// waiting on an animation to gate the state change, which would risk a
// visible flash if a user taps a second flavor mid-pour) — the piped wave
// bands stay a consistent white/cream buttercream regardless of flavor,
// same as a real cake's icing detail. The decorative "pour" blob above the
// top tier is keyed by pourFrostingId so a fresh instance mounts (and
// replays) every time the flavor actually changes, plays a one-shot
// drop+spread+fade in that SAME new color, and is left inert afterward —
// the two read as one continuous "pour landing" moment.
function CakeIllustration({ frosting, toppings, pourFrostingId, litCandles, smokeKeys, onToggleCandle }: CakeIllustrationProps) {
  const pourCy = TOP_FROSTING.baseY + 3;

  return (
    <svg viewBox={`0 0 ${CAKE_W} ${CAKE_H}`} width={CAKE_W} height={CAKE_H} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="cake-customizer-tier" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={frosting.top} />
          <stop offset="100%" stopColor={frosting.bottom} />
        </linearGradient>
        <linearGradient id="cake-customizer-frosting-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#fdf6ec" />
        </linearGradient>
        <linearGradient id="cake-customizer-stand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#e8d4b0" />
        </linearGradient>
        <linearGradient id="cake-customizer-flame-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="30%" stopColor="#fde7b8" />
          <stop offset="70%" stopColor="#f9c97c" />
          <stop offset="100%" stopColor="#f0a05c" />
        </linearGradient>
        <linearGradient id={`cake-customizer-pour-${pourFrostingId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={frosting.top} />
          <stop offset="100%" stopColor={frosting.bottom} />
        </linearGradient>
        <filter id="cake-customizer-shadow-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* Widened from 2.5 — a bigger, softer bloom reads more clearly as
            "lit" against a plain light background than a tight blur does,
            since there's no dark backdrop here to lean on for contrast. */}
        <filter id="cake-customizer-flame-glow-blur" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        {/* Tighter companion blur for the bright inner halo ring sitting
            between the soft outer glow and the crisp flame path itself —
            see Candle's own doc comment below for the two-layer reasoning. */}
        <filter id="cake-customizer-flame-halo-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Soft ambient shadow beneath the whole cake, larger/softer than the
          stand's own tighter shadow — grounds the whole illustration. */}
      <ellipse cx={CAKE_W / 2} cy={STAND_CY + 6} rx={STAND_RX + 20} ry={STAND_RY + 10} fill="#4a2f26" opacity={0.14} filter="url(#cake-customizer-shadow-blur)" />

      {/* Cake stand. */}
      <ellipse cx={CAKE_W / 2} cy={STAND_CY + 3} rx={STAND_RX} ry={STAND_RY} fill="#3d2419" opacity={0.3} filter="url(#cake-customizer-shadow-blur)" />
      <ellipse cx={CAKE_W / 2} cy={STAND_CY} rx={STAND_RX} ry={STAND_RY} fill="url(#cake-customizer-stand)" stroke="#c9a68a" strokeWidth={1.5} />

      {/* Bottom tier — own gradient + stroke + highlight, independent of
          the top tier above it. Frosting color lives here (the tier body),
          not the piped band. */}
      <rect x={BOTTOM_TIER.x} y={BOTTOM_TIER.y} width={BOTTOM_TIER.w} height={BOTTOM_TIER.h} rx={BOTTOM_TIER.rx} fill="url(#cake-customizer-tier)" stroke="#a9573d" strokeWidth={1.5} />
      <ellipse cx={BOTTOM_TIER.x + BOTTOM_TIER.w * 0.28} cy={BOTTOM_TIER.y + BOTTOM_TIER.h * 0.3} rx={BOTTOM_TIER.w * 0.22} ry={BOTTOM_TIER.h * 0.2} fill="#ffffff" opacity={0.16} />
      <path
        d={frostingWavePath(BOTTOM_FROSTING.x, BOTTOM_FROSTING.baseY, BOTTOM_FROSTING.w, BOTTOM_FROSTING.waveCount, BOTTOM_FROSTING.waveHeight, BOTTOM_FROSTING.capHeight)}
        fill="url(#cake-customizer-frosting-band)"
        stroke="#c9a68a"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {/* Top tier — same treatment, and the surface toppings/candles sit
          on. */}
      <rect x={TOP_TIER.x} y={TOP_TIER.y} width={TOP_TIER.w} height={TOP_TIER.h} rx={TOP_TIER.rx} fill="url(#cake-customizer-tier)" stroke="#a9573d" strokeWidth={1.5} />
      <ellipse cx={TOP_TIER.x + TOP_TIER.w * 0.28} cy={TOP_TIER.y + TOP_TIER.h * 0.3} rx={TOP_TIER.w * 0.22} ry={TOP_TIER.h * 0.2} fill="#ffffff" opacity={0.16} />
      <path
        d={frostingWavePath(TOP_FROSTING.x, TOP_FROSTING.baseY, TOP_FROSTING.w, TOP_FROSTING.waveCount, TOP_FROSTING.waveHeight, TOP_FROSTING.capHeight)}
        fill="url(#cake-customizer-frosting-band)"
        stroke="#c9a68a"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {TOPPINGS.map((topping) => (
        <ToppingGroup key={topping.id} topping={topping} active={toppings.has(topping.id)} />
      ))}

      {CANDLE_XS.map((x, i) => (
        <Candle key={i} x={x} index={i} lit={litCandles.has(i)} smokeKey={smokeKeys[i]} onToggle={onToggleCandle} />
      ))}

      {/* Decorative pour blob — see this component's own doc comment above
          for why it's purely a visual flourish, not a state gate. */}
      <motion.ellipse
        key={pourFrostingId}
        cx={TOP_TIER.x + TOP_TIER.w / 2}
        rx={18}
        ry={22}
        fill={`url(#cake-customizer-pour-${pourFrostingId})`}
        stroke="#a9573d"
        strokeWidth={1}
        initial={{ cy: -30, scaleX: 0.35, scaleY: 1.3, opacity: pourFrostingId ? 1 : 0 }}
        animate={
          pourFrostingId
            ? { cy: pourCy, scaleX: [0.35, 1.1, 1.35], scaleY: [1.3, 0.6, 0.35], opacity: [1, 1, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 0.75, ease: "easeIn" }}
        style={{ transformOrigin: `${TOP_TIER.x + TOP_TIER.w / 2}px ${pourCy}px` }}
      />
    </svg>
  );
}

interface FrostingSwatchProps {
  frosting: FrostingConfig;
  active: boolean;
  onClick: () => void;
}

function FrostingSwatch({ frosting, active, onClick }: FrostingSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${frosting.label} frosting`}
        aria-pressed={active}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
        style={{
          background: `linear-gradient(to bottom, ${frosting.top}, ${frosting.bottom})`,
          border: active ? "2.5px solid #FFC800" : "2px solid rgba(169,87,61,0.35)",
          boxShadow: active ? "0 4px 10px -3px rgba(107,67,50,0.4)" : "none",
          transform: active ? "scale(1.08)" : "scale(1)",
        }}
      />
      {/* Visible text label — the button's own aria-label already covers
          screen readers, so this is aria-hidden to avoid a duplicate
          announcement; sighted users otherwise had no way to tell what a
          plain color circle was actually meant to represent. */}
      <span aria-hidden="true" className="text-[9px] uppercase tracking-[0.15em] text-[#6b4332]/60">
        {frosting.label}
      </span>
    </div>
  );
}

interface ToppingButtonProps {
  topping: ToppingConfig;
  active: boolean;
  onClick: () => void;
}

// Small icon-only preview matching whichever piece shape this topping
// renders on the cake — reused at a tiny scale rather than a 5th shape
// invented just for the button.
function ToppingIcon({ id }: { id: ToppingId }) {
  if (id === "strawberries") {
    return (
      <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
        <path d="M0,-4 C3.2,-4 4.8,-0.8 3.6,3.2 C2.8,5.6 -2.8,5.6 -3.6,3.2 C-4.8,-0.8 -3.2,-4 0,-4 Z" fill="#c9524f" stroke="#8a2f2c" strokeWidth={0.4} />
        <path d="M-1.6,-4 L0,-6.4 L1.6,-4 Z" fill="#c05e3d" />
      </svg>
    );
  }
  if (id === "sprinkles") {
    return (
      <svg viewBox="-8 -8 16 16" width={16} height={16} aria-hidden="true">
        <rect x={-6} y={-1.5} width={5.5} height={2} rx={1} fill="#d97a5f" transform="rotate(20)" />
        <rect x={0.5} y={-1.5} width={5.5} height={2} rx={1} fill="#e8b869" transform="rotate(-25)" />
        <rect x={-2.5} y={2.5} width={5.5} height={2} rx={1} fill="#d4919a" transform="rotate(45)" />
      </svg>
    );
  }
  if (id === "chocolateChips") {
    return (
      <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
        <path d="M0,-4 C2.6,-4 4,-1.8 3.4,0.8 C2.9,3.2 -2.9,3.2 -3.4,0.8 C-4,-1.8 -2.6,-4 0,-4 Z" fill="#5c3722" stroke="#3d2419" strokeWidth={0.4} />
      </svg>
    );
  }
  if (id === "goldPearls") {
    return (
      <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
        <circle cx={0} cy={0} r={4} fill="#e8b869" stroke="#a9683a" strokeWidth={0.4} />
        <circle cx={-1.3} cy={-1.3} r={1.2} fill="#fff3d6" opacity={0.85} />
      </svg>
    );
  }
  if (id === "blueberries") {
    return (
      <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
        <circle cx={0} cy={0} r={3.6} fill="#8f6478" stroke="#5c3f4c" strokeWidth={0.4} />
        <path d="M0,-3.3 L-0.7,-4.3 L0.7,-4.3 Z" fill="#5c3f4c" opacity={0.7} />
        <circle cx={-1} cy={-1} r={0.8} fill="#c2a0b0" opacity={0.7} />
      </svg>
    );
  }
  if (id === "mintLeaves") {
    return (
      <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
        <path d="M0,-4.5 C3.4,-3.6 3.4,2.4 0,4.5 C-3.4,2.4 -3.4,-3.6 0,-4.5 Z" fill="#c9c9a0" stroke="#8a8a5c" strokeWidth={0.4} />
        <path d="M0,-3.6 L0,3.6" stroke="#8a8a5c" strokeWidth={0.35} opacity={0.7} />
      </svg>
    );
  }
  return (
    <svg viewBox="-6 -6 12 12" width={16} height={16} aria-hidden="true">
      <path d="M-1.4,-1 C-2.4,-3.4 -0.6,-4.4 0.4,-5.6" fill="none" stroke="#6b4332" strokeWidth={0.5} />
      <path d="M1.8,-1.2 C2.2,-3.6 1,-4.8 0.4,-5.6" fill="none" stroke="#6b4332" strokeWidth={0.5} />
      <circle cx={-1.6} cy={0.4} r={2.1} fill="#a8342e" stroke="#6e1f1a" strokeWidth={0.4} />
      <circle cx={1.8} cy={0.6} r={2.1} fill="#c0453d" stroke="#6e1f1a" strokeWidth={0.4} />
    </svg>
  );
}

function ToppingButton({ topping, active, onClick }: ToppingButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={topping.label}
        aria-pressed={active}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
        style={{
          borderColor: active ? "#FFC800" : "rgba(169,87,61,0.25)",
          background: active ? "linear-gradient(to bottom, #fffbf2, #f6e4c3)" : "#fdf6ec",
          boxShadow: active ? "0 4px 10px -4px rgba(107,67,50,0.35)" : "none",
        }}
      >
        <ToppingIcon id={topping.id} />
      </button>
      <span aria-hidden="true" className="w-16 text-center text-[9px] uppercase leading-tight tracking-[0.05em] text-[#6b4332]/60">
        {topping.label}
      </span>
    </div>
  );
}

export default function CakeCustomizer({
  initialFrosting,
  initialToppings,
  onSelectionChange,
  onCakeCustomized,
  onBack,
}: CakeCustomizerProps) {
  const [frostingId, setFrostingId] = useState<FrostingId | null>(initialFrosting ?? null);
  const [toppingIds, setToppingIds] = useState<Set<ToppingId>>(new Set(initialToppings ?? []));
  // All unlit by default — lighting a candle is the user's own deliberate
  // tap, not something the cake arrives with already done for them.
  const [litCandles, setLitCandles] = useState<Set<number>>(() => new Set());
  const [smokeKeys, setSmokeKeys] = useState<Record<number, number>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const activeFrosting = FROSTINGS.find((f) => f.id === frostingId) ?? DEFAULT_FROSTING;

  // Fires once, on mount — matches interactive/MemoryFrames.tsx's own
  // onGalleryOpen-on-autoOpen effect exactly, just without an autoOpen
  // gate of its own: unlike MemoryFrames (which has a real idle state an
  // autoOpen skip can bypass), this component has no idle state to skip —
  // mounting this component IS "the Cake tile was opened," so the signal
  // fires unconditionally rather than behind a boolean prop. No longer
  // tied to the Save button (see handleSave below, which used to call
  // this too) — entering the object at all is now the "discovered"
  // signal, same as MemoryFrames' own "browsing has no real finished
  // state, so opening at all is the natural signal" reasoning applies
  // here too (decorating a cake has no single "done" moment either — the
  // user can keep changing frosting/toppings/candles indefinitely).
  // Calling onCakeCustomized?.() more than once (e.g. if the parent's own
  // callback reference changes between renders) is harmless: it just
  // calls setCakeDiscovered(true) again, which React bails out of once
  // state is already true, same self-limiting shape
  // interactive/MemoryFrames.tsx's own effect already relies on.
  useEffect(() => {
    onCakeCustomized?.();
  }, [onCakeCustomized]);

  // Reports the full current selection upward whenever either piece
  // changes, rather than calling onSelectionChange inline inside
  // toggleTopping's own setState updater below — updater functions must
  // stay pure (no side effects, including calling a parent setState), or
  // React throws "Cannot update a component while rendering a different
  // component." Same fix already applied to
  // interactive/BalloonReveal.tsx's own onPoppedChange reporting.
  //
  // The callback itself is read through a ref (updated every render, never
  // a dependency) rather than listed directly in the effect below's own
  // dependency array: templates/BirthdayV1.tsx passes a fresh inline arrow
  // function on every one of ITS OWN renders, and that arrow calls
  // setCakeToppings(Array.from(...)) — a brand-new array reference every
  // time, which is never state-equal to the previous one, so BirthdayV1
  // always genuinely re-renders in response. If `onSelectionChange` were a
  // dependency here, that re-render would hand this effect a new callback
  // reference, retriggering it, calling setCakeToppings again, re-rendering
  // BirthdayV1 again — an infinite loop (confirmed live once already:
  // "Maximum update depth exceeded"). Depending only on the actual data
  // (frostingId, toppingIds — both local state that only changes on real
  // user taps, not on the parent's own re-renders) breaks that cycle while
  // still always calling the latest callback.
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });
  useEffect(() => {
    onSelectionChangeRef.current?.(frostingId, Array.from(toppingIds));
  }, [frostingId, toppingIds]);

  function selectFrosting(id: FrostingId) {
    if (id === frostingId) return;
    setFrostingId(id);
  }

  function toggleTopping(id: ToppingId) {
    setToppingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Reads `litCandles` from the render closure (not a functional updater)
  // to decide whether this tap is an extinguish, then fires two separate,
  // independent setState calls — same safe shape as toggleTopping's own
  // fix note above documents (never call one setState from inside
  // another's updater).
  function toggleCandle(index: number) {
    const wasLit = litCandles.has(index);
    setLitCandles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    if (wasLit) {
      setSmokeKeys((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
    }
  }

  // Pure client-side export: serialize the live <svg> to a data URL, draw
  // it onto an offscreen canvas at 2x scale, then trigger a normal browser
  // download via a temporary <a download>. No fetch/API route, no server
  // action, nothing persisted anywhere but the visitor's own device.
  function handleSave() {
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    // Fired immediately, synchronously with the tap — not nested inside
    // the async img.onload below — so the celebration reads as an instant
    // reaction to the tap rather than waiting on the export pipeline (SVG
    // serialize -> Image load -> canvas draw -> blob) to finish first. The
    // confetti and the actual save/download proceed fully independently
    // from here; neither one blocks or waits on the other.
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), CONFETTI_VISIBLE_MS);

    // Clone rather than serializing the live node directly: a lit
    // candle's flame/glow run a REPEATING Framer Motion keyframe loop
    // (IDLE_FLICKER), and Motion writes SVG opacity as a plain XML
    // attribute for these elements — confirmed live that this attribute
    // can read "0" at the exact instant of serialization even while the
    // element's own transform is simultaneously mid-flicker at a clearly
    // non-zero scale, producing an export with invisible flames on
    // candles that were plainly lit on screen. Rather than gambling on
    // whatever frame the animation loop happens to be on at the moment of
    // the save tap, the clone's own flame/glow elements (tagged
    // data-candle-flame/data-candle-glow, one per candle index) are
    // force-set to a single deterministic "settled" appearance matching
    // this component's own `lit` state — the export is meant to be a
    // clean, repeatable snapshot of the decoration choice, not a random
    // instant of an ambient loop anyway.
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    CANDLE_XS.forEach((_, i) => {
      const lit = litCandles.has(i);
      const flame = clone.querySelector(`[data-candle-flame="${i}"]`);
      const glow = clone.querySelector(`[data-candle-glow="${i}"]`);
      const glowInner = clone.querySelector(`[data-candle-glow-inner="${i}"]`);
      if (flame instanceof SVGElement) {
        flame.setAttribute("opacity", lit ? "1" : "0");
        flame.style.transform = lit ? "scaleY(1)" : "scaleY(0)";
      }
      if (glow instanceof SVGElement) {
        glow.setAttribute("opacity", lit ? "0.65" : "0");
        glow.style.transform = lit ? "scale(1)" : "scale(0)";
      }
      if (glowInner instanceof SVGElement) {
        glowInner.setAttribute("opacity", lit ? "0.8" : "0");
        glowInner.style.transform = lit ? "scale(1)" : "scale(0)";
      }
    });

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgUrl = URL.createObjectURL(new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }));

    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CAKE_W * scale;
      canvas.height = CAKE_H * scale;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(svgUrl);
      if (!ctx) return;
      // Plain cream fill — same page background color this component sits
      // on live (no separate colored panel behind the cake anymore, see
      // this file's own return JSX below for why). The exported PNG's own
      // <svg> has no background of its own, so this still needs an
      // explicit fill rather than a transparent canvas, just a light one
      // now instead of the earlier dark backdrop experiment.
      ctx.fillStyle = "#fdf6ec";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, CAKE_W, CAKE_H);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "my-birthday-cake.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");

      // No longer fires onCakeCustomized here — see this component's own
      // mount effect above for why "discovered" now means "opened," not
      // "saved." Saving still shows its own local confirmation caption
      // and plays the confetti celebration (triggered synchronously at
      // the top of handleSave above), both unrelated to the hub's own
      // discovered-state tracking now.
      setShowSaved(true);
      window.setTimeout(() => setShowSaved(false), 1800);
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  }

  return (
    <section className="relative flex flex-col items-center px-4 py-6">
      {/* Full-screen save celebration — same standardized full-viewport
          confetti treatment as hero/BirthdayGate.tsx's own post-candle-blow
          burst and closing/GrandFinale.tsx's own arrival burst (checked
          directly, all three now share this shape): `fixed inset-0` +
          `overflow-hidden`, letting confetti.json's own particle
          choreography read as launching from the true bottom edge of the
          whole screen. `fixed` (rather than Gate's own `absolute inset-0`)
          is what actually gives this the SAME resulting coverage as Gate's
          version — this component's own root section can be taller than
          one viewport (all the frosting/topping options), so `absolute`
          here would only span this section's own tall box rather than the
          true viewport `fixed` guarantees regardless of scroll position.
          High z-index (z-40) so it's clearly visible above every other
          fixed element in this view (BackButton is z-30), purely
          decorative (pointer-events-none, aria-hidden) so it never blocks
          the customizer underneath it. AnimatePresence's own exit animation
          is what fades this back out once showConfetti flips false (see
          handleSave's own CONFETTI_VISIBLE_MS timeout above) — no
          whole-screen transition to hide behind here, so the fade has to
          be this element's own. */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="cake-save-confetti"
            className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
            aria-hidden="true"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <Lottie animationData={confettiAnimation} loop={false} autoplay />
          </motion.div>
        )}
      </AnimatePresence>

      {onBack && <BackButton onClick={onBack} />}

      <p className="text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55">Decorate your cake</p>

      {/* No colored backdrop panel here anymore — two earlier passes tried
          a bold orange/amber gradient, then a moodier charcoal-brown, both
          specifically to give the candle glow more contrast than the
          page's own plain cream background gave it. Both are reverted:
          the cake now sits directly on the same light background as
          everything else, and the glow itself (Candle's own glow ellipse,
          below) has been strengthened instead — a darker/more saturated
          core, a wider blur, and a secondary bloom ring — so it reads as
          clearly "lit" without needing a dark panel to contrast against.
          handleSave's own canvas fill (above) matches this same plain
          cream, since the exported PNG only ever captures the <svg>
          itself, not this div's own (now nonexistent) background. */}
      <div ref={svgWrapperRef} className="mt-3">
        <CakeIllustration
          frosting={activeFrosting}
          toppings={toppingIds}
          pourFrostingId={frostingId ?? ""}
          litCandles={litCandles}
          smokeKeys={smokeKeys}
          onToggleCandle={toggleCandle}
        />
      </div>

      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[#6b4332]/50">Frosting</p>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-3">
        {FROSTINGS.map((frosting) => (
          <FrostingSwatch key={frosting.id} frosting={frosting} active={frosting.id === frostingId} onClick={() => selectFrosting(frosting.id)} />
        ))}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[#6b4332]/50">Toppings</p>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-x-5 gap-y-3">
        {TOPPINGS.map((topping) => (
          <ToppingButton key={topping.id} topping={topping} active={toppingIds.has(topping.id)} onClick={() => toggleTopping(topping.id)} />
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="font-display mt-5 rounded-full border border-[#a9573d]/40 bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-8 py-3.5 text-sm uppercase tracking-[0.2em] text-[#fdf6ec] shadow-lg shadow-[#6b4332]/30 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] focus-visible:ring-offset-2"
      >
        Save to Your Photos
      </button>

      {/* Standing convention for any text transition in this project:
          AnimatePresence mode="wait". */}
      <div className="mt-3 h-5">
        <AnimatePresence mode="wait">
          {showSaved && (
            <motion.p
              key="cake-saved-confirmation"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className="text-xs uppercase tracking-[0.3em] text-[#d97a5f]"
            >
              Saved to your photos
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import CakeCustomizer from "@/components/birthdayShared/interactive/CakeCustomizer";
//
// <CakeCustomizer
//   initialFrosting={cakeFrosting}
//   initialToppings={cakeToppings}
//   onSelectionChange={(frosting, toppings) => { setCakeFrosting(frosting); setCakeToppings(toppings); }}
//   onCakeCustomized={() => setCakeDiscovered(true)}
//   onBack={() => setActiveView("hub")}
// />
