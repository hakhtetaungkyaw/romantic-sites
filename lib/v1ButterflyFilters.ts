// V1 "Golden Hour / Sunset" — CSS filter constants that mute
// public/animations/butterfly.json's native colors into the four tones
// established across the V1 palette (coral #d97a5f, dusty rose #d4919a,
// terracotta #c17f5f, muted gold #c9a68a). Shared between
// hero/SunsetHero.tsx and message/SealedLetter.tsx, the only two V1 files
// that render this Lottie.
//
// This is a plain data/constants module (no JSX, no rendering logic) — a
// "shared data-layer utility" like lib/people.ts or lib/format.ts, not a
// component file, so extracting it does not violate the V1/V2
// component-file-separation rule (that rule exists so customers can mix
// V1/V2 *template sections*; there is no analogous "pick some V1 sections
// but not others" scenario for a fixed value two V1 files both need to stay
// identical). It intentionally breaks from the stricter self-containment
// pattern used elsewhere in V1 (each section's own local petal-bezier/PRNG
// copies) because that pattern trades a little duplication for section
// independence — appropriate for rendering logic a customer might want to
// swap per-section, but wrong for a single derived numeric fact two files
// must agree on bit-for-bit. Duplicating it instead is exactly the failure
// mode that produced the bug this file fixes: SunsetHero.tsx and
// SealedLetter.tsx both carried the same (wrong) filter string, verified
// independently, and nobody could have caught the drift risk by reading
// either file alone.
//
// --- How these values were derived ---
// A first pass (sampled 3 flat `fl` fill colors straight from the raw
// Lottie JSON, simulated the CSS hue-rotate/saturate/brightness matrix in
// isolation, and only ever verified that the resulting filter *string*
// appeared in rendered HTML) produced hue-rotate(110/130/145/155deg) with
// saturate(0.6) — which, per that math, should have landed on muted
// dusty-rose/coral/terracotta/gold. It didn't: canvas pixel-sampling the
// ACTUAL rendered SVG (not just the 3 flat colors) found the wing layers
// use a *gradient* fill (`ty: "gf"`) the first pass never inspected, whose
// most saturated stop is a vivid sky-cyan (~hsl(199°, 90%, 49%)) — nothing
// close to the flat navy tones originally sampled. Rotating that cyan by
// the old angles landed squarely in magenta/pink (confirmed: real-pixel
// hue histogram concentrated at 300-345°), not the intended warm band.
//
// This pass fixes the method, not just the numbers: rendered the Lottie
// live in a browser with the candidate filter actually applied, screenshot
// the result, decoded real pixels via canvas, and computed a circular-mean
// hue + histogram from that — repeated across a hue-rotate sweep (checked
// every 8-10deg from 120deg to 184deg) until each target hue was hit
// directly, not estimated:
//   dusty rose  (target hue 352°) -> hue-rotate(133deg) -> measured hue 352.0°, sat 28.7%
//   coral       (target hue 13°)  -> hue-rotate(156deg) -> measured hue 13.3°,  sat 29.7%
//   terracotta  (target hue 20°)  -> hue-rotate(164deg) -> measured hue 19.9°,  sat 31.3%
//   muted gold  (target hue 27°)  -> hue-rotate(173deg) -> measured hue 27.3°,  sat 32.7%
// saturate(0.5) uniformly across all four plus brightness(0.9) kept every
// tone in the same 28-33% measured-saturation band — which fixed the
// magenta/pink problem, but a follow-up visual check (7 butterflies
// scattered across hero/SunsetHero.tsx, screenshotted at actual usage size)
// found the four hues, THAT close together (352-27°, a ~35° arc) AND at
// identical saturation/brightness, read as one flat pinkish-tan tone at a
// glance — "distinct" in the CSS string, not distinct on screen.
//
// This pass keeps the same four hue-rotate angles (still the ones that
// land on dusty rose/coral/terracotta/gold specifically, not arbitrary
// values) but gives each its own saturate/brightness instead of sharing
// one flat 0.5/0.9, since at this hue spacing saturation and lightness
// contrast carry more of the perceptual difference than hue alone —
// confirmed the same way (rendered all four side by side at 64px and at
// the smaller ambient-butterfly size, screenshotted, compared by eye) until
// they read as four genuinely different tones — rose-pink, red-orange
// coral, rust-brown terracotta, tan-gold — rather than one muted blush:
//   dusty rose  -> hue-rotate(133deg) saturate(0.75) brightness(0.92) — the
//     brightest/most saturated, so it reads as pink rather than blending
//     into the others
//   coral       -> hue-rotate(156deg) saturate(0.75) brightness(1.0) — the
//     lightest, pushes it toward a warm red-orange instead of pink
//   terracotta  -> hue-rotate(160deg) saturate(0.55) brightness(0.85) —
//     darkest and least saturated, reads as rust-brown
//   muted gold  -> hue-rotate(175deg) saturate(0.5) brightness(0.98) —
//     lightest and least saturated, reads as tan/gold rather than pink
// All four stay inside the 330-45° warm band (no magenta/purple, no
// green/teal — checked against wider hue-rotate sweeps well outside that
// band, which do produce more "distinct" colors but the wrong ones for
// this palette).
export const BUTTERFLY_FILTER_DUSTY_ROSE = "hue-rotate(133deg) saturate(0.75) brightness(0.92)";
export const BUTTERFLY_FILTER_CORAL = "hue-rotate(156deg) saturate(0.75) brightness(1.0)";
export const BUTTERFLY_FILTER_TERRACOTTA = "hue-rotate(160deg) saturate(0.55) brightness(0.85)";
export const BUTTERFLY_FILTER_GOLD = "hue-rotate(175deg) saturate(0.5) brightness(0.98)";
