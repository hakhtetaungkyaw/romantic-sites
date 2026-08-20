"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

// Birthday V1 "Celebration Room" navigation hub — the room's own directory:
// 5 tappable category tiles (Balloons, Gift, Photos, Cake, Wishes),
// scattered at asymmetric, depth-scaled positions (see TILE_PLACEMENTS
// below) rather than lined up in a uniform grid — reads as objects placed
// around a small room, not a menu. Each opens its own object full-screen via
// templates/BirthdayV1.tsx's own activeView state machine (this component
// renders no modal/portal itself — the parent template wraps whichever
// view is active, hub included, in one shared full-screen container), plus
// a CTA once all 5 are discovered, proceeding to closing/GrandFinale.
// Fully self-contained: nothing here
// imports from components/shared/ (Anniversary's tree) or any lib/v1*.ts
// Anniversary constants module, per this project's product-line isolation
// principle, and doesn't import from this file's own siblings either
// (interactive/BalloonReveal.tsx, interactive/GiftUnwrap.tsx,
// interactive/MemoryFrames.tsx, interactive/CakeCustomizer.tsx,
// interactive/WishLetter.tsx) — every icon/gradient/badge below is a fresh,
// small-scale reimplementation, not a shared import, per the project's
// standing sibling-file-isolation convention.
//
// Deliberately hand-drawn SVG icons, not literal emoji, for the tiles —
// every other primary visual element across the Birthday product line
// (hero/BirthdayGate.tsx's cake, interactive/BalloonReveal.tsx's bouquet,
// interactive/GiftUnwrap.tsx's box, interactive/MemoryFrames.tsx's
// polaroids) is a hand-drawn warm-palette illustration, and a tile icon is
// a far more prominent visual role than the small trailing celebratory
// emoji already used elsewhere (e.g. GiftUnwrap's own "Gift Opened 🎁"
// badge) — using emoji as the primary tile glyph would read as a step down
// from that established "premium, not cartoonish" bar.
//
// Palette: the same established V1 family used throughout — terracotta
// #d97a5f, dusty rose #d4919a, rose-gold #c9a68a, muted gold #b8935f,
// cream #fdf6ec/#fffbf2, deep terracotta #c05e3d, bright gold #FFC800 (the
// discovered-checkmark accent, the same token
// interactive/BalloonReveal.tsx's own progress dots already use for their
// filled/glow state) — nothing new invented.
//
// Heading + atmosphere pass: the primary heading now leads with "Happy
// Birthday, {personName}!" (same emotional weight as
// hero/BirthdayGate.tsx's own candle-blow greeting and
// closing/GrandFinale.tsx's own heading, both of which this hub sits
// between), with the former heading's text ("[Name]'s Celebration Room",
// still the `title` prop) demoted to a small eyebrow label above it, and a
// small hand-drawn ConfettiBurstIcon (see below) standing in for what was
// briefly a literal 🎉 — this file avoids emoji as primary visual
// elements, same stance as the 3 tile icons' own doc comment above. The
// 2-row bunting garland is ported from interactive/MemoryFrames.tsx's own
// party-atmosphere pass — same exact recipe, reimplemented locally (see
// BuntingGarland below) rather than reinvented, so this screen's own
// "premium birthday party" atmosphere reads as one consistent world with
// that object's; the matching dot-pattern background is painted one level
// up, by templates/BirthdayV1.tsx, since it needs to cover
// interactive/RoomProgress too (a sibling of this component, not a child —
// see BuntingGarland's own section comment below for why). Layered
// alongside — not replacing — this file's own lantern HeroCenterpiece from
// the prior pass: bunting sits inside the z-10 content layer (a foreground
// detail, always legible), while the lanterns stay in their own z-0 layer
// behind everything.

interface CelebrationHubProps {
  title: string;
  personName?: string;
  balloonsPopped: number;
  balloonsTotal: number;
  balloonsDiscovered: boolean;
  giftDiscovered: boolean;
  galleryDiscovered: boolean;
  cakeDiscovered: boolean;
  wishesDiscovered: boolean;
  onSelectBalloons: () => void;
  onSelectGift: () => void;
  onSelectPhotos: () => void;
  onSelectCake: () => void;
  onSelectWishes: () => void;
  /** Only shown once all 5 objects are discovered — proceeding to the
   *  finale is a deliberate user choice, not an automatic transition, since
   *  they might want to revisit an object first. */
  onProceedToFinale: () => void;
}

function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#fdf6ec] bg-[#FFC800] text-[#4a2f26] shadow-md shadow-[#6b4332]/25"
    >
      <svg viewBox="0 0 16 16" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    </span>
  );
}

// Small 3-balloon cluster, simplified from interactive/BalloonReveal.tsx's
// own full poppable balloons (reimplemented fresh at icon scale, not
// imported — per this file's own isolation note above). Each balloon now
// gets its own continuous bob/sway loop — same y+rotate idle-float
// technique BalloonReveal.tsx's own BALLOON_SLOTS-driven animation uses
// (independent duration/delay per instance so the 3 never move in unison),
// scaled down for icon size and reimplemented locally rather than shared.
// `transformOrigin` is set at each balloon's own string-attachment point
// (its bottom edge) so the sway reads as swinging from a fixed string, not
// the whole balloon drifting as a rigid block.
function BalloonsIcon() {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="hub-balloon-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a05c" />
          <stop offset="100%" stopColor="#d97a5f" />
        </linearGradient>
        <linearGradient id="hub-balloon-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8a8b0" />
          <stop offset="100%" stopColor="#d4919a" />
        </linearGradient>
        <linearGradient id="hub-balloon-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3cf8e" />
          <stop offset="100%" stopColor="#e8b869" />
        </linearGradient>
      </defs>
      <path d="M14 34 C12 30 16 27 14 24" fill="none" stroke="#a9573d" strokeWidth={1} opacity={0.45} />
      <path d="M34 36 C36 32 32 29 34 25" fill="none" stroke="#a9573d" strokeWidth={1} opacity={0.45} />
      <path d="M24 30 C22 27 26 24 24 21" fill="none" stroke="#a9573d" strokeWidth={1} opacity={0.45} />
      <motion.g
        style={{ transformOrigin: "14px 26px" }}
        animate={{ y: [0, -1.6, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
      >
        <ellipse cx={14} cy={16} rx={8.5} ry={10.5} fill="url(#hub-balloon-b)" stroke="#a9573d" strokeWidth={1} />
        <ellipse cx={11.5} cy={12} rx={2.2} ry={2.8} fill="#ffffff" opacity={0.3} />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "33px 28px" }}
        animate={{ y: [0, -1.8, 0], rotate: [3, -5, 3] }}
        transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <ellipse cx={33} cy={18} rx={7.5} ry={9.5} fill="url(#hub-balloon-a)" stroke="#a9573d" strokeWidth={1} />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "24px 20px" }}
        animate={{ y: [0, -2, 0], rotate: [-3, 5, -3] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
      >
        <ellipse cx={24} cy={11} rx={6.5} ry={8.5} fill="url(#hub-balloon-c)" stroke="#a9573d" strokeWidth={1} />
      </motion.g>
    </svg>
  );
}

// Four-point sparkle/twinkle silhouette — same simple geometric-star
// construction interactive/GiftUnwrap.tsx's own sparklePath uses,
// reimplemented locally here rather than imported (per this file's own
// isolation note above).
function sparklePath(size: number): string {
  const s = size;
  const inner = s * 0.15;
  return `M0,${-s} C${inner},${-inner} ${inner},${-inner} ${s},0 C${inner},${inner} ${inner},${inner} 0,${s} C${-inner},${inner} ${-inner},${inner} ${-s},0 C${-inner},${-inner} ${-inner},${-inner} 0,${-s} Z`;
}

// Small confetti-burst accent beneath the heading — replaces a literal 🎉
// emoji with a hand-drawn equivalent, matching this file's own established
// "no emoji as a primary visual element" stance (see this file's top-level
// doc comment on the 3 tile icons for the same reasoning). A handful of
// small rotated rectangle/oval confetti pieces in the established warm
// palette, plus two sparkle accents built from this file's own local
// sparklePath above — the same four-point star construction that traces
// back to Anniversary's own interactive/RevealCard.tsx /
// interactive/ConstellationGame.tsx SPARKLE_PATH, reused here (this file's
// own local copy, not an import — per this file's own isolation note) so
// the sparkle vocabulary stays consistent with the rest of the project
// rather than inventing a new shape. Hand-placed, not random — same
// reasoning every other fixed decorative layout in this project's Birthday
// files gives. Plays a brief one-shot scale/fade-in once, when the heading
// first mounts, rather than looping — a small celebratory flourish, not
// ambient atmosphere.
function ConfettiBurstIcon() {
  return (
    <motion.svg
      viewBox="-26 -16 52 32"
      width={44}
      height={28}
      className="mt-1 overflow-visible"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
    >
      <rect x={-22} y={-7} width={6} height={3.4} rx={1} fill="#d97a5f" transform="rotate(-24 -22 -7)" />
      <rect x={16} y={-9} width={6} height={3.4} rx={1} fill="#e8b869" transform="rotate(28 16 -9)" />
      <ellipse cx={-14} cy={7} rx={3} ry={2} fill="#d4919a" transform="rotate(18 -14 7)" />
      <ellipse cx={20} cy={5} rx={2.8} ry={1.9} fill="#c9a68a" transform="rotate(-32 20 5)" />
      <rect x={-3} y={-13} width={4.6} height={2.8} rx={1} fill="#c96a4f" transform="rotate(50 -3 -13)" />
      <rect x={0} y={10} width={4.6} height={2.8} rx={1} fill="#FFC800" transform="rotate(-18 0 10)" />
      <path d={sparklePath(4.2)} fill="#fff3d6" stroke="#f0a05c" strokeWidth={0.5} transform="translate(-9 -1)" />
      <path d={sparklePath(3.2)} fill="#fff3d6" stroke="#f0a05c" strokeWidth={0.5} transform="translate(10 3)" />
    </motion.svg>
  );
}

// Small wrapped-box glyph, simplified from
// interactive/GiftUnwrap.tsx's own full illustration (reimplemented fresh
// at icon scale, not imported). Two loops layered on top of the otherwise
// static box: a periodic whole-box shake wiggle (a short burst, then a long
// rest via `repeatDelay` — "occasional," not continuous) reusing the same
// brief left-right wobble technique GiftUnwrap.tsx's own ribbon-removal
// shake uses, and two small sparkle glints twinkling continuously near the
// box's top corners, reusing GiftUnwrap.tsx's own IDLE_SPARKLES
// opacity/scale pulse technique — both reimplemented fresh at icon scale.
function GiftIcon() {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="hub-gift-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e4c3" />
          <stop offset="100%" stopColor="#d9a877" />
        </linearGradient>
      </defs>
      <motion.g
        style={{ transformOrigin: "24px 30px" }}
        animate={{ rotate: [0, -5, 5, -4, 4, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 3.3, ease: "easeInOut" }}
      >
        <rect x={10} y={20} width={28} height={17} rx={3} fill="url(#hub-gift-body)" stroke="#a97c50" strokeWidth={1.5} />
        <rect x={7} y={14} width={34} height={8} rx={3} fill="#fffbf2" stroke="#c9a68a" strokeWidth={1.5} />
        <rect x={22} y={14} width={4} height={23} fill="#d97a5f" opacity={0.9} />
        <path d="M24 14 C18 8 14 10 16 15 C19 16 22 15 24 14 Z" fill="#FFC800" stroke="#c99400" strokeWidth={1} />
        <path d="M24 14 C30 8 34 10 32 15 C29 16 26 15 24 14 Z" fill="#FFC800" stroke="#c99400" strokeWidth={1} />
      </motion.g>
      <motion.path
        d={sparklePath(3)}
        fill="#fff3d6"
        stroke="#f0a05c"
        strokeWidth={0.4}
        style={{ transformOrigin: "6px 10px", translate: "6px 10px" }}
        initial={{ opacity: 0.3, scale: 0.7 }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.05, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d={sparklePath(2.4)}
        fill="#fff3d6"
        stroke="#f0a05c"
        strokeWidth={0.4}
        style={{ transformOrigin: "42px 9px", translate: "42px 9px" }}
        initial={{ opacity: 0.3, scale: 0.7 }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.05, 0.7] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
}

// Small 3-polaroid stack glyph, simplified from
// interactive/MemoryFrames.tsx's own idle stack (reimplemented fresh at
// icon scale, not imported — a 3rd, middle card added here so the stack
// reads as a fuller fan, matching MemoryFrames.tsx's own 3-photo
// STACK_PREVIEW_COUNT). Periodically fans further out from its resting
// rotation and settles back — a short animated burst then a long rest via
// `repeatDelay` (same "occasional, not continuous" pacing as GiftIcon's
// own shake above), rather than a constant oscillation, so it reads as a
// deliberate "spread and settle" gesture.
function PhotosIcon() {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} className="overflow-visible" aria-hidden="true">
      <motion.g
        style={{ transformOrigin: "24px 24px" }}
        animate={{ rotate: [0, 0, -3, 0, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
      >
        <rect x={15} y={12} width={18} height={22} rx={2} fill="#f6e4c3" stroke="#c9a68a" strokeWidth={1.1} />
        <rect x={17.2} y={14.2} width={13.6} height={13.6} fill="#e0b98f" opacity={0.7} />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "24px 24px" }}
        animate={{ rotate: [-8, -8, -16, -8, -8] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut", delay: 0.08 }}
      >
        <rect x={12} y={10} width={19} height={23} rx={2} fill="#f0dfc0" stroke="#c9a68a" strokeWidth={1.25} />
        <rect x={14.5} y={12.5} width={14} height={14} fill="#e8c4b0" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "24px 24px" }}
        animate={{ rotate: [8, 8, 16, 8, 8] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut", delay: 0.16 }}
      >
        <rect x={17} y={13} width={19} height={23} rx={2} fill="#fffbf2" stroke="#c9a68a" strokeWidth={1.25} />
        <rect x={19.5} y={15.5} width={14} height={14} fill="#d97a5f" opacity={0.35} />
      </motion.g>
    </svg>
  );
}

// Small single-tier cake glyph, simplified from
// interactive/CakeCustomizer.tsx's own illustration (reimplemented fresh at
// icon scale, not imported). A single flickering candle flame (same
// scaleY/opacity flicker technique hero/BirthdayGate.tsx's own idle-flame
// loop uses, reimplemented locally at icon scale) plus one twinkling
// sparkle for festivity, matching GiftIcon's own sparkle treatment above.
// Upgraded for depth/quality parity with the other 4 tile icons (which all
// carry more gradient/highlight detail than this one originally did): a
// gradient candle stick (was a flat single-tone fill), a two-tone
// gradient flame (was a flat single-tone fill), a soft blurred glow halo
// behind the flame — the same two-layer-bloom idea hero/BirthdayGate.tsx /
// interactive/CakeCustomizer.tsx's own candle flames establish (a soft
// outer glow behind a brighter core), reimplemented locally at icon scale
// rather than shared — and a small glossy highlight on the tier, the same
// "white, low-opacity ellipse" shine treatment BalloonsIcon's own glossy
// balloon highlight above uses.
function CakeIcon() {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="hub-cake-tier" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e4c3" />
          <stop offset="100%" stopColor="#d9a877" />
        </linearGradient>
        <linearGradient id="hub-cake-frosting" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbf2" />
          <stop offset="100%" stopColor="#fdf6ec" />
        </linearGradient>
        <linearGradient id="hub-cake-candle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe4c0" />
          <stop offset="100%" stopColor="#c96a4f" />
        </linearGradient>
        <linearGradient id="hub-cake-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f0930f" />
          <stop offset="100%" stopColor="#ffe3a3" />
        </linearGradient>
        <radialGradient id="hub-cake-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f9c97c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f9c97c" stopOpacity="0" />
        </radialGradient>
        <filter id="hub-cake-glow-blur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <ellipse cx={24} cy={38} rx={16} ry={3} fill="#3d2419" opacity={0.15} />
      <rect x={10} y={26} width={28} height={12} rx={3} fill="url(#hub-cake-tier)" stroke="#a97c50" strokeWidth={1.25} />
      <ellipse cx={16} cy={30} rx={3.4} ry={5.2} fill="#ffffff" opacity={0.18} />
      <path
        d="M9,26 Q13,22 17,26 Q21,22 25,26 Q29,22 33,26 Q37,22 39,26 L39,29 L9,29 Z"
        fill="url(#hub-cake-frosting)"
        stroke="#c9a68a"
        strokeWidth={1}
      />
      <rect x={22.5} y={12} width={3} height={12} rx={1} fill="url(#hub-cake-candle)" />
      <motion.g
        style={{ transformOrigin: "24px 10px" }}
        animate={{ scaleY: [1, 1.15, 0.92, 1.05, 1], opacity: [0.9, 1, 0.85, 0.95, 0.9] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx={24} cy={7} r={5} fill="url(#hub-cake-glow)" filter="url(#hub-cake-glow-blur)" />
        <path
          d="M24,4 C25.6,6.2 25.6,8.4 24,10.6 C22.4,8.4 22.4,6.2 24,4 Z"
          fill="url(#hub-cake-flame)"
          stroke="#c96a4f"
          strokeWidth={0.5}
        />
      </motion.g>
      <motion.path
        d={sparklePath(2.6)}
        fill="#fff3d6"
        stroke="#f0a05c"
        strokeWidth={0.4}
        style={{ transformOrigin: "36px 20px", translate: "36px 20px" }}
        initial={{ opacity: 0.3, scale: 0.7 }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.05, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

// Small shooting-star glyph, simplified from
// interactive/WishLetter.tsx's own transiting star (reimplemented fresh at
// icon scale, not imported). An earlier pass (a uniform-width `<line>`
// capped with a plain `<circle>`) read as a pencil or wand — a straight
// rigid shaft with a round bead on the end is exactly a wand's own
// silhouette, not a star's. Fixed on both counts this pass: the trail is
// now a thin FILLED, TAPERED path (a point at the tail, ~4.8 units wide at
// the head) rather than a uniform-width stroked line, so it reads as a
// wispy comet tail instead of a rigid shaft — and the head is this
// project's own established 4-point sparkle glyph (sparklePath, defined
// above), not a circle, so it's unmistakably a star rather than a bead.
// TILE_PLACEMENTS.wishes.scale below (0.85, still the smallest/farthest of
// the 5 per that entry's own doc comment) keeps the icon sized
// consistently with its 4 siblings at normal zoom. One small
// independently-twinkling sparkle in the icon's otherwise-empty
// bottom-right corner adds festivity, matching GiftIcon/CakeIcon's own
// sparkle treatment. Neither the trail nor the star head's own twinkle
// (opacity floor 0.8, "pulse, never fully off" — same convention as every
// other tile icon's own sparkle accents) ever reaches 0 opacity, so this
// icon can never fully disappear the way an even earlier pass's
// appear/disappear cycle did.
function WishesIcon() {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="hub-wish-trail" gradientUnits="userSpaceOnUse" x1={7} y1={42} x2={33} y2={16}>
          <stop offset="0%" stopColor="#e8b869" stopOpacity={0} />
          <stop offset="100%" stopColor="#e8b869" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      {/* Tapered comet tail — a thin FILLED triangle (a point at the tail,
          widening to ~4.8 units at the head) rather than a uniform-width
          STROKED line. A stroked line + circle is what read as a
          pencil/wand shaft-and-bead; a shape that's actually thin at one
          end and wide at the other, fading via gradient along its own
          length (gradientUnits="userSpaceOnUse" so the fade tracks the
          real tail->head direction, not the shape's bounding box), reads
          as a wispy trail instead. */}
      <path
        d="M7,42 L34.7,17.7 L31.3,14.3 Z"
        fill="url(#hub-wish-trail)"
        style={{ filter: "drop-shadow(0 0 3px rgba(232,184,105,0.45))" }}
      />
      {/* Star head — this project's own established 4-point sparkle glyph
          (sparklePath, defined above), not a plain circle. A circle read
          as a bead/ball tip (the other half of the earlier wand misread);
          a sparkle shape is unmistakably a star. */}
      <motion.path
        d={sparklePath(5)}
        fill="#fff3d6"
        stroke="#e8b869"
        strokeWidth={0.8}
        style={{
          transformOrigin: "50% 50%",
          translate: "38px 11px",
          filter: "drop-shadow(0 0 5px rgba(253,243,223,0.9))",
        }}
        initial={{ opacity: 0.8, scale: 0.9 }}
        animate={{ opacity: [0.8, 1, 0.8], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Small independently-twinkling sparkle for festivity, matching
          GiftIcon/CakeIcon's own sparkle treatment — kept in the icon's
          otherwise-empty bottom-right corner, clear of the trail. */}
      <motion.path
        d={sparklePath(3.2)}
        fill="#fff3d6"
        stroke="#f0a05c"
        strokeWidth={0.5}
        style={{ transformOrigin: "50% 50%", translate: "40px 39px" }}
        initial={{ opacity: 0.3, scale: 0.7 }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.05, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
    </svg>
  );
}

// ---- Hero centerpiece: floating lantern cluster -------------------------
// This screen's own unique visual anchor — the one thing that makes the hub
// itself, not just its tiles, feel like a distinct "signature moment"
// (checked Anniversary's own ambient/NightSky.tsx per this task's own
// instruction for how a template earns one unique focal illustration — a
// centered constellation heart there; this is a genuinely new,
// Birthday-specific idea, not a ported/shared file, since nothing in
// NightSky's own star-field construction applies to a paper-lantern glow).
//
// Chose a floating lantern cluster over a birthday-cake silhouette
// specifically because hero/BirthdayGate.tsx already IS a cake (the
// candle-blow moment the user just passed through to reach this screen) —
// a second cake here would read as a repeat of a motif already spent, not
// a new signature moment. Lanterns are unclaimed territory in this
// product line: warm, unmistakably "celebration," and their layered
// depth (3 instances, varied size/opacity/speed) gives this screen real
// atmosphere without competing with the tiles below for attention.
//
// Purely decorative: aria-hidden, pointer-events-none throughout, CSS
// transform (x/y/rotate via Framer Motion's own transform batching) and
// opacity only — no layout-affecting properties, so this never triggers
// reflow, matching this project's established performance discipline for
// every other idle/ambient loop (IDLE_SPARKLES-style constructs across
// hero/BirthdayGate.tsx, interactive/GiftUnwrap.tsx, this file's own
// GiftIcon above). Absolutely positioned within the section, given its own
// z-0 layer with the actual heading/tile content promoted to z-10 below —
// explicit stacking rather than relying on DOM order, so it can never end
// up on top of (or interfere with the tap targets of) real content
// regardless of render order.
interface LanternConfig {
  leftPct: number;
  topPx: number;
  size: number;
  bodyTop: string;
  bodyBottom: string;
  opacity: number;
  floatDuration: number;
  floatDelay: number;
  driftX: number;
}

// Hand-placed, not random — same reasoning every other fixed decorative
// layout in this project's Birthday files gives (hero/BirthdayGate.tsx's
// SPRINKLES, interactive/BalloonReveal.tsx's BALLOON_SLOTS): needs to look
// like a deliberately arranged cluster, not a regenerated one. Center
// lantern is largest/brightest/closest; the two flanking it are smaller,
// more muted, and drift slower — a simple size+opacity+speed gradient that
// reads as depth (near vs. far) without any real 3D/parallax math.
// Center lantern now drifts further down the scene (topPx 150 vs the prior
// pass's -2) so it shares depth space with the scattered tiles below —
// specifically behind/above the Gift tile, this scene's own closest
// object — rather than being confined to a header strip above them.
const LANTERNS: LanternConfig[] = [
  { leftPct: 14, topPx: 6, size: 28, bodyTop: "#f3cf8e", bodyBottom: "#e8b869", opacity: 0.48, floatDuration: 6.8, floatDelay: 0, driftX: 3 },
  { leftPct: 55, topPx: 150, size: 40, bodyTop: "#f0a05c", bodyBottom: "#d97a5f", opacity: 0.4, floatDuration: 5.6, floatDelay: 0.7, driftX: 4 },
  { leftPct: 86, topPx: 12, size: 26, bodyTop: "#e8a8b0", bodyBottom: "#d4919a", opacity: 0.46, floatDuration: 7.4, floatDelay: 1.5, driftX: 3 },
];

interface LanternProps {
  config: LanternConfig;
  id: number;
}

// One paper lantern: hanging string, top/bottom caps, a gradient globe body
// with soft rib lines, a small tassel, and a blurred warm glow sitting
// behind it all. The float/drift/sway loop lives on an INNER wrapper (not
// the outer positioned div, which only ever sets the static
// left/top/translateX(-50%) centering) — Framer Motion owns the transform
// on whichever element it animates, so keeping the static centering
// transform on a separate, untouched ancestor avoids the two fighting over
// the same CSS property.
function Lantern({ config, id }: LanternProps) {
  return (
    <div
      className="absolute"
      style={{ left: `${config.leftPct}%`, top: config.topPx, transform: "translateX(-50%)", opacity: config.opacity }}
    >
      <motion.div
        animate={{ y: [0, -10, 0], x: [0, config.driftX, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: config.floatDuration, repeat: Infinity, ease: "easeInOut", delay: config.floatDelay }}
      >
        <svg
          viewBox="-20 -34 40 74"
          width={config.size}
          height={config.size * 1.85}
          className="overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`hub-lantern-body-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.bodyTop} />
              <stop offset="100%" stopColor={config.bodyBottom} />
            </linearGradient>
            <radialGradient id={`hub-lantern-glow-${id}`} cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#fff3d6" stopOpacity="0" />
            </radialGradient>
            <filter id={`hub-lantern-blur-${id}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Soft glow beneath the lantern's own body. */}
          <circle cx={0} cy={2} r={20} fill={`url(#hub-lantern-glow-${id})`} filter={`url(#hub-lantern-blur-${id})`} />

          {/* Hanging string. */}
          <line x1={0} y1={-30} x2={0} y2={-16} stroke="#a9573d" strokeWidth={1} opacity={0.4} />

          {/* Top + bottom caps. */}
          <ellipse cx={0} cy={-16} rx={7} ry={3} fill="#e8d4b0" stroke="#a9573d" strokeWidth={0.75} opacity={0.85} />
          <ellipse cx={0} cy={18} rx={6} ry={2.6} fill="#e8d4b0" stroke="#a9573d" strokeWidth={0.75} opacity={0.85} />

          {/* Body + rib lines. */}
          <ellipse
            cx={0}
            cy={1}
            rx={13}
            ry={17}
            fill={`url(#hub-lantern-body-${id})`}
            stroke="#a9573d"
            strokeWidth={0.75}
            opacity={0.92}
          />
          <path d="M-7,-14 C-9,0 -9,10 -6,17" fill="none" stroke="#a9573d" strokeWidth={0.5} opacity={0.3} />
          <path d="M7,-14 C9,0 9,10 6,17" fill="none" stroke="#a9573d" strokeWidth={0.5} opacity={0.3} />

          {/* Tassel. */}
          <line x1={0} y1={20} x2={0} y2={28} stroke="#a9573d" strokeWidth={0.75} opacity={0.4} />
          <circle cx={0} cy={30} r={1.6} fill="#c96a4f" opacity={0.6} />
        </svg>
      </motion.div>
    </div>
  );
}

// Sized to sit above/behind the heading without adding scrollable height —
// `absolute` takes it out of document flow entirely, and its own fixed h-40
// only defines where the 3 lanterns anchor, not a box the layout has to
// make room for.
function HeroCenterpiece() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[420px] overflow-visible">
      {LANTERNS.map((config, i) => (
        <Lantern key={i} config={config} id={i} />
      ))}
    </div>
  );
}

// ---- Ambient confetti/sparkle glints --------------------------------------
// Fills the same background role a prior pass's ambient decorative balloons
// did, but those conflicted semantically with the real "Balloons" tile
// below — a floating balloon in the background reads as "is this the
// object, or decoration?" in a way none of the other 2 tiles' own motifs
// (a wrapped gift, a photo stack) are at risk of. Confetti/sparkle pieces
// have no such conflict: nothing in this room is "a confetti object" to tap,
// so scattering them freely reads unambiguously as atmosphere. Chosen over
// the other two options this task considered — miniature lanterns would
// dilute HeroCenterpiece's own "one signature illustration" role by turning
// it into a repeated pattern instead of a focal moment; ribbon/streamer
// shapes would be a brand-new motif with no existing precedent anywhere in
// this file to extend, whereas confetti pieces already exist right above in
// ConfettiBurstIcon — this reuses that exact visual vocabulary (small
// rotated rects/ovals in the same warm palette, plus this file's own
// sparklePath star) rather than inventing a fourth one. Distributed across
// the FULL section height (an `absolute inset-0` layer, growing with
// content rather than a fixed box), including the lower area below the
// tile scatter zone. pointer-events-none throughout — purely atmospheric,
// never a tap target.
interface AmbientConfettiConfig {
  leftPct: number;
  topPct: number;
  size: number;
  shape: "sparkle" | "rect" | "oval";
  color: string;
  rotate: number;
  duration: number;
  delay: number;
}

// Sparkle-shaped pieces' own `size` bumped (rect/oval pieces unchanged)
// after the previous size (3.5-4.5, rendering at a mere ~7-9 CSS px
// diameter) proved too small to notice against the dot-pattern background
// at normal zoom — now ~6-7.5 (rendering ~12-15px), clearly visible as
// ambient scatter without approaching the ~42-45px scale of the tile
// icons themselves or competing with the heading for attention.
const AMBIENT_CONFETTI: AmbientConfettiConfig[] = [
  { leftPct: 7, topPct: 9, size: 10, shape: "sparkle", color: "#ed6e4b", rotate: -22, duration: 3.2, delay: 0 },
  { leftPct: 93, topPct: 13, size: 14, shape: "sparkle", color: "#efdaa8", rotate: 0, duration: 2.4, delay: 0.6 },
  { leftPct: 4, topPct: 45, size: 9, shape: "sparkle", color: "#d4919a", rotate: 18, duration: 3.4, delay: 1.1 },
  { leftPct: 91, topPct: 40, size: 10, shape: "sparkle", color: "#e8b869", rotate: 30, duration: 3, delay: 0.3 },
  { leftPct: 9, topPct: 66, size: 14, shape: "sparkle", color: "#fff3d6", rotate: 0, duration: 2.6, delay: 1.4 },
  { leftPct: 89, topPct: 75, size: 9, shape: "sparkle", color: "#92d769", rotate: -24, duration: 3.1, delay: 0.8 },
  { leftPct: 12, topPct: 88, size: 10, shape: "sparkle", color: "#c96a4f", rotate: 12, duration: 3.3, delay: 1.8 },
  { leftPct: 38, topPct: 4, size: 15, shape: "sparkle", color: "#edb32b", rotate: 0, duration: 2.4, delay: 0 },
  { leftPct: 47, topPct: 71, size: 12, shape: "sparkle", color: "#8a640b", rotate: 0, duration: 2.6, delay: 0.4 },
  { leftPct: 72, topPct: 91, size: 14, shape: "sparkle", color: "#4b3abc", rotate: 0, duration: 3, delay: 1.8 },
  // Extra pieces leaning hard toward the true left/right edges — these 4
  // are what actually reach into the wide-viewport margins the tile
  // scatter zone itself is capped short of (see that div's own max-w-3xl
  // note above), so a wide desktop viewport still feels intentionally
  // composed out there rather than empty.
  { leftPct: 1.5, topPct: 24, size: 8, shape: "sparkle", color: "#c96a4f", rotate: -14, duration: 3.4, delay: 0.9 },
  { leftPct: 98, topPct: 30, size: 12, shape: "sparkle", color: "#fff3d6", rotate: 0, duration: 2.6, delay: 1.1 },
  { leftPct: 2, topPct: 58, size: 12, shape: "sparkle", color: "#fff3d6", rotate: 0, duration: 2.9, delay: 0.5 },
  { leftPct: 97, topPct: 62, size: 9, shape: "sparkle", color: "#d97a5f", rotate: 26, duration: 3.1, delay: 1.5 },
];

function AmbientConfettiPiece({ config }: { config: AmbientConfettiConfig }) {
  const half = config.size;
  return (
    <motion.svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      width={half * 2}
      height={half * 2}
      className="pointer-events-none absolute overflow-visible"
      style={{ left: `${config.leftPct}%`, top: `${config.topPct}%` }}
      aria-hidden="true"
      initial={{ opacity: 0.35, scale: 0.75, rotate: config.rotate }}
      animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.75, 1.05, 0.75], rotate: config.rotate }}
      transition={{ duration: config.duration, repeat: Infinity, delay: config.delay, ease: "easeInOut" }}
    >
      {config.shape === "sparkle" && <path d={sparklePath(half)} fill="#fff3d6" stroke="#c96a4f" strokeWidth={0.5} />}
      {config.shape === "rect" && (
        <rect x={-half * 0.55} y={-half * 0.32} width={half * 1.1} height={half * 0.64} rx={half * 0.2} fill={config.color} />
      )}
      {config.shape === "oval" && <ellipse cx={0} cy={0} rx={half * 0.55} ry={half * 0.36} fill={config.color} />}
    </motion.svg>
  );
}

function AmbientConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-visible">
      {AMBIENT_CONFETTI.map((config, i) => (
        <AmbientConfettiPiece key={i} config={config} />
      ))}
    </div>
  );
}

// ---- Party atmosphere: bunting garland (dot-pattern background lives one
// level up) ----------------------------------------------------------------
// Both this garland and the dot-pattern background are ported from
// interactive/MemoryFrames.tsx's own party-atmosphere pass, reimplemented
// locally (not imported, per this file's own isolation note above) rather
// than reinvented — same exact recipe, same warm tokens. The background
// itself, however, is NOT painted here: this hub's own root section only
// ever wraps its own content (the heading + tiles + finale CTA), but the
// full "hub" screen also includes interactive/RoomProgress, rendered by
// templates/BirthdayV1.tsx as a SIBLING below this component, not a child
// of it. A background painted only on this file's own section would end
// exactly where this component's own content ends, leaving a visible seam
// above RoomProgress — so templates/BirthdayV1.tsx paints the pattern once,
// on the shared view wrapper that contains both this hub and RoomProgress,
// where it can cover the genuinely full screen regardless of which of the
// two is taller. See that file's own HUB_PATTERN_BACKGROUND for the (same)
// recipe.

// Full warm range across the two rows together — same split
// interactive/MemoryFrames.tsx's own BUNTING_BACK_COLORS/BUNTING_FRONT_COLORS
// use: back row leans cooler-within-warm (cream, rose-gold, dusty rose)
// since it's meant to recede; front row leans hotter (terracotta, gold,
// rust) since it's meant to pop forward.
const BUNTING_BACK_COLORS = ["#f0dfc0", "#c9a68a", "#d4919a", "#f0dfc0", "#c9a68a", "#d4919a", "#f0dfc0"];
const BUNTING_FRONT_COLORS = ["#d97a5f", "#e8b869", "#c96a4f", "#d97a5f", "#e8b869", "#c96a4f"];

interface BuntingRowProps {
  width: number;
  sag: number;
  flagHeight: number;
  colors: string[];
  opacity?: number;
}

// A string of party bunting — same technique
// interactive/MemoryFrames.tsx's own BuntingRow uses: flag positions
// computed along the same quadratic curve as the hanging string itself, so
// they read as actually hanging from it rather than floating in a row
// above it.
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

// Two staggered rows — same technique interactive/MemoryFrames.tsx's own
// BuntingGarland uses: back row set slightly higher, more sag, smaller
// flags, a touch of transparency to recede; front row lower, tauter,
// bigger flags, fully opaque.
function BuntingGarland() {
  return (
    <div className="relative flex flex-col items-center">
      <BuntingRow width={200} sag={10} flagHeight={8} colors={BUNTING_BACK_COLORS} opacity={0.62} />
      <BuntingRow width={164} sag={5} flagHeight={11} colors={BUNTING_FRONT_COLORS} />
    </div>
  );
}

// ---- Spatial "room" placement -------------------------------------------
// Replaces the previous uniform 3-column grid: each tile now sits at a
// hand-placed asymmetric position (Balloons upper-left, Gift lower-center
// and closest, Photos upper-right — a small, believably "placed" cluster,
// not a menu row), with its own scale (near/far depth cue), z-index (closer
// objects occlude farther ones on the small corner overlaps this creates,
// which reads as depth rather than a bug), shadow weight (bigger/softer for
// the closer object, tighter for the farther ones), and its own idle float
// timing (independent duration/delay per tile — the SAME
// "independent-not-synced" idea this file's own 3 tile icons already use
// internally, just applied one level up to the tiles themselves).
interface TilePlacement {
  leftPct: number;
  topPct: number;
  scale: number;
  rotate: number;
  zIndex: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowOffsetY: number;
  floatAmplitude: number;
  floatDuration: number;
  floatDelay: number;
}

const TILE_PLACEMENTS: {
  balloons: TilePlacement;
  gift: TilePlacement;
  photos: TilePlacement;
  cake: TilePlacement;
  wishes: TilePlacement;
} = {
  // Upper-left. Nudged slightly further up/left from the 4-object pass to
  // leave Wishes its own room at top-center.
  balloons: {
    leftPct: 15,
    topPct: 24,
    scale: 0.8,
    rotate: -5,
    zIndex: 10,
    shadowBlur: 16,
    shadowSpread: -10,
    shadowOffsetY: 10,
    floatAmplitude: 5,
    floatDuration: 5.2,
    floatDelay: 0,
  },
  // Lower-right, closest/largest object in the scene — unchanged role
  // across every pass so far.
  gift: {
    leftPct: 72,
    topPct: 76,
    scale: 1.05,
    rotate: 3,
    zIndex: 30,
    shadowBlur: 28,
    shadowSpread: -8,
    shadowOffsetY: 17,
    floatAmplitude: 7,
    floatDuration: 6.4,
    floatDelay: 0.8,
  },
  // Upper-right, mirrored outward from Balloons for the same reason.
  photos: {
    leftPct: 87,
    topPct: 24,
    scale: 0.78,
    rotate: 6,
    zIndex: 10,
    shadowBlur: 14,
    shadowSpread: -10,
    shadowOffsetY: 8,
    floatAmplitude: 4,
    floatDuration: 4.6,
    floatDelay: 1.6,
  },
  // Lower-left, mid-depth between the two upper corner tiles and Gift's own
  // closest role.
  cake: {
    leftPct: 26,
    topPct: 70,
    scale: 0.9,
    rotate: -3,
    zIndex: 20,
    shadowBlur: 22,
    shadowSpread: -9,
    shadowOffsetY: 13,
    floatAmplitude: 6,
    floatDuration: 5.8,
    floatDelay: 1.1,
  },
  // New 5th object — top-center, smallest and farthest of the five (a
  // shooting star belongs high and distant in this small "room"), in the
  // gap Balloons/Photos' own outward nudge above opened up. `scale` raised
  // from an original 0.7 to 0.85 (topPct nudged 9->12 to compensate, so the
  // now-larger tile doesn't poke further up past the scatter zone's own
  // top edge than the original did) after live DOM inspection confirmed
  // 0.7 combined with the icon's own then-small internal geometry rendered
  // the icon at an illegibly small ~4px head circle — see WishesIcon's own
  // doc comment above. Still deliberately the smallest/farthest of the 5
  // (vs. Gift's 1.05 closest/largest), just no longer so small it reads as
  // missing.
  wishes: {
    leftPct: 50,
    topPct: 12,
    scale: 0.85,
    rotate: 2,
    zIndex: 5,
    shadowBlur: 12,
    shadowSpread: -10,
    shadowOffsetY: 6,
    floatAmplitude: 4,
    floatDuration: 5,
    floatDelay: 2,
  },
};

// Height of the scatter zone the 5 placements above are laid out against —
// tall enough that every placement's own scaled bounding box (including
// Gift's own 1.05x, the largest, and Wishes' own topPct: 9 near the very
// top edge) clears both edges with a small margin. Grown from the 4-object
// pass's 320 to fit the 5th (Wishes) tile without tightening every other
// tile's own spacing.
const SCATTER_ZONE_HEIGHT = 340;

interface HubTileProps {
  icon: ReactNode;
  label: string;
  caption: string;
  discovered: boolean;
  onClick: () => void;
  placement: TilePlacement;
}

// One shared tile shape for all 5 categories — icon slot, label, small
// progress/status caption, and a checkmark badge once discovered. Real
// <button>, well past the 44x44px minimum on both axes even at the
// smallest (0.82x) placement scale. Fixed intrinsic size (not `w-full`,
// unlike the old grid version) since sizing now comes from `placement`'s
// own scale, applied on the wrapping element below rather than here — this
// component only needs `placement` for its own depth-matched shadow.
function HubTile({ icon, label, caption, discovered, onClick, placement }: HubTileProps) {
  const shadowColor = discovered ? "rgba(107,67,50,0.4)" : "rgba(107,67,50,0.28)";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative flex w-[104px] min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-4 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
      style={{
        borderColor: discovered ? "#FFC800" : "rgba(169,87,61,0.25)",
        background: discovered
          ? "linear-gradient(to bottom, #fffbf2, #f6e4c3)"
          : "linear-gradient(to bottom, #fdf6ec, #f9ead2)",
        boxShadow: `0 ${placement.shadowOffsetY}px ${placement.shadowBlur}px ${placement.shadowSpread}px ${shadowColor}`,
      }}
    >
      {discovered && <CheckBadge />}
      {icon}
      <span className="font-display text-sm font-medium text-[#4a2f26] sm:text-base">{label}</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-[#6b4332]/55 sm:text-[10px]">{caption}</span>
    </motion.button>
  );
}

// Positions one tile within the scatter zone: a plain, non-animated outer
// div owns the percentage left/top + the static translate(-50%,-50%)
// centering (kept separate from Framer Motion's own transform management —
// same reasoning this file's own Lantern uses its outer div for), while the
// inner motion.div owns rotate/scale (static, from `placement`) plus the
// gentle looping y-bob (independent duration/delay per tile, so the 3
// objects drift out of phase with each other).
function ScatteredTile({ placement, ...tileProps }: HubTileProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${placement.leftPct}%`,
        top: `${placement.topPct}%`,
        transform: "translate(-50%, -50%)",
        zIndex: placement.zIndex,
      }}
    >
      <motion.div
        initial={{ y: 0, rotate: placement.rotate, scale: placement.scale }}
        animate={{ y: [0, -placement.floatAmplitude, 0], rotate: placement.rotate, scale: placement.scale }}
        transition={{ duration: placement.floatDuration, repeat: Infinity, ease: "easeInOut", delay: placement.floatDelay }}
      >
        <HubTile placement={placement} {...tileProps} />
      </motion.div>
    </div>
  );
}

export default function CelebrationHub({
  title,
  personName,
  balloonsPopped,
  balloonsTotal,
  balloonsDiscovered,
  giftDiscovered,
  galleryDiscovered,
  cakeDiscovered,
  wishesDiscovered,
  onSelectBalloons,
  onSelectGift,
  onSelectPhotos,
  onSelectCake,
  onSelectWishes,
  onProceedToFinale,
}: CelebrationHubProps) {
  const allDiscovered =
    balloonsDiscovered && giftDiscovered && galleryDiscovered && cakeDiscovered && wishesDiscovered;

  // Auto-scroll the finale CTA into view whenever the hub mounts with all 5
  // objects already discovered — fixes a real cutoff bug found via live
  // measurement: at realistic mobile heights (confirmed at 375x560, this
  // template's own CSS min-h floor), total hub content (~740px: heading +
  // the 5-tile scatter zone + this CTA) exceeds the visible viewport, so
  // the CTA's own bounding box sits entirely below the fold at the natural
  // scrollTop:0 position the hub view always mounts at (this "hub" view
  // panel remounts fresh — scrollTop:0 — every time it's re-entered, since
  // templates/BirthdayV1.tsx's own AnimatePresence swaps it out by key on
  // every navigation). The parent view wrapper already has its own
  // `overflow-y-auto` (see that file's own doc comment) — genuinely
  // scrollable, not the bug — but nothing ever prompted the user to
  // actually scroll, which is what read as "the button is cut off." A
  // plain DOM `scrollIntoView()` on the button's own ref reaches up through
  // that ancestor regardless of which file owns the actual scrolling
  // element, so no cross-file coordination is needed here.
  //
  // `block: "center"`, not the more obvious `"end"`: `"end"` aligns the
  // button's own bottom edge flush with the viewport's bottom edge (zero
  // clearance) — confirmed via a live screenshot that this collides with
  // interactive/BirthdaySongPlayer.tsx's own `fixed bottom-6 right-6` pill,
  // which sits on every view regardless of activeView and visually
  // obscured the right half of the button. `"center"` leaves comfortable
  // margin on both edges without hardcoding a pixel offset tied to that
  // pill's own current size.
  const ctaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (allDiscovered) {
      ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [allDiscovered]);

  const balloonsCaption = balloonsDiscovered
    ? "All popped"
    : balloonsPopped > 0
      ? `${balloonsPopped} of ${balloonsTotal} popped`
      : "Tap to pop";

  // Same fallback shape closing/GrandFinale.tsx's own heading uses when
  // personName is missing — this hub's own heading is meant to carry the
  // same emotional weight as that greeting (and as
  // hero/BirthdayGate.tsx's own candle-blow greeting before it), not a
  // lesser echo of it. No trailing emoji — see ConfettiBurstIcon above,
  // which replaces what used to be a literal 🎉 here.
  const heading = personName ? `Happy Birthday, ${personName}!` : "Happy Birthday!";

  return (
    <section className="relative flex w-full flex-col items-center px-6 py-5">
      <HeroCenterpiece />
      <AmbientConfetti />

      <div className="relative z-10 flex w-full flex-col items-center">
        <BuntingGarland />

        {/* [Name]'s Celebration Room — demoted to a small eyebrow label
            above the real heading below, same secondary-caption treatment
            every other Birthday screen's own small uppercase label uses. */}
        <p className="mt-2 text-center text-xs uppercase tracking-[0.35em] text-[#6b4332]/55">{title}</p>
        <h1 className="font-display mt-2 text-center text-3xl font-normal text-[#4a2f26] sm:text-4xl">{heading}</h1>
        <ConfettiBurstIcon />

        {/* Scatter zone — replaces the old uniform 3-column grid with 3
            hand-placed, depth-scaled objects (see TILE_PLACEMENTS above).
            Fixed height rather than auto: the tiles inside are `absolute`
            (out of flow), so this element needs an explicit height to
            actually reserve the room they occupy. Width grows at md/lg —
            each tile's own leftPct is a percentage OF THIS element, so
            widening it (rather than touching leftPct itself) is what
            spreads the same 3 positions further apart on desktop while
            leaving mobile (still capped at max-w-sm, same as before)
            untouched. */}
        <div className="relative mt-4 w-full max-w-sm md:max-w-2xl lg:max-w-3xl" style={{ height: SCATTER_ZONE_HEIGHT }}>
          <ScatteredTile
            placement={TILE_PLACEMENTS.balloons}
            icon={<BalloonsIcon />}
            label="Balloons"
            caption={balloonsCaption}
            discovered={balloonsDiscovered}
            onClick={onSelectBalloons}
          />
          <ScatteredTile
            placement={TILE_PLACEMENTS.gift}
            icon={<GiftIcon />}
            label="Gift"
            caption={giftDiscovered ? "Opened" : "Tap to open"}
            discovered={giftDiscovered}
            onClick={onSelectGift}
          />
          <ScatteredTile
            placement={TILE_PLACEMENTS.photos}
            icon={<PhotosIcon />}
            label="Photos"
            caption={galleryDiscovered ? "Viewed" : "Tap to browse"}
            discovered={galleryDiscovered}
            onClick={onSelectPhotos}
          />
          <ScatteredTile
            placement={TILE_PLACEMENTS.cake}
            icon={<CakeIcon />}
            label="Cake"
            caption={cakeDiscovered ? "Decorated" : "Tap to decorate"}
            discovered={cakeDiscovered}
            onClick={onSelectCake}
          />
          <ScatteredTile
            placement={TILE_PLACEMENTS.wishes}
            icon={<WishesIcon />}
            label="Wishes"
            caption={wishesDiscovered ? "Sent" : "Tap to catch a star"}
            discovered={wishesDiscovered}
            onClick={onSelectWishes}
          />
        </div>

        {/* Finale CTA — only appears once all 5 are discovered, and only
            ever proceeds on a deliberate tap (never auto-triggered), so the
            user can freely revisit any object first. Same raised-pill
            treatment interactive/BalloonReveal.tsx's and
            interactive/GiftUnwrap.tsx's own primary action buttons use. */}
        <AnimatePresence>
          {allDiscovered && (
            <motion.button
              key="hub-finale-cta"
              ref={ctaRef}
              type="button"
              onClick={onProceedToFinale}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-display mt-10 rounded-full border border-[#a9573d]/40 bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-9 py-3.5 text-base uppercase tracking-[0.2em] text-[#fdf6ec] shadow-lg shadow-[#6b4332]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] focus-visible:ring-offset-2"
            >
              See the Grand Finale
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx's hub-and-spoke layout) ----
// import CelebrationHub from "@/components/birthdayShared/interactive/CelebrationHub";
//
// <CelebrationHub
//   title={data.title}
//   personName={personName}
//   balloonsPopped={poppedBalloons.length}
//   balloonsTotal={birthday?.balloonMessages.length ?? 0}
//   balloonsDiscovered={balloonsDiscovered}
//   giftDiscovered={Boolean(giftLandedItem)}
//   galleryDiscovered={galleryDiscovered}
//   cakeDiscovered={cakeDiscovered}
//   wishesDiscovered={wishesDiscovered}
//   onSelectBalloons={() => setActiveView("balloons")}
//   onSelectGift={() => setActiveView("gift")}
//   onSelectPhotos={() => setActiveView("photos")}
//   onSelectCake={() => setActiveView("cake")}
//   onSelectWishes={() => setActiveView("wishes")}
//   onProceedToFinale={() => setActiveView("finale")}
// />
//
// This component owns no navigation/progress-tracking state of its own —
// it's a pure display of whatever the parent template already knows, same
// "template owns discovery state, objects just report it" shape
// templates/BirthdayV1.tsx's own doc comment already establishes for the 5
// interactive objects themselves.
