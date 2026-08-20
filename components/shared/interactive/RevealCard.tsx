"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface RevealCardProps {
  isOpen: boolean;
  onClose: () => void;
  /** Shown in the card body once opened. */
  message: string;
  /** Optional Cloudinary-hosted photo shown in the locket frame above the message. */
  photoUrl?: string;
}

// Positions for the photo-frame flourishes, one per clock position
// (12/3/6/9), each straddling the outer ring's edge the same way
// message/LetterCard.tsx's own CornerAccent diamonds straddle the paper's
// corners via negative-offset translates.
const PHOTO_FLOURISH_POSITIONS = [
  "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", // 12 o'clock
  "left-full top-1/2 -translate-x-1/2 -translate-y-1/2", // 3 o'clock
  "left-1/2 top-full -translate-x-1/2 -translate-y-1/2", // 6 o'clock
  "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", // 9 o'clock
];

// Four-point sparkle silhouette (24x24 viewBox) — lucide-react's own
// "Sparkle" icon path, reproduced as a bare path (not the component) so fill
// can be a flat gold rather than currentColor, and it stays a plain inline
// SVG consistent with the rest of this card's hand-drawn shapes. A separate
// local copy from interactive/ConstellationGame.tsx's own identical
// constant (used there for the star shapes, not the divider) rather than an
// import between the two — per this project's convention, feature-level V2
// components stay independent of each other's implementation details even
// when they happen to share a small shape; only genuinely shared UI (this
// card itself) gets its own component and real import.
const SPARKLE_PATH =
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";

function noopSubscribe() {
  return () => {};
}

// ---- Shared reveal card ----------------------------------------------------
// Extracted from interactive/ConstellationGame.tsx (its original home) so
// other V2 interactive moments — e.g. interactive/ShootingStarWish.tsx — can
// open the exact same locket-frame/divider/arched-card payoff instead of
// each reinventing their own reveal UI. Purely presentational: it owns no
// win-condition/game logic of its own, just isOpen/onClose/message/photoUrl.
export default function RevealCard({ isOpen, onClose, message, photoUrl }: RevealCardProps) {
  // Gates the portal below to client-only render passes — document.body
  // doesn't exist during SSR. Same useSyncExternalStore hydration trick
  // message/SealedLetter.tsx (V1) and interactive/PetalOracle.tsx (V1) use
  // for their own portaled modals.
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Portaled to document.body + `fixed` (not the previous `absolute
  // inset-0`), which was the actual root cause of the mobile bugs this
  // fixes — see the file-level comment above for the full diagnosis. A
  // `fixed` element still only escapes to the true viewport if NO ancestor
  // has a transform/filter/perspective (any of those makes that ancestor
  // the containing block instead) — callers like
  // interactive/ConstellationGame.tsx sit inside a whileInView wrapper
  // animating `filter: blur(...)`, which is exactly such an ancestor, so
  // `fixed` alone wasn't going to be enough either. Portaling to
  // document.body sidesteps the question entirely regardless of what any
  // future caller's own ancestor chain looks like.
  return (
    isMounted &&
    createPortal(
      <AnimatePresence>
        {isOpen && (
          // Backdrop tint kept low (/45, only a 2px blur — not backdrop-blur-
          // sm's 4px) so whatever ambient starfield sits behind this card
          // stays faintly visible through the overlay instead of being
          // blotted out by a near-solid panel. Dismissible by clicking
          // anywhere on this layer, same as the close button. py-8
          // guarantees breathing room above/below the card even when
          // max-h-[85vh] below is maxed out on a short viewport.
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onClose}
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d0a1a]/45 px-4 py-8 backdrop-blur-[2px] sm:px-6"
          >
            {/* Positioning anchor for the glow below — plain, unclipped,
                sized to exactly wrap the card. Not itself scrollable, so the
                glow's own -inset-10 bleed can never register as part of any
                element's scrollable-overflow area (see the glow's own
                comment for why that matters). */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-sm"
            >
              {/* Soft ambient glow behind the card — same gold family as
                  message/LetterCard.tsx's own idle glow-pulse — so the card
                  reads as lit from within its own world rather than floating
                  on a flat, unlit backdrop. A SIBLING of the card shell
                  below, not a descendant of it: it used to live inside the
                  scrollable element, and its own -inset-10 (40px bleed past
                  the card's edges on every side) was being counted as part
                  of THAT element's scrollable content — which is what
                  forced a horizontal scrollbar to appear even though
                  nothing was ever meant to scroll sideways. Living out here
                  instead, it still bleeds past the card purely visually
                  (via z-index, not overflow) without ever touching any
                  scroll calculation. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(212,175,122,0.2) 0%, rgba(212,175,122,0) 70%)" }}
              />

              {/* h-11 w-11 (44x44px) guarantees the minimum comfortable
                  touch-target size regardless of the 18px icon inside it.
                  Lives on this unclipped anchor, NOT inside the card shell
                  below — the shell's own overflow-x-hidden/overflow-hidden
                  (needed to clip content to the arch and enforce
                  max-h-[85vh]) also clips to the arch's actual curved
                  silhouette, and the arch's top corners use a 50%-of-width
                  horizontal radius: a button inset only 4-8px from that
                  corner falls squarely inside the ellipse the arch carves
                  away, so it was being clipped out of existence there (not
                  just visually — genuinely unhittable, confirmed via
                  elementFromPoint). Sitting on the anchor instead, it reads
                  as a small badge at the card's corner — a step outside the
                  card's own curve, which is a normal, common pattern for a
                  modal close button — and is never subject to that clip
                  or to the content's own scroll state. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-1 top-1 z-20 flex h-11 w-11 items-center justify-center rounded-full text-[#faf5f0]/50 transition-colors hover:text-[#faf5f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af7a] sm:right-2 sm:top-2"
              >
                <X size={18} />
              </button>

              {/* Card shell — owns the visual shape (border, gradient
                  background, arched top, glow shadow) and caps the whole
                  card at max-h-[85vh]. overflow-hidden here (not auto) is
                  what clips content to the arch correctly; the actual
                  scrolling happens one level deeper, in the flex-1 min-h-0
                  content div below — the classic flexbox pattern for "cap a
                  column's height, let only its inner content scroll." */}
              <div
                className="relative flex max-h-[85vh] w-full flex-col overflow-hidden border border-[#d4af7a]/40 bg-gradient-to-b from-[#1a0a12] via-[#150f30] to-[#0d0a1a] text-center"
                style={{
                  // Same rgba(212,175,122,...) glow stops other V2 gold
                  // accents already use, plus a wider/softer outer bloom.
                  boxShadow:
                    "0 0 4px rgba(212,175,122,0.6), 0 0 9px rgba(212,175,122,0.35), 0 0 44px -10px rgba(212,175,122,0.45)",
                  // Vintage arched-top/locket silhouette: the shorthand is
                  // <horizontal radii> / <vertical radii>, each in
                  // TL TR BR BL order. A wide 50% horizontal + tall 64px
                  // vertical radius on just the two top corners merges them
                  // into one smooth arch at top-center, while the bottom
                  // corners keep a normal small 16px rounding — not
                  // achievable with plain Tailwind rounded-* utilities
                  // alone, hence the inline shorthand.
                  borderRadius: "50% 50% 16px 16px / 64px 64px 16px 16px",
                }}
              >

                {/* Scrollable content — photo/divider/message only. flex-1
                    lets it fill whatever space the capped shell above
                    leaves it; min-h-0 is required alongside flex-1 for
                    overflow-y-auto to actually engage instead of just
                    growing the flex item past its parent's own cap (a flex
                    item's default min-height is auto, i.e. "at least as
                    tall as my content," which silently defeats max-height
                    on an ancestor unless overridden). overflow-x-hidden is
                    a hard backstop alongside the glow fix above — CSS
                    quirk: setting only overflow-y to a non-visible value
                    implicitly computes overflow-x to auto too (not
                    visible), so without this a single unaccounted-for pixel
                    of horizontal overflow would still draw a horizontal
                    scrollbar. hide-scrollbar (globals.css) keeps the
                    overflow-y-auto scroll functionality intact while
                    hiding its track/thumb visually — this card's own gold-
                    bordered aesthetic has no room for a generic OS
                    scrollbar. */}
                <div
                  className="hide-scrollbar flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden p-4 pt-8 sm:gap-4 sm:p-8 sm:pt-12"
                >
                  {photoUrl && (
                    // Locket-style double ring: a thin outer ring with a
                    // small gap before the inner photo circle (rather than
                    // one thick border), plus four small diamond flourishes
                    // at 12/3/6/9 o'clock — same gold diamond
                    // LetterCard.tsx's own CornerAccent uses (h-2 w-2
                    // rotate-45 bg-[#d4af7a] with a matching glow), just
                    // placed around a circle instead of a rectangle's
                    // corners. Sized down further on mobile so the common
                    // case fits without ever needing the scroll fallback
                    // above.
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-44 sm:w-44">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border border-[#d4af7a]/40"
                        style={{ boxShadow: "0 0 4px rgba(212,175,122,0.5)" }}
                      />

                      {PHOTO_FLOURISH_POSITIONS.map((position) => (
                        <span
                          key={position}
                          aria-hidden="true"
                          className={`absolute h-2 w-2 rotate-45 bg-[#d4af7a] ${position}`}
                          style={{ boxShadow: "0 0 5px rgba(212,175,122,0.6)" }}
                        />
                      ))}

                      <div
                        className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#d4af7a]/50 sm:h-40 sm:w-40"
                        style={{ boxShadow: "0 0 4px rgba(212,175,122,0.6), 0 0 9px rgba(212,175,122,0.35)" }}
                      >
                        <Image src={photoUrl} alt="" fill sizes="160px" className="object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Wedding-invitation-style divider: a thin gold line
                      broken by a small centered sparkle. */}
                  <div aria-hidden="true" className="flex w-full max-w-[180px] shrink-0 items-center">
                    <span
                      className="h-px flex-1"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,122,0.6))" }}
                    />
                    <svg
                      viewBox="0 0 24 24"
                      className="mx-2 h-4 w-4 shrink-0"
                      style={{ filter: "drop-shadow(0 0 3px rgba(212,175,122,0.5))" }}
                    >
                      <path d={SPARKLE_PATH} fill="#d4af7a" />
                    </svg>
                    <span
                      className="h-px flex-1"
                      style={{ background: "linear-gradient(90deg, rgba(212,175,122,0.6), transparent)" }}
                    />
                  </div>

                  <p className="font-display text-base leading-relaxed text-[#faf5f0]/90 sm:text-xl">{message}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
  );
}
