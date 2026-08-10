"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface NightSkySectionProps {
  specialDate: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  minOpacity: number;
  maxOpacity: number;
  minScale: number;
  maxScale: number;
  glow: number;
  glowOpacity: number;
  duration: number;
  delay: number;
  layer: 0 | 1 | 2;
  keepOnMobile: boolean;
  featured: boolean;
}

// Deterministic PRNG (mulberry32) — same fixed seed always produces the same
// sequence, so star positions are stable across server render and client
// hydration (unlike Math.random(), which would differ between the two and
// cause a hydration mismatch).
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_COUNT = 100;

// Computed once at module scope (not per render) from a fixed seed.
// ~18% of stars are "featured": bigger, brighter-peaking, and more visibly
// scaled/glowing, so the eye catches specific stars sparkling rather than a
// uniform shimmer across all ~100 — the rest twinkle more subtly beneath them.
const STARS: Star[] = (() => {
  const rand = mulberry32(1337);
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const featured = rand() < 0.18;
    return {
      x: rand() * 100,
      y: rand() * 100,
      size: featured ? 2.5 + rand() * 1.5 : 1 + rand() * 1.5,
      // Every star dips to roughly the same dim floor — that consistent low
      // point is what makes the swing read as an obvious contrast.
      minOpacity: 0.15 + rand() * 0.08,
      maxOpacity: featured ? 0.92 + rand() * 0.08 : 0.55 + rand() * 0.25,
      minScale: featured ? 0.78 + rand() * 0.07 : 0.85 + rand() * 0.1,
      maxScale: featured ? 1.22 + rand() * 0.13 : 1.05 + rand() * 0.15,
      glow: featured ? 3 + rand() * 3 : rand() * 1.2,
      glowOpacity: featured ? 0.6 + rand() * 0.3 : rand() * 0.15,
      duration: 2.5 + rand() * 1.5,
      delay: rand() * 4,
      layer: Math.floor(rand() * 3) as 0 | 1 | 2,
      // Featured stars stay visible on mobile too, even though most of the
      // background field is thinned out there.
      keepOnMobile: featured || i % 3 === 0,
      featured,
    };
  });
})();

const STAR_LAYERS = [0, 1, 2].map((layer) => STARS.filter((s) => s.layer === layer));

// Hand-placed (not derived from the ambient field) so the outline actually
// reads as a heart. Percentages within the constellation's own 0–100 viewBox.
const CONSTELLATION_POINTS: { x: number; y: number }[] = [
  { x: 50, y: 32 },
  { x: 39, y: 21 },
  { x: 26, y: 27 },
  { x: 22, y: 42 },
  { x: 32, y: 58 },
  { x: 50, y: 76 },
  { x: 68, y: 58 },
  { x: 78, y: 42 },
  { x: 74, y: 27 },
  { x: 61, y: 21 },
];

const CONSTELLATION_PATH = `${CONSTELLATION_POINTS.map((p) => `${p.x},${p.y}`).join(" ")} ${CONSTELLATION_POINTS[0].x},${CONSTELLATION_POINTS[0].y}`;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// UTC-based formatting keeps the date identical between server render and
// client hydration — toLocaleDateString() without a timeZone would use each
// environment's local timezone and could shift a midnight ISO date by a day.
function formatSpecialDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// Caption alternatives considered:
//   "Somewhere under this sky, our story began."
//   "Every star was already writing our story."
// Went with the version closest to the brief — it reads more specific and
// cinematic than the alternatives, and pairs naturally with the date below it.
const CAPTION = "The sky looked like this, the night it all began.";

function StarDot({ star }: { star: Star }) {
  return (
    <div
      className={
        star.keepOnMobile
          ? "absolute rounded-full bg-[#f7f2e7]"
          : "absolute hidden rounded-full bg-[#f7f2e7] sm:block"
      }
      style={
        {
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          opacity: star.minOpacity,
          animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          "--min-opacity": star.minOpacity,
          "--max-opacity": star.maxOpacity,
          "--min-scale": star.minScale,
          "--max-scale": star.maxScale,
          "--glow": `${star.glow}px`,
          "--glow-opacity": star.glowOpacity,
        } as React.CSSProperties
      }
    />
  );
}

export default function NightSkySection({ specialDate }: NightSkySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Different layers drift at different rates for depth — background stars
  // move least, foreground stars move most.
  const yBack = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, -75]);
  const layerTransforms = [yBack, yMid, yFront];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-[#0d0a1a] via-[#150f30] to-[#1e1240] px-6 py-[120px]"
    >
      {STAR_LAYERS.map((layerStars, layerIndex) => (
        <motion.div
          key={layerIndex}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ y: layerTransforms[layerIndex] }}
        >
          {layerStars.map((star, i) => (
            <StarDot key={i} star={star} />
          ))}
        </motion.div>
      ))}

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="font-display text-base italic text-[#e8d9c0]/80 sm:text-lg"
        >
          {CAPTION}
        </motion.p>

        <div className="relative mx-auto mt-10 h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80">
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <motion.polyline
              points={CONSTELLATION_PATH}
              fill="none"
              stroke="#d4af7a"
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {CONSTELLATION_POINTS.map((point, i) => (
              <motion.circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={1.4}
                fill="#f7ecd2"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + i * 0.08,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />
            ))}
          </svg>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          className="font-display mt-10 text-3xl font-medium text-[#d4af7a] sm:text-4xl"
        >
          {formatSpecialDate(specialDate)}
        </motion.p>
      </div>
    </section>
  );
}
