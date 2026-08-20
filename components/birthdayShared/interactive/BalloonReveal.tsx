"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Birthday V1 "Celebration Room" interactive object #2 — a tap-to-pop
// balloon bouquet. Fully self-contained: nothing here imports from
// components/shared/ (Anniversary's tree) or any lib/v1*.ts Anniversary
// constants module, per this project's product-line isolation principle —
// every shape/gradient/animation below is a local reimplementation even
// where it echoes a technique established elsewhere (hero/BirthdayGate.tsx's
// per-element stroke+gradient boundaries, Anniversary's
// interactive/PetalOracle.tsx click-triggered scatter randomness).
//
// Two distinct reveal UIs, two distinct scopes:
//   - Per-balloon (MessagePanel below): one shared message card, not
//     per-balloon floating cards. Reasoning: with 5-7 balloons clustered
//     tightly enough to read as a bouquet on a ~300-440px canvas,
//     per-balloon cards wide enough to hold a real sentence would
//     inevitably overlap their neighbors — the "small card near where the
//     balloon was" instruction is satisfied loosely (same component) rather
//     than pixel-exact, which avoids that collision problem entirely. It IS
//     `position: fixed`, true-viewport-centered (an in-flow, bottom-of-
//     canvas position was tried first and could render past the bottom of
//     the viewport with no way to see the rest of it) — but deliberately
//     NOT createPortal(document.body): there's no ancestor-clipping
//     scenario to escape here, just centering to get right, so plain
//     `fixed` is enough. The bouquet itself dims (not blurred — a fast
//     opacity fade reads as "backgrounded" without needing a second blur
//     filter layer) while the card is open, both so it's clearly the
//     focused element and so no popped-but-still-bobbing balloon visually
//     competes with it.
//   - Completion (CompletionReveal below): once every balloon has been
//     popped, a proper fixed+portal modal DOES open — this is the moment
//     the per-balloon reasoning above explicitly doesn't apply to, since
//     it's a single one-time payoff (like the cake's own reveal used to
//     be), not 5-7 stacked takeovers. Same technique
//     interactive/PetalOracle.tsx (V1) and interactive/RevealCard.tsx (V2)
//     both use, reimplemented locally.
//
// Reset-on-close was REMOVED from CompletionReveal's own onClose this pass
// (it used to clear popped/activeIndex/burst, matching
// interactive/PetalOracle.tsx's own replay-from-scratch pattern) — that
// conflicted with templates/BirthdayV1.tsx's new hub-and-spoke navigation,
// which needs a balloon's popped state to survive leaving and re-entering
// this object via "Back to hub." Dismissing the completion modal is now
// just that: dismissing a modal, not a reset. The only two things that can
// still make this bouquet fully fresh again are a real page reload, or
// this component simply never having received any `initialPopped` at all.
// MessagePanel's own per-balloon dismiss was never a reset to begin with
// and is unaffected.

interface BalloonRevealProps {
  messages: string[];
  /** Shown in the completion reveal card once every balloon has been popped. */
  completionMessage: string;
  /** Reuses SiteData.photos[0] — same single-photo-accent sourcing
   *  ambient/GoldenSkySection.tsx's own PhotoAccent documents for its own
   *  accent slot, not a dedicated Birthday-specific photo field. */
  photoUrl?: string;
  /** Fired once, the moment the final balloon is popped (not gated on the
   *  completion reveal's own display/hold timing) — lets a parent template
   *  track "this object has been discovered" for its own progress
   *  indicator without needing to know anything about this component's
   *  internal pop/reveal state. */
  onAllPopped?: () => void;
  /** Seeds `popped` on mount — lets a parent template (see
   *  templates/BirthdayV1.tsx's own hub-and-spoke navigation) restore
   *  exactly which balloons were already popped the last time this
   *  component was mounted, since it now genuinely unmounts/remounts on
   *  hub navigation rather than just hiding/showing in place. */
  initialPopped?: number[];
  /** Fired after every successful pop with the FULL current set of popped
   *  indices (not just the one that just changed) — a parent template uses
   *  this to keep its own copy in sync for both progress-tracking display
   *  and as the next mount's `initialPopped` seed. */
  onPoppedChange?: (popped: number[]) => void;
  /** When provided, a "Back" button appears (fixed, top-left, 44x44px real
   *  tap target) that calls this instead of any in-component reset —
   *  leaving this object via the hub is a genuinely different action from
   *  dismissing a single balloon's own message panel or the completion
   *  modal, see this file's own updated doc comment on why neither of
   *  those two still resets anything. */
  onBack?: () => void;
}

const MAX_BALLOONS = 7;
const FALLBACK_MESSAGE = "A little birthday cheer, just for you.";

interface BalloonSlot {
  xPct: number;
  yPct: number;
  size: number;
  color: string;
  tilt: number;
  floatDelay: number;
  floatDuration: number;
}

// Hand-placed bouquet arrangement (not a formula/grid) — same reasoning
// hero/BirthdayGate.tsx's SPRINKLES gives for its own fixed layout: needs to
// look hand-arranged, not regenerate a different cluster on every render.
// Palette widened from an earlier pass that leaned too hard on dusty-
// rose/tan (two balloons were literally the same #d4919a) and read as
// monotone rather than "colorful." Now seven distinct hues: terracotta
// #d97a5f and gold #FFC800 (both already established in
// hero/BirthdayGate.tsx's own sprinkles), dusty rose/blush #d4919a
// (ambient/GoldenSkySection.tsx's documented secondary token), cream
// #f6e4c3 (BirthdayGate again), golden amber #dd9a42 (checked
// message/SealedLetter.tsx and ambient/GoldenSkySection.tsx per this task's
// own instruction — this is GoldenSkySection's own PetalDrift color,
// reused here rather than inventing a fourth gold-adjacent tone), plus two
// genuinely new additions requested explicitly: a deep terracotta #c05e3d
// (richer/darker than #d97a5f, not just a repeat of it) and a single soft
// sage accent #8a9b6e — deliberately desaturated/muted rather than a pure
// green, so it reads as a warm-adjacent outlier note rather than clashing
// with the rest of Birthday V1's world.
//
// Positions are chosen so every pair's actual 2D center-to-center distance
// (not just its x-gap — several pairs share a similar x and are separated
// by y instead, or vice versa) clears the sum of their two radii by a
// healthy ~1.4-2x margin at the smallest supported canvas (300x280,
// mobile's own w-max/h below) — an earlier pass only spread x evenly and
// left several same-row pairs visually touching/overlapping, which is what
// read as "cramped." Sizes were trimmed too (54-78, was 62-92) so the
// balloons themselves take up less of that gap. Because every position
// below is a PERCENTAGE of the canvas's own width/height, the whole
// cluster's proportions (and this same margin) scale up automatically as
// the canvas grows at sm:/md: below — no separate desktop layout needed.
const BALLOON_SLOTS: BalloonSlot[] = [
  { xPct: 8, yPct: 50, size: 62, color: "#d97a5f", tilt: -8, floatDelay: 0, floatDuration: 4.2 },
  { xPct: 26, yPct: 16, size: 74, color: "#FFC800", tilt: 5, floatDelay: 0.5, floatDuration: 4.8 },
  { xPct: 50, yPct: 38, size: 68, color: "#d4919a", tilt: -4, floatDelay: 1.0, floatDuration: 4.4 },
  { xPct: 74, yPct: 14, size: 78, color: "#f6e4c3", tilt: 7, floatDelay: 0.3, floatDuration: 5.0 },
  { xPct: 92, yPct: 46, size: 58, color: "#dd9a42", tilt: -6, floatDelay: 0.8, floatDuration: 4.6 },
  { xPct: 18, yPct: 82, size: 54, color: "#8a9b6e", tilt: 4, floatDelay: 1.3, floatDuration: 4.3 },
  { xPct: 82, yPct: 78, size: 54, color: "#c05e3d", tilt: -5, floatDelay: 1.6, floatDuration: 4.5 },
];

// Every balloon needs its own stroke a shade darker than its own fill
// (standing lesson: self-contained boundary, not relying on neighbors for
// legibility) — deriving it from the fill keeps the two paired
// automatically instead of hand-maintaining a second parallel color array.
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

// Balloon silhouette — body (own radial gradient + stroke), a small knot,
// an offset highlight for shine, and a soft grounding shadow, all scoped to
// this one balloon's own <defs> (IDs suffixed by index) so 7 of these on
// screen at once never collide. The string sways independently via its own
// <motion.g> rotate loop, phase-offset from the body's own idle bob so the
// two motions don't read as perfectly locked together.
function BalloonShape({ slot, index }: { slot: BalloonSlot; index: number }) {
  const gradientId = `balloon-reveal-gradient-${index}`;
  const shadowId = `balloon-reveal-shadow-${index}`;
  const stroke = darken(slot.color, 0.28);
  const viewW = 64;
  const viewH = 100;

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={slot.size}
      height={slot.size * (viewH / viewW)}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff8ef" />
          <stop offset="38%" stopColor={slot.color} />
          <stop offset="100%" stopColor={stroke} />
        </radialGradient>
        <filter id={shadowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <ellipse cx={32} cy={40} rx={22} ry={27} fill="#4a2f26" opacity={0.15} filter={`url(#${shadowId})`} />

      <motion.g
        style={{ transformOrigin: "32px 68px" }}
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: slot.floatDuration * 0.8, repeat: Infinity, ease: "easeInOut", delay: slot.floatDelay }}
      >
        <path d="M32,68 C28,78 36,86 30,100" fill="none" stroke="#6b4332" strokeOpacity={0.45} strokeWidth={1.5} strokeLinecap="round" />
      </motion.g>

      <path d="M27,64 L37,64 L32,72 Z" fill={stroke} />

      <ellipse cx={32} cy={36} rx={26} ry={32} fill={`url(#${gradientId})`} stroke={stroke} strokeWidth={1.5} />

      <ellipse cx={23} cy={22} rx={7} ry={10} fill="#ffffff" opacity={0.42} />
    </svg>
  );
}

interface BurstPiece {
  dx: number;
  dy: number;
  rotate: number;
}

// True runtime randomness — safe without seeding, same reasoning
// interactive/PetalOracle.tsx's own randomDeparture documents: this only
// ever runs from inside handlePop, which only ever fires from a real click,
// never during SSR/first paint.
function randomBurst(): BurstPiece[] {
  return Array.from({ length: 5 }, (_, i) => {
    const angle = (360 / 5) * i + Math.random() * 30;
    const rad = (angle * Math.PI) / 180;
    const distance = 24 + Math.random() * 18;
    return { dx: Math.cos(rad) * distance, dy: Math.sin(rad) * distance, rotate: Math.random() * 180 };
  });
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Bootstrap Icons' own chevron-left glyph, reproduced as a bare path (same
// technique Anniversary's own interactive/RevealCard.tsx documents for its
// SPARKLE_PATH constant) — kept local rather than an npm icon import since
// this file only needs this one extra shape.
function BackChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

// The hub-navigation "leave this object" affordance — deliberately its own
// dedicated button (fixed, top-left) rather than repurposing an existing
// close button, since unlike interactive/MemoryFrames.tsx (which already
// has one natural close affordance at the top of its full-screen view),
// this object's own idle view is just the bouquet itself with no existing
// chrome to repurpose. h-11 (44px tall) real tap target regardless of the
// 16px icon inside it, plus visible "Back" text for extra clarity given
// its more prominent role (leaving the object entirely, not dismissing a
// piece of content within it).
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

interface MessagePanelProps {
  activeIndex: number | null;
  messages: string[];
  allPopped: boolean;
  onDismiss: () => void;
}

// Two independent pieces sharing one component, not one shared container
// anymore. The idle/completion PROMPT (a single line of text) stays in the
// normal page flow, right below the bouquet — small enough that bottom-
// anchoring it was never a problem. The actual MESSAGE CARD (real
// sentence-length content, a real card with padding) previously lived in
// that same in-flow spot too, which is what caused the reported bug: once
// the bouquet sits low enough in the page (long page, small viewport,
// whatever the surrounding template ends up being), an in-flow card below
// it can render past the bottom of the viewport with no way to see the
// rest of it. Fixed here by pulling the card out into its own `fixed`,
// true-viewport-centered layer instead, so it always lands mid-screen
// regardless of where the bouquet itself sits in the page. Deliberately
// NOT a createPortal(document.body) — per this task's own instruction,
// there's no ancestor clipping to escape here (unlike
// interactive/RevealCard.tsx / interactive/PetalOracle.tsx's own modals,
// or this file's own CompletionReveal below), just centering to get right,
// so plain `fixed` is enough and keeps this the lighter-weight of the
// file's two reveal UIs, as originally intended.
function MessagePanel({ activeIndex, messages, allPopped, onDismiss }: MessagePanelProps) {
  return (
    <>
      <div className="relative mx-auto mt-8 min-h-[40px] w-full max-w-sm">
        {/* Standing convention for any text transition in this project:
            AnimatePresence mode="wait" so the idle prompt and the
            completion line can never crossfade/overlap. The message card
            below has its own separate AnimatePresence now (see above) —
            splitting them doesn't reintroduce that overlap risk, since
            each AnimatePresence still only ever shows one of its own
            children at a time. */}
        <AnimatePresence mode="wait">
          {activeIndex === null &&
            (allPopped ? (
              // Completion state — every balloon has been popped and its
              // message already shown balloon-by-balloon, so this is a calm
              // "you found them all" beat rather than another reveal moment
              // (unlike interactive/PetalOracle.tsx's/ConstellationGame.tsx's
              // own completion, which triggers a full reveal card — that
              // pattern doesn't fit here since the payoff already happened
              // per-balloon). Same text treatment as the idle prompt below
              // for visual consistency, plus a small sparkle as the
              // completion indicator the progress dots row alone doesn't
              // provide (all-filled dots read as "done" once you look for
              // them, but don't announce it on their own).
              <motion.p
                key="balloon-reveal-complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5 }}
                className="text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
              >
                Every message found ✨
              </motion.p>
            ) : (
              <motion.p
                key="balloon-reveal-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
              >
                Tap a balloon to find a message
              </motion.p>
            ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            key={`balloon-reveal-message-${activeIndex}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-30 w-[88vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#c9a68a]/50 bg-[#fdf6ec] px-6 py-6 text-center shadow-xl shadow-[#6b4332]/20"
          >
            {/* h-11 w-11 (44x44px) real tap target regardless of the 16px
                icon inside it — same convention Anniversary's own
                interactive/RevealCard.tsx and interactive/PetalOracle.tsx
                close buttons use. Dismisses only the panel's own display;
                the popped balloon stays popped (see this file's own
                doc comment — no reset-on-close here). */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-[#4a2f26]/50 transition-colors hover:text-[#4a2f26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
            >
              <CloseIcon />
            </button>
            <p className="font-display px-2 text-base leading-relaxed text-[#4a2f26]/90 sm:text-lg">
              {messages[activeIndex]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface CompletionRevealProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  photoUrl?: string;
}

function noopSubscribe() {
  return () => { };
}

// The final "you found them all" reveal — a proper fixed+portal modal, in
// contrast to MessagePanel above. Portaled to document.body + `fixed` (not
// `absolute`): a `fixed` element only escapes to the true viewport if no
// ancestor has a transform/filter/perspective, which this component's
// eventual placement inside the Celebration Room's own ambient/ scene
// wrapper may well have — same reasoning interactive/PetalOracle.tsx (V1)
// and interactive/RevealCard.tsx (V2) both document for their own modals,
// reimplemented locally here rather than imported. Warm amber-tinted scrim
// (same rgba(253,196,120,...) family ambient/GoldenSkySection.tsx's own
// Sun/LightRays glows use) instead of a neutral dimmer, so it reads as part
// of this same warm world rather than a generic modal backdrop — same
// choice interactive/PetalOracle.tsx's own reveal card makes.
function CompletionReveal({ isOpen, onClose, message, photoUrl }: CompletionRevealProps) {
  // Gates the portal to client-only render passes — document.body doesn't
  // exist during SSR. Same useSyncExternalStore hydration trick
  // interactive/PetalOracle.tsx's own isMounted uses.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Body-scroll-lock + Escape-to-close while open — same convention
  // interactive/PetalOracle.tsx's own modal uses.
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
              aria-label="Every balloon message found"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="hide-scrollbar relative z-10 flex max-h-[85dvh] w-[90vw] max-w-sm flex-col items-center gap-5 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#c9a68a]/60 bg-[#fdf6ec] px-6 py-10 text-center shadow-[0_25px_50px_-12px_rgba(107,67,50,0.25),inset_0_0_0_1px_rgba(255,251,244,0.5)] sm:px-10"
            >
              {/* h-11 w-11 (44x44px) real tap target regardless of the 16px
                  icon inside it — same convention MessagePanel's own
                  dismiss button above and interactive/PetalOracle.tsx's
                  close button both use. Closing this one no longer resets
                  anything (see this file's own top-level doc comment for
                  why that changed) — same as MessagePanel's own dismiss,
                  it just closes; the popped balloons stay popped either
                  way. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-[#4a2f26]/50 transition-colors hover:bg-[#c9a68a]/15 hover:text-[#4a2f26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
              >
                <CloseIcon />
              </button>

              {photoUrl && (
                <div className="relative mt-2 h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-[#e8c4b0] bg-[#e8c4b0] shadow-lg shadow-[#6b4332]/20">
                  <Image src={photoUrl} alt="A birthday memory" fill sizes="128px" className="object-cover" />
                </div>
              )}

              <p className="font-display text-lg leading-relaxed text-[#4a2f26]/90 sm:text-xl">{message}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
  );
}

export default function BalloonReveal({
  messages,
  completionMessage,
  photoUrl,
  onAllPopped,
  initialPopped,
  onPoppedChange,
  onBack,
}: BalloonRevealProps) {
  // Empty/blank entries fall back to a generic line rather than rendering a
  // blank card; capped at MAX_BALLOONS for the same visual-sanity reason
  // hero/BirthdayGate.tsx caps candles at MAX_CANDLES. Slicing BALLOON_SLOTS
  // to match means fewer than 7 messages just renders a smaller bouquet,
  // no special-casing needed.
  const effectiveMessages = messages
    .slice(0, MAX_BALLOONS)
    .map((message) => (message && message.trim().length > 0 ? message : FALLBACK_MESSAGE));
  const slots = BALLOON_SLOTS.slice(0, effectiveMessages.length);

  // `popped` is one-way: an index can only ever enter this set once, and
  // there's no reset here (unlike interactive/PetalOracle.tsx's own
  // handleClose) — each pop is meant to stay discovered for good, per the
  // spec. Seeded from `initialPopped` (the useState initializer only reads
  // this once, on mount — exactly what's needed here, since this component
  // now genuinely unmounts/remounts on hub navigation and each fresh mount
  // should pick up wherever the parent's own copy last left off).
  const [popped, setPopped] = useState<Set<number>>(new Set(initialPopped ?? []));

  // Reports the full current set upward whenever it changes, rather than
  // calling onPoppedChange inside the setPopped updater above — updater
  // functions must stay pure (no side effects, including calling a parent
  // setState), or React throws "Cannot update a component while rendering
  // a different component." This effect is the correct place for that
  // side effect instead.
  useEffect(() => {
    onPoppedChange?.(Array.from(popped));
  }, [popped, onPoppedChange]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [burst, setBurst] = useState<{ index: number; slot: BalloonSlot; pieces: BurstPiece[] } | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  function handlePop(index: number) {
    if (popped.has(index)) return;

    // Captured before setPopped below (functional update, so popped.size
    // here is still the pre-pop count) — true only for the pop that fills
    // the very last empty slot.
    const isFinal = popped.size + 1 === effectiveMessages.length;

    setPopped((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    setBurst({ index, slot: slots[index], pieces: randomBurst() });
    window.setTimeout(() => setBurst((current) => (current?.index === index ? null : current)), 550);

    // Slight delay so the balloon's own squash-then-pop exit animation
    // reads before the message panel swaps content underneath it.
    window.setTimeout(() => setActiveIndex(index), 150);

    // On the final pop, hold long enough for that last small message to be
    // read (per-balloon flow above) before the bigger completion reveal
    // takes over — a "brief pause," not instant.
    if (isFinal) {
      onAllPopped?.();
      window.setTimeout(() => setShowCompletion(true), 1800);
    }
  }

  // No longer resets on close — see this file's own top-level doc comment
  // for why (templates/BirthdayV1.tsx's hub-and-spoke navigation needs
  // popped state to survive a "Back to hub" round trip, which this used to
  // wipe every time the completion modal was dismissed). Just closes the
  // modal now; `popped` stays exactly as it was.
  function handleCloseCompletion() {
    setShowCompletion(false);
  }

  return (
    <section className="relative">
      {onBack && <BackButton onClick={onBack} />}

      {/* max-w-md (wider than MessagePanel's own capped max-w-sm below) so
          the canvas's md: growth isn't clipped back down by this wrapper —
          MessagePanel stays visually centered and no wider than before
          regardless, since it caps its own width independently. */}
      <div className="mx-auto w-full max-w-md py-10">
        <p className="mb-10 text-center text-sm uppercase tracking-[0.35em] text-[#6b4332]/55">
          Pop a balloon
        </p>

        {/* Responsive canvas — width/height grow at sm:/md: so the
            percentage-positioned bouquet above gets proportionally more
            room on wider viewports rather than just stretching thin; the
            hand-tuned spacing margins BALLOON_SLOTS documents hold at every
            size since they're relative to this box, not absolute px.
            mt-10: the two raised top balloons (indices 1 and 3) already
            poke above this box's own top edge at rest (part of the bouquet
            shape, not a bug), and now bob an extra 18px higher at the peak
            of their idle float — worst case (mobile's smaller canvas,
            since the poke shrinks as the canvas grows at sm:/md:) is
            ~40px above the box top, so this margin needs to clear that or
            the "Pop a balloon" label above starts overlapping the balloons
            at the top of their bob. */}
        <motion.div
          animate={{ opacity: activeIndex !== null ? 0.35 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto mt-5 h-[280px] w-full max-w-[300px] overflow-visible sm:h-[320px] sm:max-w-[380px] md:h-[360px] md:max-w-[440px]"
        >
          {slots.map((slot, index) => (
            <AnimatePresence key={index}>
              {!popped.has(index) && (
                <motion.button
                  type="button"
                  onClick={() => handlePop(index)}
                  aria-label="Pop a balloon to reveal a message"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
                  style={{
                    left: `${slot.xPct}%`,
                    top: `${slot.yPct}%`,
                    width: slot.size + 28,
                    height: slot.size * (100 / 64) + 28,
                  }}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{
                    opacity: 1,
                    y: [0, -18, 0],
                    x: [0, 5, -5, 0],
                    rotate: [slot.tilt - 6, slot.tilt + 6, slot.tilt - 6],
                  }}
                  exit={{
                    scaleX: [1, 1.18, 0.6, 0],
                    scaleY: [1, 0.82, 1.3, 0],
                    opacity: [1, 1, 1, 0],
                    transition: { duration: 0.4, ease: "easeIn" },
                  }}
                  transition={{
                    opacity: { duration: 0.5 },
                    y: { duration: slot.floatDuration, repeat: Infinity, ease: "easeInOut", delay: slot.floatDelay },
                    x: { duration: slot.floatDuration * 1.15, repeat: Infinity, ease: "easeInOut", delay: slot.floatDelay },
                    rotate: { duration: slot.floatDuration, repeat: Infinity, ease: "easeInOut", delay: slot.floatDelay },
                  }}
                >
                  <span className="flex h-full w-full items-center justify-center">
                    <BalloonShape slot={slot} index={index} />
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          ))}

          {/* Pop burst — scoped to that balloon's own slot, not a
              full-screen confetti effect. Purely decorative, so it's kept
              outside the button hierarchy and self-clears via the timeout
              in handlePop above. */}
          {burst && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${burst.slot.xPct}%`, top: `${burst.slot.yPct}%` }}
            >
              {burst.pieces.map((piece, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: 6, height: 6, backgroundColor: burst.slot.color, left: 0, top: 0 }}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                  animate={{ opacity: 0, x: piece.dx, y: piece.dy, rotate: piece.rotate, scale: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </motion.div>

        <MessagePanel
          activeIndex={activeIndex}
          messages={effectiveMessages}
          allPopped={effectiveMessages.length > 0 && popped.size === effectiveMessages.length}
          onDismiss={() => setActiveIndex(null)}
        />

        {/* Minimal progress cue — small dots, one per balloon, filling
            solid as each is popped. Same "one per unit, filled as reached"
            convention Anniversary's interactive/ConstellationGame.tsx (V2)
            and interactive/PetalOracle.tsx (V1) both use, reimplemented
            here in the same warm terracotta already established in this
            file rather than importing either. */}
        <div aria-hidden="true" className="mt-6 flex justify-center gap-2">
          {effectiveMessages.map((_, i) => {
            const filled = popped.has(i);
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

      <CompletionReveal
        isOpen={showCompletion}
        onClose={handleCloseCompletion}
        message={completionMessage}
        photoUrl={photoUrl}
      />
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import BalloonReveal from "@/components/birthdayShared/interactive/BalloonReveal";
//
// <BalloonReveal
//   messages={customData.birthday?.balloonMessages ?? []}
//   completionMessage={customData.birthday?.balloonCompletionMessage ?? ""}
//   photoUrl={photos[0]?.src}
//   initialPopped={poppedBalloons}
//   onPoppedChange={setPoppedBalloons}
//   onBack={() => setActiveView("hub")}
// />
//
// initialPopped/onPoppedChange let the parent template keep its own copy of
// progress alive across a full unmount (navigating to the hub and back only
// remounts this component, it doesn't reload the page) — see this file's own
// top-level doc comment for why that's necessary now. onBack is optional: omit
// it to keep this component fully standalone (no Back button renders).
//
// MessagePanel's own message card is `fixed` + viewport-centered but has no
// createPortal(document.body) — see this file's own doc comment above for
// why: there's no ancestor-clipping scenario to escape here, just
// centering to get right. CompletionReveal (the final "all found" moment)
// DOES use fixed + createPortal(document.body), same as
// interactive/PetalOracle.tsx's own modal — see CompletionReveal's own doc
// comment for why that one's scope is different.
