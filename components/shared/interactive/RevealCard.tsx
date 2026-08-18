"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

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

// ---- Shared reveal card ----------------------------------------------------
// Extracted from interactive/ConstellationGame.tsx (its original home) so
// other V2 interactive moments — e.g. interactive/ShootingStarWish.tsx — can
// open the exact same locket-frame/divider/arched-card payoff instead of
// each reinventing their own reveal UI. Purely presentational: it owns no
// win-condition/game logic of its own, just isOpen/onClose/message/photoUrl.
export default function RevealCard({ isOpen, onClose, message, photoUrl }: RevealCardProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop tint kept low (/45, only a 2px blur — not backdrop-blur-
        // sm's 4px) so whatever ambient starfield sits behind this card
        // stays faintly visible through the overlay instead of being
        // blotted out by a near-solid panel. Dismissible by clicking
        // anywhere on this layer, same as the close button.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onClose}
          className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0a1a]/45 px-6 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            // Same gate gradient as interactive/UnlockGate.tsx's own
            // overlay (bg-gradient-to-b from-[#1a0a12] via-[#150f30]
            // to-[#0d0a1a]) — this card is meant to feel like part of that
            // same night-sky world, not a generic dark modal.
            className="relative flex max-w-sm flex-col items-center gap-4 border border-[#d4af7a]/40 bg-gradient-to-b from-[#1a0a12] via-[#150f30] to-[#0d0a1a] p-6 pt-10 text-center sm:p-8 sm:pt-12"
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
              // corners keep a normal small 16px rounding — not achievable
              // with plain Tailwind rounded-* utilities alone, hence the
              // inline shorthand.
              borderRadius: "50% 50% 16px 16px / 64px 64px 16px 16px",
            }}
          >
            {/* Soft ambient glow behind the card — same gold family as
                message/LetterCard.tsx's own idle glow-pulse — so the card
                reads as lit from within its own world rather than floating
                on a flat, unlit backdrop. Sits outside the card's opaque
                background via a negative inset, so only the bloom bleeding
                past the card's edges is visible. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(212,175,122,0.2) 0%, rgba(212,175,122,0) 70%)" }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-[#faf5f0]/50 transition-colors hover:text-[#faf5f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af7a]"
            >
              <X size={18} />
            </button>

            {photoUrl && (
              // Locket-style double ring: a thin outer ring with a small
              // gap before the inner photo circle (rather than one thick
              // border), plus four small diamond flourishes at 12/3/6/9
              // o'clock — same gold diamond LetterCard.tsx's own
              // CornerAccent uses (h-2 w-2 rotate-45 bg-[#d4af7a] with a
              // matching glow), just placed around a circle instead of a
              // rectangle's corners.
              <div className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
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
                  className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-[#d4af7a]/50 sm:h-40 sm:w-40"
                  style={{ boxShadow: "0 0 4px rgba(212,175,122,0.6), 0 0 9px rgba(212,175,122,0.35)" }}
                >
                  <Image src={photoUrl} alt="" fill sizes="160px" className="object-cover" />
                </div>
              </div>
            )}

            {/* Wedding-invitation-style divider: a thin gold line broken by
                a small centered sparkle. */}
            <div aria-hidden="true" className="flex w-full max-w-[180px] items-center">
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

            <p className="font-display text-lg leading-relaxed text-[#faf5f0]/90 sm:text-xl">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
