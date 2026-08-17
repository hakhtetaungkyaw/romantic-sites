import type { Variants } from "framer-motion";

// V1's shared scroll-reveal vocabulary — a plain data-layer utility (no
// JSX), same category as lib/v1ButterflyFilters.ts / lib/v1SunflowerColors.ts /
// lib/v1SectionGradients.ts: a handful of values every V1 section imports
// and reuses so entrance timing/feel reads as one consistent system rather
// than seven independently hand-tuned reveals.

// For text (headings, subtitles, quotes, labels) — a quick, light fade +
// slight rise.
export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// For photos and Lottie centerpieces — slower/heavier than fadeUpVariant so
// it reads as a deliberate "focus pull" (starts slightly undersized and
// soft, scales up to full size as it sharpens) rather than just a bigger
// fade.
//
// `visible` optionally accepts a `custom` rotate (in degrees) via Framer
// Motion's per-instance dynamic-variant mechanism (a variant value can be a
// function of the `custom` prop passed to the motion component using it,
// not just a static object). Every consumer that doesn't pass a `custom`
// prop gets rotate 0 — a no-op, since that's the element's default
// transform anyway. gallery/SunlitPolaroids.tsx is the one consumer that
// DOES pass one (its per-card scrapbook tilt, `custom={rotate}`), so that
// card's own final resting angle survives intact through this shared
// variant instead of needing its own locally-redefined copy — a static
// (non-dynamic) variant object can't express "same reveal, but a different
// final rotation per instance" any other way, and importing rather than
// redefining the variant is the point of this file.
export const scaleBlurVariant: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
  visible: (rotate: number = 0) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    rotate,
    transition: { duration: 0.8, ease: "easeOut" },
  }),
};

// Applied to a wrapping motion element (via
// `initial="hidden" whileInView="visible" variants={staggerContainerVariant}`)
// so its motion children — each given fadeUpVariant/scaleBlurVariant and no
// initial/whileInView of their own — reveal one after another as this
// parent's own "visible" state propagates down to them (standard Framer
// Motion variant propagation: a child with a `variants` prop but no
// explicit `initial`/`animate`/`whileInView` of its own inherits whichever
// named state its nearest ancestor is currently in), instead of every
// child firing its reveal at once.
export const staggerContainerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Shared whileInView threshold — reveals fire every time ~30% of the
// element is in view, animating back to "hidden" on scrolling past it in
// either direction and replaying the reveal on re-entry, rather than firing
// once and staying settled.
export const viewportOnce = { once: false, amount: 0.3 };
