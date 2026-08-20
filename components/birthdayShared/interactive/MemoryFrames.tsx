"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { SitePhoto } from "@/types/site";

// Birthday V1 "Celebration Room" interactive object #4 (and final one) — a
// browsable photo gallery, meaningfully different in shape from the other
// three (hero/BirthdayGate.tsx, interactive/BalloonReveal.tsx,
// interactive/GiftUnwrap.tsx): those are all "tap once, get one payoff"
// moments; this one is a "flip through several photos" browsing
// experience, so it never resets and can be freely reopened. Fully
// self-contained: nothing here imports from components/shared/
// (Anniversary's tree) or any lib/v1*.ts Anniversary constants module, per
// this project's product-line isolation principle, and doesn't import from
// this file's own siblings either (hero/BirthdayGate.tsx,
// interactive/BalloonReveal.tsx, interactive/GiftUnwrap.tsx) — per the
// project's standing convention (documented in Anniversary's own
// interactive/RevealCard.tsx) that feature-level interactive/ components
// stay independent of each other's implementation details even where they
// happen to share a technique (e.g. every one of them ends up with some
// kind of fixed+portal modal and a close button).
//
// Palette: only the warm family this task itself specifies — terracotta
// #d97a5f, warm gold/amber #e8b869, dusty rose #d4919a, champagne cream
// #f0dfc0, peach #f0a05c, deep rust #c96a4f, rose-gold #c9a68a — checked
// against ambient/GoldenSkySection.tsx's own documented tokens first (its
// #d97a5f/#d4919a/#c9a68a are the exact same values), so this component's
// palette isn't a fifth independent invention, it's the same family every
// other Birthday object already draws from. Depth (gradients + soft
// shadows) is designed in from the start here rather than shipped flat and
// fixed in a follow-up pass, per this session's own repeated back-and-forth
// on hero/BirthdayGate.tsx's cake and interactive/GiftUnwrap.tsx's wheel.
//
// Both "polaroid" treatments below (the small idle stack and the large
// gallery card) share one recipe — cream/champagne gradient mat, thin warm
// border, warm drop shadow — extending
// ambient/GoldenSkySection.tsx's own PhotoAccent polaroid card (reimplemented
// locally, not imported) rather than inventing an unrelated photo-framing
// style.
//
// Gallery reveal UI: NOT the same fixed+portal "message card" shape
// hero/BirthdayGate.tsx / interactive/BalloonReveal.tsx / interactive/GiftUnwrap.tsx's
// own final reveals all use — those are one-time payoffs; this is a
// repeatable browsing surface. It's still `fixed` + createPortal(document.body)
// (same reasoning as all three: a `fixed` element only reliably escapes to
// the true viewport if no ancestor has a transform/filter/perspective,
// which this component's eventual placement inside the Celebration Room's
// own ambient/ scene wrapper may well have), but the content inside is a
// large single polaroid with prev/next navigation, not a centered
// text-and-badge card.

interface MemoryFramesProps {
  photos: SitePhoto[];
  /** Fired once, the first time the gallery is opened — lets a parent
   *  template track "this object has been discovered" for its own
   *  progress indicator. Unlike the other Birthday objects, browsing
   *  photos has no real "finished" state to wait for, so opening at all
   *  is the natural discovery signal here. */
  onGalleryOpen?: () => void;
  /** When true, skips the idle "tap to see our memories" stack and opens
   *  the gallery immediately on mount — lets a parent template (see
   *  templates/BirthdayV1.tsx's own hub-and-spoke navigation) jump straight
   *  into the gallery when this object is entered from the hub, rather than
   *  making the user tap through a step they've already passed once. Only
   *  read once, at mount (a genuine remount on hub re-entry, not a prop
   *  flip in place). */
  autoOpen?: boolean;
  /** When provided, repurposes this component's own existing "Close
   *  gallery" button/backdrop-tap to call this instead of just closing the
   *  gallery in place — leaving this object via the hub is a genuinely
   *  different action from a plain close. Unlike this file's siblings
   *  interactive/BalloonReveal.tsx and interactive/GiftUnwrap.tsx (which
   *  both needed a brand-new dedicated Back button), this component already
   *  has exactly one natural "leave" affordance, so a second one stacked in
   *  the same corner would just be confusing redundancy. Falls back to the
   *  normal setIsOpen(false) when omitted, keeping this component fully
   *  standalone. */
  onBack?: () => void;
}

// Only the first 3 (or fewer, if there aren't that many) appear in the
// idle stack — the gallery itself still uses every photo in the array,
// this is purely how many peek out from the closed stack.
const STACK_PREVIEW_COUNT = 3;

// Dots become impractical past a certain count (a real customer could
// upload well more than a handful of photos) — beyond this, the "Memory
// 0X" text counter alone still scales fine, so the dot row just stops
// rendering rather than becoming an unreadably long strip.
const MAX_DOTS = 12;

const SWIPE_THRESHOLD = 60;

interface StackSlot {
  x: number;
  y: number;
  rotate: number;
}

// Hand-placed, not formulaic — same reasoning every other fixed decorative
// layout in this project's Birthday files gives (hero/BirthdayGate.tsx's
// SPRINKLES, interactive/BalloonReveal.tsx's BALLOON_SLOTS,
// interactive/GiftUnwrap.tsx's IDLE_SPARKLES): needs to look like a hand-
// tossed stack, not a regenerated one. Index 0 (the front photo) stays
// closest to upright; indices 1-2 fan out further behind it.
const STACK_SLOTS: StackSlot[] = [
  { x: 0, y: 0, rotate: -3 },
  { x: 14, y: 8, rotate: 8 },
  { x: -12, y: 12, rotate: -10 },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

// Bootstrap Icons' own chevron glyphs, reproduced as bare paths (same
// technique interactive/RevealCard.tsx's own SPARKLE_PATH constant
// documents for reusing an icon library's path data without pulling in the
// component) — kept local rather than an npm icon import since this file
// only needs two simple shapes.
function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "left"
      ? "M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z"
      : "M5.646 3.646a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L9.293 8 5.646 4.354a.5.5 0 0 1 0-.708z";
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ---- Birthday-specific festive accents ---------------------------------
// Added after user feedback that this component, on its own, read as an
// elegant romantic keepsake gallery (closer to Anniversary V1's own
// message/SealedLetter.tsx or gallery/SunlitPolaroids.tsx feel) rather than
// something distinctly birthday/celebratory — the other three Birthday
// objects (hero/BirthdayGate.tsx's candle-blow, interactive/BalloonReveal.tsx's
// pop, interactive/GiftUnwrap.tsx's spin wheel) all carry clear party
// energy that this one didn't. Every accent below stays inside the same
// warm family already established (terracotta #d97a5f, warm gold/amber
// #e8b869, dusty rose #d4919a, champagne cream #f0dfc0, deep rust #c96a4f,
// rose-gold #c9a68a) — no new cool tones — and stays subtle/premium rather
// than cartoonish, per this project's own stated design philosophy.

// Four-point sparkle/twinkle silhouette — same simple geometric-star
// construction hero/BirthdayGate.tsx's own sparklePath and
// interactive/GiftUnwrap.tsx's own sparklePath use, reimplemented locally
// here rather than imported (per this project's standing convention that
// feature-level interactive/ components stay independent of each other's
// implementation details).
function sparklePath(size: number): string {
  const s = size;
  const inner = s * 0.15;
  return `M0,${-s} C${inner},${-inner} ${inner},${-inner} ${s},0 C${inner},${inner} ${inner},${inner} 0,${s} C${-inner},${inner} ${-inner},${inner} ${-s},0 C${-inner},${-inner} ${-inner},${-inner} 0,${-s} Z`;
}

// Full warm range across the two rows together — back row leans on the
// cooler-within-warm end (cream, rose-gold, dusty rose) since it's meant
// to recede; front row leans on the hotter end (terracotta, gold, rust)
// since it's meant to pop forward. Between the two, every token this
// task's own palette specifies actually appears somewhere in the garland.
const BUNTING_BACK_COLORS = ["#f0dfc0", "#c9a68a", "#d4919a", "#f0dfc0", "#c9a68a", "#d4919a", "#f0dfc0"];
const BUNTING_FRONT_COLORS = ["#d97a5f", "#e8b869", "#c96a4f", "#d97a5f", "#e8b869", "#c96a4f"];

interface BuntingRowProps {
  width: number;
  sag: number;
  flagHeight: number;
  colors: string[];
  opacity?: number;
}

// A string of party bunting — the single clearest "birthday party," not
// "wedding," visual cue this component adds. Flag positions are computed
// along the same quadratic curve as the string itself (a real hanging line
// always sags in an arc, not a straight row) so they read as actually
// hanging from it rather than floating in a row above it. Configurable
// (width/sag/flag size/color set/opacity) so two differently-tuned
// instances can stack into one fuller garland — see BuntingGarland below —
// rather than this being one fixed thin accent line.
function BuntingRow({ width, sag, flagHeight, colors, opacity = 1 }: BuntingRowProps) {
  const flagCount = colors.length;
  const stringPath = `M0,0 Q${width / 2},${sag * 2} ${width},0`;
  const flagHalfWidth = flagHeight * 0.46;

  return (
    <svg
      viewBox={`0 0 ${width} ${sag * 2 + flagHeight + 4}`}
      width={width}
      height={sag * 2 + flagHeight + 4}
      className="pointer-events-none overflow-visible"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path d={stringPath} fill="none" stroke="#a9573d" strokeWidth={1.25} opacity={0.5} />
      {colors.map((color, i) => {
        const t = (i + 0.5) / flagCount;
        const x = 2 * (1 - t) * t * (width / 2) + t * t * width;
        const y = 2 * (1 - t) * t * (sag * 2);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path
              d={`M${-flagHalfWidth},0 L${flagHalfWidth},0 L0,${flagHeight} Z`}
              fill={color}
              stroke="#a9573d"
              strokeWidth={0.5}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

// Two staggered rows (different width/sag/flag size/depth) rather than one
// thin line — reads as a fuller garland with real depth (back row set
// slightly higher, more sag, smaller flags, and a touch of transparency to
// recede; front row lower, tauter, bigger flags, fully opaque) instead of
// a single accent stripe.
function BuntingGarland() {
  return (
    <div className="relative flex flex-col items-center">
      <BuntingRow width={240} sag={15} flagHeight={11} colors={BUNTING_BACK_COLORS} opacity={0.62} />
      <BuntingRow width={196} sag={8} flagHeight={15} colors={BUNTING_FRONT_COLORS} />
    </div>
  );
}

interface ConfettiPieceConfig {
  x: number;
  y: number;
  rotate: number;
  color: string;
  shape: "rect" | "circle";
  delay: number;
}

// Hand-placed (not random), same reasoning every other fixed decorative
// layout in this project's Birthday files gives: needs to look
// hand-scattered, not regenerate on every render. Positioned relative to
// the photo row's own center, clustered near the polaroid's corners
// rather than scattered across the whole screen — "subtle accents around
// the card," not a full-screen confetti effect.
const CONFETTI_PIECES: ConfettiPieceConfig[] = [
  { x: -148, y: -150, rotate: 20, color: "#e8b869", shape: "rect", delay: 0 },
  { x: 150, y: -140, rotate: -18, color: "#d97a5f", shape: "circle", delay: 0.5 },
  { x: -142, y: 150, rotate: -25, color: "#d4919a", shape: "rect", delay: 1 },
  { x: 148, y: 155, rotate: 30, color: "#c9a68a", shape: "circle", delay: 0.3 },
  { x: -158, y: 0, rotate: 12, color: "#c96a4f", shape: "rect", delay: 0.8 },
];

// A handful of small confetti pieces drifting gently near the polaroid's
// own corners — scoped to that one card, not a full-screen burst (matching
// the same "scoped, not overwhelming" restraint
// interactive/BalloonReveal.tsx's own pop-burst and
// interactive/GiftUnwrap.tsx's own layer-3 burst both already establish
// for celebratory particle effects in this product line).
function ConfettiAccents() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {CONFETTI_PIECES.map((piece, i) => (
        <motion.span
          key={i}
          className={piece.shape === "circle" ? "absolute rounded-full" : "absolute rounded-sm"}
          style={{
            left: `calc(50% + ${piece.x}px)`,
            top: `calc(50% + ${piece.y}px)`,
            width: piece.shape === "circle" ? 7 : 9,
            height: piece.shape === "circle" ? 7 : 6,
            backgroundColor: piece.color,
            rotate: piece.rotate,
          }}
          animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: piece.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

interface DecorativeBalloonConfig {
  x: string;
  y: string;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

// Hand-placed near the modal's own edges/corners — same reasoning every
// other fixed decorative layout in this project's Birthday files gives:
// needs to look intentionally arranged, not regenerated. Deliberately
// simpler and more muted (no highlight ellipse, no knot detail, lower
// opacity) than interactive/BalloonReveal.tsx's own actual poppable
// balloons — these are background atmosphere for this ONE gallery moment,
// not a second version of that other object's own interaction, so they're
// visually subordinate to it on purpose. pointer-events-none throughout:
// purely decorative, never a tap target.
const DECORATIVE_BALLOONS: DecorativeBalloonConfig[] = [
  { x: "2%", y: "6%", size: 44, color: "#d97a5f", rotate: -6, delay: 0, duration: 4.6 },
  { x: "88%", y: "48%", size: 36, color: "#d4919a", rotate: 8, delay: 0.9, duration: 5.2 },
  { x: "6%", y: "80%", size: 38, color: "#c9a68a", rotate: -4, delay: 1.6, duration: 4.9 },
];

function DecorativeBalloon({ config }: { config: DecorativeBalloonConfig }) {
  return (
    <motion.svg
      viewBox="0 0 40 64"
      width={config.size}
      height={config.size * 1.6}
      className="pointer-events-none absolute overflow-visible"
      style={{ left: config.x, top: config.y, opacity: 0.6 }}
      aria-hidden="true"
      animate={{
        y: [0, -10, 0],
        rotate: [config.rotate - 3, config.rotate + 3, config.rotate - 3],
      }}
      transition={{ duration: config.duration, repeat: Infinity, delay: config.delay, ease: "easeInOut" }}
    >
      <path d="M20,58 C16,50 22,44 20,40" fill="none" stroke="#a9573d" strokeOpacity={0.4} strokeWidth={1} />
      <path d="M17,40 L23,40 L20,46 Z" fill="#a9573d" opacity={0.5} />
      <ellipse cx={20} cy={22} rx={16} ry={20} fill={config.color} stroke="#a9573d" strokeOpacity={0.35} strokeWidth={1} />
      <ellipse cx={14} cy={14} rx={4} ry={6} fill="#ffffff" opacity={0.28} />
    </motion.svg>
  );
}

// Simple candle glyph — flame + stick — chosen as the "flanking icon" for
// the bottom counter specifically because it's a birthday-only symbol
// (unlike the sparkle already used near "MEMORY 0X" above, which reads as
// generic celebratory rather than birthday-specific): a candle is
// unambiguous even at this small a size.
function CandleIcon() {
  return (
    <svg viewBox="-6 -11 12 21" width={9} height={16} aria-hidden="true">
      <rect x={-1.6} y={-1} width={3.2} height={9} rx={1} fill="#f0dfc0" stroke="#c9a68a" strokeWidth={0.5} />
      <path
        d="M0,-11 C1.6,-8.8 1.6,-6.6 0,-4.4 C-1.6,-6.6 -1.6,-8.8 0,-11 Z"
        fill="#e8b869"
        stroke="#c96a4f"
        strokeWidth={0.4}
      />
    </svg>
  );
}

interface PolaroidThumbProps {
  photo: SitePhoto;
  slot: StackSlot;
  size: number;
}

// Small, decorative, aria-hidden — the idle stack's own job is just to
// signal "there are photos here, tap me," not to be individually
// legible. Same cream/champagne gradient mat + warm border + warm shadow
// recipe interactive/PolaroidLarge below uses, just smaller and with no
// caption slot.
function PolaroidThumb({ photo, slot, size }: PolaroidThumbProps) {
  return (
    <div
      className="absolute rounded-lg border border-[#e8c4b0] bg-gradient-to-b from-[#fffbf2] to-[#f0dfc0] p-[6px] pb-3 shadow-lg shadow-[#6b4332]/25"
      style={{
        width: size,
        left: `calc(50% - ${size / 2}px + ${slot.x}px)`,
        top: slot.y,
        transform: `rotate(${slot.rotate}deg)`,
      }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-[#e8c4b0]">
        <Image src={photo.src} alt="" fill sizes={`${size}px`} className="object-cover" />
      </div>
    </div>
  );
}

interface PolaroidLargeProps {
  photo: SitePhoto;
}

// The gallery's own large single-photo card — same recipe as
// PolaroidThumb above, scaled up, with a real caption slot in the
// polaroid's own bottom border (the classic handwritten-caption spot on a
// real polaroid). Caption styling was originally the same italic
// font-display treatment ambient/GoldenSkySection.tsx's own love-note line
// uses — dropped the italic and switched to the warmer #c96a4f (deep rust)
// with a touch more weight after feedback that the italic-serif combo
// specifically read as "wedding invitation" rather than "birthday"; the
// serif font-display family itself stays (still this project's own
// established premium type, not a cartoonish swap), just without the
// romantic-script connotation italics carry.
function PolaroidLarge({ photo }: PolaroidLargeProps) {
  return (
    <div className="mx-auto flex w-full max-w-[280px] flex-col rounded-xl border border-[#e8c4b0] bg-gradient-to-b from-[#fffbf2] to-[#f0dfc0] p-2.5 pb-4 shadow-xl shadow-[#6b4332]/30">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#e8c4b0] shadow-inner">
        <Image src={photo.src} alt={photo.caption ?? "A shared memory"} fill sizes="280px" className="object-cover" />
      </div>
      {photo.caption && (
        <p className="font-display mt-3 px-1 text-center text-sm font-medium leading-snug text-[#c96a4f]">
          {photo.caption}
        </p>
      )}
    </div>
  );
}

// Slide-direction-aware entrance/exit — the standard Framer Motion
// carousel pattern: `custom` (the direction, +1 for next / -1 for prev) is
// threaded through so the SAME variant object can produce a mirrored
// animation depending on which way the user navigated, rather than
// needing two separate variant sets.
const PHOTO_SLIDE_VARIANTS = {
  enter: (direction: number) => ({ x: direction > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -36 : 36, opacity: 0 }),
};

interface GalleryViewProps {
  photos: SitePhoto[];
  isOpen: boolean;
  onClose: () => void;
  closeLabel: string;
}

function noopSubscribe() {
  return () => {};
}

// The gallery's own fixed+portal surface — see this file's own top-level
// doc comment for why this is `fixed` + createPortal(document.body) like
// every other Birthday reveal, but NOT the same centered message-card
// layout those reveals use.
function GalleryView({ photos, isOpen, onClose, closeLabel }: GalleryViewProps) {
  // Always starts on the first photo — this component has no reset
  // concept the way the other three Birthday objects do (there's nothing
  // to "replay," it's just open/closed), but starting fresh each time the
  // stack is tapped is still the more natural default than silently
  // resuming wherever the last session left off. Achieved by the PARENT
  // remounting this whole component on every open (see its own openKey
  // below) rather than an effect reacting to the isOpen prop flipping —
  // synchronously calling setState inside an effect just to reset state
  // on a prop change is exactly the pattern React's own
  // react-hooks/set-state-in-effect rule flags; a fresh mount already
  // gives this useState its initial value for free.
  const [[index, direction], setIndexState] = useState<[number, number]>([0, 0]);

  // Gates the portal to client-only render passes — document.body doesn't
  // exist during SSR. Same useSyncExternalStore hydration trick every
  // other portaled modal in this project's Birthday files uses.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Body-scroll-lock + Escape-to-close + arrow-key navigation while open —
  // same convention every other Birthday modal in this project uses for
  // the scroll-lock/Escape half. Arrow navigation calls setIndexState
  // directly (the functional-updater form, reading photos.length from
  // this closure) rather than through the goTo() helper below — goTo
  // itself is a plain function redeclared every render, so depending on it
  // here would mean either re-running this effect (re-attaching the
  // listener) on every render, or disabling the lint rule; reading
  // photos.length directly keeps the dependency array accurate without
  // either.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndexState(([current]) => [(current + 1) % photos.length, 1]);
      }
      if (event.key === "ArrowLeft") {
        setIndexState(([current]) => [(current - 1 + photos.length) % photos.length, -1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, photos.length]);

  function goTo(delta: number) {
    setIndexState(([current]) => {
      const next = (current + delta + photos.length) % photos.length;
      return [next, delta];
    });
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(-1);
  }

  const photo = photos[index];
  const showDots = photos.length > 1 && photos.length <= MAX_DOTS;

  return (
    isMounted &&
    createPortal(
      <AnimatePresence>
        {isOpen && photo && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 py-10"
            style={{
              // Low-opacity offset dot grid (two colors, alternating) layered
              // over the same cream->champagne gradient this modal already
              // used — reads as scattered confetti "party wallpaper" rather
              // than a flat empty backdrop, while staying subtle enough that
              // it never competes with the photo or text for attention.
              backgroundImage:
                "radial-gradient(circle, rgba(217,122,95,0.16) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(212,145,154,0.14) 1.5px, transparent 1.5px), linear-gradient(to bottom, #fdf6ec 0%, #f0dfc0 100%)",
              backgroundSize: "28px 28px, 28px 28px, 100% 100%",
              backgroundPosition: "0 0, 14px 14px, 0 0",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            // Tap-anywhere-outside-the-content-to-close — every OTHER
            // Birthday modal in this project (hero/BirthdayGate.tsx,
            // interactive/BalloonReveal.tsx's completion,
            // interactive/GiftUnwrap.tsx's final reveal) supports this via
            // their own backdrop element; this one didn't, which turned
            // out to be the actual root cause behind a "no way to close
            // it" report — live-verified via a direct background tap that
            // reliably left the gallery open, isolated from every other
            // interaction (the close button itself, rapid re-taps, and
            // taps immediately after a swipe all closed it correctly every
            // time). The content column below stops this from bubbling so
            // tapping the photo/arrows/label doesn't also trigger it.
            onClick={onClose}
          >
            {/* Ambient background balloons — ungated by the stopPropagation
                wrapper below since they're pointer-events-none anyway and
                purely atmospheric; sit at the same level as the backdrop,
                behind the actual content. */}
            {DECORATIVE_BALLOONS.map((config, i) => (
              <DecorativeBalloon key={i} config={config} />
            ))}

            <div className="flex w-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
              {/* Two-row party bunting garland across the top — see
                  BuntingGarland's own doc comment for the staggered-depth
                  reasoning, and BuntingRow's for why this, specifically, is
                  the fix for this component reading as a romantic keepsake
                  gallery rather than a birthday one. */}
              <BuntingGarland />

              {/* h-11 w-11 (44x44px) real tap target regardless of the 16px
                  icon inside it — same convention every close button in this
                  project's Birthday files uses. Persistent soft background
                  (not hover-only, which a touch device never triggers) so
                  it reads as an obviously tappable button at a glance
                  rather than a faint icon in the corner. No reset here on
                  close — this component has nothing to reset, per the
                  spec. */}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="fixed right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#fdf6ec]/70 text-[#6b4332]/70 shadow-sm shadow-[#6b4332]/15 transition-colors hover:bg-[#fdf6ec] hover:text-[#4a2f26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
              >
                <CloseIcon />
              </button>

              {/* Standing convention for any text transition in this
                  project: AnimatePresence mode="wait" so an outgoing
                  counter label and the next one can never crossfade/overlap.
                  Flanking sparkles + a warmer terracotta (was muted brown,
                  matching every other component's plain secondary-caption
                  tone) give this specific label a small celebratory beat
                  rather than reading as just another quiet caption. */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`memory-label-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 flex items-center justify-center gap-2 text-center text-xs uppercase tracking-[0.35em] text-[#d97a5f]"
                >
                  <svg viewBox="-6 -6 12 12" width={10} height={10} aria-hidden="true">
                    <path d={sparklePath(5)} fill="#e8b869" />
                  </svg>
                  Memory {String(index + 1).padStart(2, "0")}
                  <svg viewBox="-6 -6 12 12" width={10} height={10} aria-hidden="true">
                    <path d={sparklePath(5)} fill="#e8b869" />
                  </svg>
                </motion.p>
              </AnimatePresence>

              <div className="relative flex w-full max-w-sm items-center justify-center">
              <ConfettiAccents />
              {/* Prev/next arrows — real <button>s, generous h-11 w-11 hit
                  areas regardless of the 18px chevron inside, positioned
                  just outside the polaroid's own edges so they never
                  overlap the tap-to-swipe photo itself. Hidden entirely
                  when there's only one photo, since there's nowhere to
                  navigate to. */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    aria-label="Previous memory"
                    className="absolute left-0 z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf6ec]/80 text-[#6b4332] shadow-md shadow-[#6b4332]/20 transition-colors hover:bg-[#fdf6ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
                  >
                    <ChevronIcon direction="left" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    aria-label="Next memory"
                    className="absolute right-0 z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf6ec]/80 text-[#6b4332] shadow-md shadow-[#6b4332]/20 transition-colors hover:bg-[#fdf6ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </>
              )}

              {/* Drag lives on this persistent wrapper (never remounted),
                  separate from the slide-transition below (which DOES
                  remount on every index change via AnimatePresence) —
                  combining real touch-drag tracking and a keyed
                  enter/exit animation on the very same element fights
                  itself, since drag directly manipulates x through a
                  different mechanism than the position animation does. */}
              <motion.div
                className="w-full touch-pan-y px-14"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={index}
                    custom={direction}
                    variants={PHOTO_SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <PolaroidLarge photo={photo} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {showDots && (
              <div aria-hidden="true" className="mt-5 flex justify-center gap-2">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: i === index ? "#d97a5f" : "rgba(107,67,50,0.25)",
                      boxShadow: i === index ? "0 0 5px 1px rgba(217,122,95,0.6)" : "none",
                    }}
                  />
                ))}
              </div>
            )}

              {/* Small candle glyphs flanking the counter — see
                  CandleIcon's own doc comment for why a candle specifically
                  was picked here (a birthday-unambiguous symbol, distinct
                  from the generic sparkle already used near the "MEMORY
                  0X" label above), reinforcing the birthday context in a
                  detail a repeat viewer will notice. */}
              <p className="mt-2 flex items-center justify-center gap-2 text-center text-[10px] uppercase tracking-[0.25em] text-[#6b4332]/45">
                <CandleIcon />
                {index + 1} / {photos.length}
                <CandleIcon />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
  );
}

export default function MemoryFrames({ photos, onGalleryOpen, autoOpen, onBack }: MemoryFramesProps) {
  // Seeded once at mount from autoOpen — see this component's own props doc
  // comment above for why: a hub-navigation remount should jump straight
  // into the gallery, skipping the idle stack step.
  const [isOpen, setIsOpen] = useState(Boolean(autoOpen));
  // Incremented on every open, then used as GalleryView's own React `key`
  // below — a fresh key forces a genuine remount, which is what gives
  // GalleryView's own currentIndex state a clean slate each time without
  // needing an effect to reset it.
  const [openKey, setOpenKey] = useState(0);

  // autoOpen seeds `isOpen` straight to true, which means the idle stack's
  // own "Open the memory gallery" button — the only other place
  // onGalleryOpen fires — never renders and never gets tapped, so entering
  // via the hub silently never reported "discovered" for this object. This
  // fires the same signal directly on mount whenever autoOpen bypassed that
  // button, so hub-entry and manual-tap both reliably notify the parent.
  useEffect(() => {
    if (autoOpen) onGalleryOpen?.();
  }, [autoOpen, onGalleryOpen]);
  // Repurposes this component's own existing close affordance for the hub's
  // Back action when provided — see this file's own onBack doc comment for
  // why this component doesn't get a second, redundant Back button.
  const closeGallery = onBack ?? (() => setIsOpen(false));
  const stackPhotos = photos.slice(0, STACK_PREVIEW_COUNT);
  // Rendered back-to-front (index 2, then 1, then 0) so photo 0 — the
  // slot closest to upright, per STACK_SLOTS — ends up last in DOM order
  // and naturally paints on top, without needing explicit z-index.
  const stackRenderOrder = [...stackPhotos].map((photo, i) => ({ photo, slot: STACK_SLOTS[i] })).reverse();

  return (
    <section className="relative px-4 py-12">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        {/* Standing convention for any text transition in this project:
            AnimatePresence mode="wait" — only ever one string mounted here
            (it's part of the whole closed-state block, which simply
            unmounts once the gallery opens), but the same wrapping keeps
            this file consistent with every other caption in the Birthday
            product line. */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.p
              key="memory-frames-caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55"
            >
              Tap to see our memories
            </motion.p>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => {
              setOpenKey((k) => k + 1);
              setIsOpen(true);
              onGalleryOpen?.();
            }}
            aria-label="Open the memory gallery"
            className="relative flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] focus-visible:ring-offset-4"
            style={{ width: 150, height: 190 }}
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Soft grounding shadow beneath the whole stack — same
                "physical object resting on a surface" depth cue
                hero/BirthdayGate.tsx's cake and interactive/GiftUnwrap.tsx's
                box both use, reimplemented here as a plain blurred div
                rather than an SVG filter, since this stack is built from
                real HTML/CSS cards rather than SVG shapes. */}
            <div
              aria-hidden="true"
              className="absolute rounded-full opacity-30 blur-md"
              style={{ width: 100, height: 18, bottom: 4, background: "#3d2419" }}
            />
            {stackRenderOrder.map(({ photo, slot }, i) => (
              <PolaroidThumb key={i} photo={photo} slot={slot} size={112} />
            ))}

            {/* A light touch of the same festive sparkle used throughout
                the gallery — just two glints, enough to hint "something
                celebratory" before the gallery itself opens, without
                turning the idle stack into its own separate effect. */}
            {[
              { x: -6, y: 8, delay: 0 },
              { x: 148, y: 150, delay: 1.1 },
            ].map((glint, i) => (
              <motion.svg
                key={i}
                viewBox="-6 -6 12 12"
                width={14}
                height={14}
                className="absolute overflow-visible"
                style={{ left: glint.x, top: glint.y }}
                aria-hidden="true"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: glint.delay, ease: "easeInOut" }}
              >
                <path d={sparklePath(5)} fill="#e8b869" />
              </motion.svg>
            ))}
          </motion.button>
        )}
      </div>

      <GalleryView
        key={openKey}
        photos={photos}
        isOpen={isOpen}
        onClose={closeGallery}
        closeLabel={onBack ? "Back to celebration room" : "Close gallery"}
      />
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import MemoryFrames from "@/components/birthdayShared/interactive/MemoryFrames";
//
// <MemoryFrames
//   photos={photos}
//   onGalleryOpen={() => setGalleryOpened(true)}
//   autoOpen
//   onBack={() => setActiveView("hub")}
// />
//
// Reuses SiteData's own existing `photos: SitePhoto[]` field directly — no
// new type, no new customData.birthday field, since this is exactly what
// that field already exists for (see types/site.ts's own doc comment on
// BirthdayCustomData: "photos[] -> the Memory Frame gallery's photos").
//
// No reset-on-close here, unlike hero/BirthdayGate.tsx / interactive/BalloonReveal.tsx's
// completion / interactive/GiftUnwrap.tsx's final reveal — this component
// has nothing to reset. GalleryView's own currentIndex reopens at 0 each
// time purely as a sensible default starting point, not because anything
// needs restoring; the gallery itself can be freely opened and closed with
// no state to manage across sessions. autoOpen/onBack are both optional:
// omit them to keep this component fully standalone (idle stack shown on
// mount, its own "Close gallery" button just closes in place).
