"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import RevealCard from "@/components/shared/interactive/RevealCard";

interface ShootingStarWishProps {
  /** Shown in the reveal card once the shooting star is caught. */
  wishMessage?: string;
  /** Optional Cloudinary-hosted photo shown alongside the wish message. */
  photoUrl?: string;
}

// 8-13s between appearances — still an occasional moment, not a constant
// ambient effect, just more frequent than the original 15-25s. 3-4.5s is how
// long a single star stays on screen before it's gone (caught or missed) —
// long enough to actually notice, track, and tap it, unlike the original
// 1.2-1.8s.
const MIN_INTERVAL_MS = 8000;
const MAX_INTERVAL_MS = 13000;
const MIN_DURATION_S = 3;
const MAX_DURATION_S = 4.5;

// Distance is derived from each star's own randomized duration (below) via
// a fixed-ish speed range, rather than randomized fully independently the
// way the original 1.2-1.8s version did it — at the longer duration,
// independent ranges could occasionally pair a long duration with a short
// distance and read as a slow crawl. Deriving distance = duration × speed
// guarantees every star moves at a controlled, genuinely meteor-like pace
// regardless of which random duration it drew, while still covering a much
// shorter span of the screen than the original corner-to-corner distances
// (340-560px) — a shorter, brisker arc rather than a slow, long one.
const MIN_SPEED_PX_PER_S = 70;
const MAX_SPEED_PX_PER_S = 110;

const DEFAULT_WISH_MESSAGE =
  "Somewhere among these stars, a wish for you just came true.";

interface StarConfig {
  id: number;
  startTop: number; // % from top of the containing section
  startLeft: number; // % from left
  angleDeg: number; // down-and-right diagonal, matching this project's other shooting-star work (ambient/NightSky.tsx)
  travelDistance: number; // px the streak's position moves over its lifetime
  trailLength: number; // px — length of the visible gradient streak itself
  duration: number; // seconds
}

// True runtime randomness (both timing between appearances and each star's
// own trajectory) — deliberately NOT a seeded mulberry32 seqeunce like the
// ambient star *positions* in ConstellationGame.tsx/UnlockGate.tsx/
// LetterCard.tsx use. Those are read during the very first render (part of
// what gets hydrated), so a mismatched value there would be a real
// server/client diff. Nothing here ever runs before mount — `star` starts
// at `null` on both server and client, and only this file's own useEffect
// below (which never executes during SSR) ever calls this — so there is
// nothing for hydration to compare against in the first place, the same
// reasoning ambient/NightSky.tsx's own ShootingStars/randomShootingStar
// documents for its own (purely decorative) shooting streaks. This is a
// fresh, interactive-specific implementation, not imported from that file,
// per this project's convention of V2 files staying independent of each
// other's code.
function randomStar(id: number): StarConfig {
  const duration = MIN_DURATION_S + Math.random() * (MAX_DURATION_S - MIN_DURATION_S);
  const speed = MIN_SPEED_PX_PER_S + Math.random() * (MAX_SPEED_PX_PER_S - MIN_SPEED_PX_PER_S);
  return {
    id,
    startTop: Math.random() * 30,
    startLeft: Math.random() * 55,
    angleDeg: 22 + Math.random() * 18,
    travelDistance: duration * speed,
    // Longer/more visible trail than the original 70-120px — easier to spot
    // against the starfield at the new slower pace.
    trailLength: 90 + Math.random() * 60,
    duration,
  };
}

const CATCH_FLASH_ANIMATE = { scale: [1, 1.7, 1.25], opacity: 1 };
const CATCH_FLASH_TRANSITION = { duration: 0.4, ease: "easeOut" as const };

export default function ShootingStarWish({
  wishMessage = DEFAULT_WISH_MESSAGE,
  photoUrl,
}: ShootingStarWishProps) {
  const [star, setStar] = useState<StarConfig | null>(null);
  const [caught, setCaught] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    let timeoutId = 0;
    const scheduleNext = () => {
      const delay = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      timeoutId = window.setTimeout(() => {
        setCaught(false);
        setStar((current) => randomStar((current?.id ?? 0) + 1));
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCatch = useCallback(() => {
    if (!star || caught) return;
    setCaught(true);
  }, [star, caught]);

  // Fires once the transiting motion.button's animate target (either the
  // full miss trajectory, or the shorter catch-flash) finishes — either way
  // the star's own lifecycle is over. Only a genuine catch opens the reveal.
  const handleAnimationComplete = () => {
    const wasCaught = caught;
    setStar(null);
    if (wasCaught) {
      setShowReveal(true);
    }
  };

  const rad = star ? (star.angleDeg * Math.PI) / 180 : 0;
  const dx = star ? star.travelDistance * Math.cos(rad) : 0;
  const dy = star ? star.travelDistance * Math.sin(rad) : 0;
  const headX = star ? star.trailLength * Math.cos(rad) : 0;
  const headY = star ? star.trailLength * Math.sin(rad) : 0;
  // Hit area is a square well over 2x the visible streak's own footprint,
  // centered on it via flex, so the actual tap target is much more forgiving
  // than the thin gradient line a viewer sees.
  const hitAreaSize = star ? star.trailLength * 2.4 : 0;
  const gradientId = star ? `shooting-star-wish-${star.id}` : undefined;

  return (
    <>
      {/* pointer-events-none at this wrapper level so the whole overlay
          never blocks scrolling, other interactive elements, or content
          underneath it — only the star button itself (pointer-events-auto)
          is ever actually clickable. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {star && (
          <motion.button
            key={star.id}
            type="button"
            onClick={handleCatch}
            aria-label="Catch the shooting star"
            aria-hidden={false}
            className="pointer-events-auto absolute flex items-center justify-center overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af7a]"
            style={{
              top: `${star.startTop}%`,
              left: `${star.startLeft}%`,
              width: hitAreaSize,
              height: hitAreaSize,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={caught ? CATCH_FLASH_ANIMATE : { x: dx, y: dy, opacity: [0, 1, 1, 0] }}
            transition={
              caught
                ? CATCH_FLASH_TRANSITION
                : {
                    x: { duration: star.duration, ease: "easeOut" },
                    y: { duration: star.duration, ease: "easeOut" },
                    // Fades in fast, holds bright through the middle of the
                    // flight, fades out over the final quarter — same pacing
                    // ambient/NightSky.tsx's own decorative streak uses.
                    opacity: { duration: star.duration, times: [0, 0.12, 0.75, 1] },
                  }
            }
            onAnimationComplete={handleAnimationComplete}
          >
            {caught && (
              // Soft bright burst at the catch point, independent of the
              // button's own scale-pulse above — combined they read as a
              // quick "spark catching light" moment rather than just a
              // bigger version of the same streak.
              <motion.span
                aria-hidden="true"
                className="absolute rounded-full"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 1, 0], scale: [0.3, 2.2, 2.8] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  width: hitAreaSize * 0.5,
                  height: hitAreaSize * 0.5,
                  background:
                    "radial-gradient(circle, rgba(253,243,223,0.9) 0%, rgba(212,175,122,0.5) 45%, transparent 75%)",
                }}
              />
            )}

            <svg
              width={star.trailLength}
              height={star.trailLength}
              className="overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  gradientUnits="userSpaceOnUse"
                  x1={0}
                  y1={0}
                  x2={headX}
                  y2={headY}
                >
                  <stop offset="0%" stopColor="#d4af7a" stopOpacity={0} />
                  {/* Mid-stop keeps more of the trail's own length visibly
                      present rather than fading to near-nothing well before
                      the head — a plain 0%->100% ramp left most of the tail
                      too faint to read against the starfield. */}
                  <stop offset="45%" stopColor="#d4af7a" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#d4af7a" stopOpacity={1} />
                </linearGradient>
              </defs>
              <line
                x1={0}
                y1={0}
                x2={headX}
                y2={headY}
                stroke={`url(#${gradientId})`}
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{
                  filter:
                    "drop-shadow(0 0 4px rgba(212,175,122,0.85)) drop-shadow(0 0 8px rgba(212,175,122,0.4))",
                }}
              />

              {/* Bright head core + a soft pulsing "tap me" ring around it —
                  this affordance cue is what ambient/NightSky.tsx's own
                  decorative streak deliberately lacks (a plain gradient line
                  with no head marker), so this one visibly reads as
                  interactive rather than just another background streak. */}
              <circle
                cx={headX}
                cy={headY}
                r={2.2}
                fill="#fdf3df"
                style={{ filter: "drop-shadow(0 0 3px rgba(253,243,223,0.9))" }}
              />
              <motion.circle
                cx={headX}
                cy={headY}
                r={4}
                fill="none"
                stroke="#d4af7a"
                strokeWidth={1.5}
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                style={{ transformOrigin: `${headX}px ${headY}px` }}
              />
            </svg>
          </motion.button>
        )}

        {star && (
          <motion.span
            key={`hint-${star.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: caught ? 0 : [0, 1, 1, 0] }}
            transition={
              caught ? { duration: 0.3 } : { duration: star.duration, times: [0, 0.15, 0.7, 1] }
            }
            className="font-display absolute whitespace-nowrap text-xs uppercase tracking-[0.3em] text-[#d4af7a]/80"
            style={{ top: `calc(${star.startTop}% + 28px)`, left: `${star.startLeft}%` }}
          >
            Catch it
          </motion.span>
        )}
      </div>

      {/* Rendered as a sibling, outside the pointer-events-none wrapper
          above, so its own backdrop-click-to-dismiss and close button work
          normally. Its absolute inset-0 anchors to whatever position:
          relative section this component is placed inside (see the usage
          note at the bottom of this file) — intentionally covering that
          whole section when open, not just this overlay's own bounds. */}
      <RevealCard
        isOpen={showReveal}
        onClose={() => setShowReveal(false)}
        message={wishMessage}
        photoUrl={photoUrl}
      />
    </>
  );
}

// ---- Usage (not yet wired into any page) -----------------------------------
// import ShootingStarWish from "@/components/shared/interactive/ShootingStarWish";
//
// <ShootingStarWish
//   wishMessage="Every star led me back to you."
//   photoUrl="https://res.cloudinary.com/<cloud>/image/upload/.../couple.jpg"
// />
//
// Drop this inside an existing `relative` section that already has its own
// ambient starfield — e.g. ambient/NightSky.tsx's own <section>, or
// hero/CinematicVideo.tsx's hero wrapper — as one more absolutely
// positioned child, the same way that section's own Moon/CloudShape/
// ShootingStars decorations are layered in. Needs a `position: relative`
// ancestor (already true of every such section in this template) for its
// own absolute inset-0 overlay and RevealCard's own absolute inset-0 to
// anchor correctly; no new wrapping section of its own.
//
// Message/photo sourcing: every field on SiteData (types/site.ts) is
// already used somewhere in AnniversaryV2.tsx — message (LetterCard),
// closingLine (Signature), secretNote (ConstellationGame's reveal, via
// LoveNote too) — so there's no distinct, still-unused wish-themed field to
// wire wishMessage from without showing the same note through a third
// surface. DEFAULT_WISH_MESSAGE above is a plain English fallback for that
// reason; if a dedicated field is ever added to SiteData for this, wire it
// then instead. For photoUrl, ConstellationGame already uses
// photos[photos.length - 1] and CinematicVideo already uses photos[0] — a
// genuinely distinct photo only exists when there are at least 3, e.g.:
//   photoUrl={photos.length > 2 ? photos[1]?.src : undefined}
