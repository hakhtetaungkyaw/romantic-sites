import type { Variants } from "framer-motion";

// V2's shared scroll-reveal vocabulary — a plain data-layer utility (no
// JSX), same category as lib/v1ScrollReveal.ts, but V2's own separate copy:
// per this project's architecture rule, V1 and V2 must never import from or
// share component/logic files, even for a near-identical pattern like this
// one. Built fresh here rather than imported, so every V2 section pulls
// from this file and none of them redefine the vocabulary locally, the
// same reasoning V1's copy documents for its own sections.

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

// For photos and centerpiece visual elements — slower/heavier than
// fadeUpVariant so it reads as a deliberate "focus pull" (starts slightly
// undersized and soft, scales up to full size as it sharpens) rather than
// just a bigger fade.
export const scaleBlurVariant: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: "easeOut" },
  },
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
// once and staying settled. Matches this project's current site-wide
// preference (V1's lib/v1ScrollReveal.ts uses the same once:false/amount:0.3
// pair under its own name, viewportOnce — V2's copy is named viewportRepeat
// since "once" would now be a misnomer for what the value actually does).
export const viewportRepeat = { once: false, amount: 0.3 };
