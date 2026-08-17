"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Shared across V1's Lottie-bearing files (hero/SunsetHero.tsx,
// ambient/GoldenSkySection.tsx, message/SealedLetter.tsx,
// countdown/SunflowerCountdown.tsx, closing/SunsetSignature.tsx) so each
// one doesn't reimplement the same IntersectionObserver bookkeeping — a
// plain data/behavior hook (no JSX), so it's fine to share per V1's "reuse
// only shared data-layer utilities, never component files" convention,
// same category as lib/v1ButterflyFilters.ts. Lives in lib/ rather than a
// new hooks/ directory since every other V1-shared cross-file utility
// (v1ButterflyFilters.ts, v1SunflowerColors.ts, v1SectionGradients.ts)
// already lives there — this just continues that pattern, "v1" prefix
// included so it reads unambiguously as V1-only shared logic, never
// reachable from a V2 file.
//
// Consumers attach the returned `ref` to whichever element's on-screen
// presence should gate playback (typically the same wrapper already
// positioning the Lottie), then react to `isInView` in their own effect —
// this hook only tracks visibility, it doesn't know anything about Lottie
// or play/pause itself, so it stays reusable for any "pause expensive work
// while offscreen" need, not just this one.
export function useV1InViewport<T extends Element = HTMLDivElement>(
  rootMargin = "100px",
): { ref: RefObject<T | null>; isInView: boolean } {
  const ref = useRef<T | null>(null);
  // Starts false (not "assume visible") — for anything below the fold at
  // mount, this means playback genuinely never starts until the observer's
  // first callback actually confirms it's on screen, rather than briefly
  // autoplaying and then correcting a frame later. Above-the-fold content
  // catches up as soon as the observer's first (essentially immediate)
  // callback fires.
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Defensive only — every consumer of this hook is a "use client"
    // component that only ever runs in the browser once mounted, so this
    // branch shouldn't be reachable in practice; it just avoids assuming
    // IntersectionObserver exists rather than crashing if it somehow isn't.
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isInView };
}
