// V1 "Golden Hour / Sunset" — shared color constants for every sunflower
// silhouette (SVG petal-path shape, not the real Lottie assets) across V1.
// Same reasoning as lib/v1ButterflyFilters.ts: a color two or more files
// must agree on bit-for-bit is a single derived fact, not per-file
// rendering logic, so it's a plain data/constants module (no JSX) shared
// between hero/SunsetHero.tsx (its field's foreground tier only — the
// mid/background tiers keep their own separate muted terracotta, unrelated
// to this palette), message/SealedLetter.tsx, gallery/SunlitPolaroids.tsx,
// countdown/SunflowerCountdown.tsx, and timeline/SunsetTimeline.tsx — the
// sunflower-silhouette counterpart to that file's butterfly-filter
// constants. This intentionally breaks from V1's stricter self-containment
// convention (each section's own local petal-bezier/PRNG copies) for the
// same reason that file does: duplicating a single shared color value
// across files is exactly how it drifts out of sync, not a case where
// per-section independence is actually wanted.
//
// Both values are pixel-sampled from the real public/animations/sunflower.json
// Lottie as it renders unfiltered in ambient/GoldenSkySection.tsx (also used
// unfiltered in countdown/SunflowerCountdown.tsx's and
// closing/SunsetSignature.tsx's centerpieces) — not read off the raw JSON's
// declared shape-fill values, since those can be gradients whose visible
// on-screen color differs from any single declared stop (same reasoning/
// methodology as lib/v1ButterflyFilters.ts's derivation: render the real
// asset, decode actual pixels, don't infer from source data). Method: the
// Lottie was rendered via lottie-web's canvas renderer at 800x800,
// unfiltered, paused at two different frames (frame 10 and frame 60 of its
// 112-frame loop) to confirm stability across the animation, then every
// rendered pixel was decoded via canvas getImageData and bucketed by
// rounded RGB to find the most frequent (dominant) fill in the petal
// (yellow/orange hue) and center-disc (dark brown hue) ranges. Both frames
// agreed almost exactly (petal ~40.1-40.2% of non-background pixels either
// way, center-disc cluster ~3.9-4.0%): the petals' dominant/base fill is
// #FFC800, the center disc's dominant fill is #6C3010. (The petals and
// disc are each gradient-filled in the source, producing a cascade of
// nearby secondary shades at lower frequency — #FFC800 and #6C3010 are
// each that gradient's single largest, most representative bucket, not an
// average or a guess.)
export const SUNFLOWER_PETAL_COLOR = "#FFC800";
export const SUNFLOWER_CENTER_COLOR = "#6C3010";
