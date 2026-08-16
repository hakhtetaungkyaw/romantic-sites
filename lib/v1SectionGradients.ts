// V1 "Golden Hour / Sunset" — the shared base-background gradient applied
// identically to every full-bleed section in templates/AnniversaryV1.tsx.
// Same reasoning as lib/v1ButterflyFilters.ts and lib/v1SunflowerColors.ts:
// a single value multiple files must agree on bit-for-bit is a plain data/
// constants module, not per-file rendering logic — the one deliberate
// exception to V1's usual per-file self-containment convention, for the
// same reason: seven independently-hand-picked gradients is exactly how a
// section drifts out of the family (a flat dark brown, in an earlier pass)
// with nobody able to catch the drift by reading any single file.
//
// A soft near-white gradient, two stops top-to-bottom:
//   #ECE9E6 — warm-neutral light grey (top)
//   #FFFFFF — pure white (bottom)
// Replaces an earlier, warmer 4-stop "Sand & Dusty Rose" version of this
// same constant.
//
// This is a raw CSS `linear-gradient(...)` string (assigned via each
// consuming section's `style` prop), not a Tailwind class fragment — kept
// in that form for consistency with the prior 4-stop version even though
// this one would fit Tailwind's from/to utilities, since some consumers
// still apply it via `style` and a single shared value/application method
// is what actually prevents sections from drifting out of sync. Every
// section applies this exact string identically — one single flat
// gradient, no per-section variation.
export const V1_BACKGROUND_GRADIENT = "linear-gradient(to bottom, #ECE9E6 0%, #FFFFFF 100%)";
