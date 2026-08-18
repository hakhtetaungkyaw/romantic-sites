"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import ShootingStarWish from "@/components/shared/interactive/ShootingStarWish";
import { fadeUpVariant, viewportRepeat } from "@/lib/v2ScrollReveal";

interface NightSkySectionProps {
  specialDate: string;
  /** Optional Cloudinary-hosted photo shown in ShootingStarWish's reveal card. */
  wishPhotoUrl?: string;
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

interface Cloud {
  id: number;
  top: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  direction: 1 | -1;
}

const CLOUD_COUNT = 4;

// Same deterministic-seed trick as STARS above (different seed) — cloud
// layout is fixed at module scope, so it's identical on server and client
// with no client-only gating needed.
const CLOUDS: Cloud[] = (() => {
  const rand = mulberry32(4242);
  return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    id: i,
    top: 6 + rand() * 30,
    scale: 0.8 + rand() * 0.7,
    opacity: 0.1 + rand() * 0.1,
    duration: 80 + rand() * 70,
    // Negative delay starts each cloud partway through its cycle, so they
    // don't all bunch up at the same entrance edge.
    delay: -(rand() * 80),
    direction: i % 2 === 0 ? 1 : -1,
  }));
})();

// Classic "two overlapping circles" crescent technique: a mask punches a
// second, offset circle out of the main disc, leaving a lit sliver. Crater
// points are pre-checked (by hand) to sit inside that sliver — far enough
// from both the cutout boundary and the outer rim that they read as texture
// rather than clipped half-dots.
const MOON_DISC = { cx: 30, cy: 33, r: 21 };
const MOON_CUTOUT = { cx: 39, cy: 24, r: 20 };
const MOON_CRATERS = [
  { cx: 22, cy: 40, r: 1.8, opacity: 0.35 },
  { cx: 24, cy: 44, r: 1.3, opacity: 0.3 },
  { cx: 16, cy: 34, r: 1.6, opacity: 0.3 },
  { cx: 18, cy: 31, r: 1.1, opacity: 0.28 },
];

function MoonCrescentSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <defs>
        <radialGradient id="vowx-moon-gradient" cx="38%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#faf0d8" />
          <stop offset="100%" stopColor="#e0c084" />
        </radialGradient>
        <mask id="vowx-moon-mask">
          <rect width="64" height="64" fill="white" />
          <circle cx={MOON_CUTOUT.cx} cy={MOON_CUTOUT.cy} r={MOON_CUTOUT.r} fill="black" />
        </mask>
      </defs>
      <g mask="url(#vowx-moon-mask)">
        <circle
          cx={MOON_DISC.cx}
          cy={MOON_DISC.cy}
          r={MOON_DISC.r}
          fill="url(#vowx-moon-gradient)"
        />
        {MOON_CRATERS.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#b99a68" opacity={c.opacity} />
        ))}
      </g>
    </svg>
  );
}

function Moon() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-6 top-6 h-16 w-16 sm:right-10 sm:top-10 sm:h-24 sm:w-24"
    >
      {/* Glow is a blurred copy of the SAME crescent silhouette (not a plain
          circle) so it softens the outer rim without bleeding a round blob
          into the dark cutout — that's what was flattening the shape before. */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <MoonCrescentSvg className="h-full w-full blur-md" />
      </motion.div>
      <MoonCrescentSvg className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function CloudShape({ cloud }: { cloud: Cloud }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute h-16 w-56 sm:h-24 sm:w-80"
      style={{ top: `${cloud.top}%`, opacity: cloud.opacity, scale: cloud.scale }}
      animate={{ left: cloud.direction > 0 ? ["-30%", "130%"] : ["130%", "-30%"] }}
      transition={{
        duration: cloud.duration,
        delay: cloud.delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="absolute inset-0 rounded-full bg-[#f7ecd2] blur-2xl" />
      <div className="absolute left-[15%] top-[15%] h-[65%] w-[55%] rounded-full bg-[#f7ecd2] blur-2xl" />
      <div className="absolute right-[10%] top-[5%] h-[75%] w-[45%] rounded-full bg-[#f7ecd2] blur-2xl" />
    </motion.div>
  );
}

interface ShootingStarConfig {
  id: number;
  startTop: number; // % from top — kept within the section's top band
  startLeft: number; // % from left
  angleDeg: number; // 30–45°, always down-and-right
  travelDistance: number; // px the streak's position moves over its lifetime
  trailLength: number; // px — length of the visible gradient streak itself
  duration: number; // seconds
}

// True runtime randomness (timing especially must differ occurrence to
// occurrence, not repeat a fixed pattern), so — unlike CLOUDS/STARS above —
// this can only be decided client-side. State starts at `null` on both
// server and client, and only ever changes from inside the effect below, so
// there's nothing for hydration to mismatch on.
function randomShootingStar(id: number): ShootingStarConfig {
  return {
    id,
    startTop: Math.random() * 22,
    startLeft: Math.random() * 70,
    angleDeg: 30 + Math.random() * 15,
    travelDistance: 260 + Math.random() * 160,
    trailLength: 60 + Math.random() * 40,
    duration: 0.8 + Math.random() * 0.4,
  };
}

// A shooting star = a short bright gradient streak (the trail), dragged
// along a straight diagonal line far longer than the streak itself. The
// streak's own local orientation already matches the travel angle, so as the
// whole element translates in a straight line, it reads as one continuous
// object moving edge-first — not a dot, and not a rotating/tumbling shape.
function ShootingStarStreak({
  star,
  onDone,
}: {
  star: ShootingStarConfig;
  onDone: () => void;
}) {
  const rad = (star.angleDeg * Math.PI) / 180;
  const dx = star.travelDistance * Math.cos(rad);
  const dy = star.travelDistance * Math.sin(rad);
  const headX = star.trailLength * Math.cos(rad);
  const headY = star.trailLength * Math.sin(rad);
  const gradientId = `vowx-shooting-star-${star.id}`;

  return (
    <motion.svg
      aria-hidden="true"
      className="absolute overflow-visible"
      style={{ top: `${star.startTop}%`, left: `${star.startLeft}%` }}
      width={star.trailLength}
      height={star.trailLength}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ x: dx, y: dy, opacity: [0, 1, 1, 0] }}
      transition={{
        x: { duration: star.duration, ease: "easeOut" },
        y: { duration: star.duration, ease: "easeOut" },
        // Fades in fast, holds bright through the middle of the flight, then
        // fades out over the final quarter — so it dissolves as it finishes
        // rather than vanishing on a hard cut.
        opacity: { duration: star.duration, times: [0, 0.12, 0.75, 1] },
      }}
      onAnimationComplete={onDone}
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
          <stop offset="0%" stopColor="#f7ecd2" stopOpacity={0} />
          <stop offset="100%" stopColor="#fffdf5" stopOpacity={1} />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={0}
        x2={headX}
        y2={headY}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(247,236,210,0.75))" }}
      />
    </motion.svg>
  );
}

function ShootingStars() {
  const [star, setStar] = useState<ShootingStarConfig | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    let timeoutId = 0;

    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 2000; // 2.5–4.5s, re-rolled after each occurrence
      timeoutId = window.setTimeout(() => {
        idRef.current += 1;
        setStar(randomShootingStar(idRef.current));
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <AnimatePresence>
        {star && (
          <ShootingStarStreak
            key={star.id}
            star={star}
            onDone={() => setStar((current) => (current?.id === star.id ? null : current))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Classic four-cubic-bezier heart silhouette (mirrored left/right around
// x=50) in a 0–100 viewBox — a smooth calligraphy-style outline, not points
// joined by straight segments. Traced: top-center dip -> up/out through the
// left lobe -> down to the left's widest point -> down to the bottom tip ->
// mirrored back up through the right side -> right lobe -> closing at the
// dip. Fully static (no randomness), so it's identical on server and client.
const HEART_PATH =
  "M50,32 C35,10 5,18 5,42 C5,65 30,78 50,90 C70,78 95,65 95,42 C95,18 65,10 50,32 Z";

const HEART_DRAW_DURATION = 2.2;

// Small bright accents along the path, not a full field of points — the two
// lobe peaks and the bottom tip, where a hand-drawn heart naturally draws
// the eye.
const HEART_GLINTS: { x: number; y: number }[] = [
  { x: 22, y: 18 },
  { x: 78, y: 18 },
  { x: 50, y: 90 },
];

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

export default function NightSkySection({ specialDate, wishPhotoUrl }: NightSkySectionProps) {
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

      <Moon />

      {CLOUDS.map((cloud) => (
        <CloudShape key={cloud.id} cloud={cloud} />
      ))}

      <ShootingStars />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={fadeUpVariant}
          className="font-display text-base italic text-[#e8d9c0]/80 sm:text-lg"
        >
          {CAPTION}
        </motion.p>

        <div className="relative mx-auto mt-10 h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80">
          <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
            <motion.path
              d={HEART_PATH}
              fill="none"
              stroke="#d4af7a"
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: HEART_DRAW_DURATION, ease: "easeInOut" }}
              style={{
                filter:
                  "drop-shadow(0 0 4px rgba(212,175,122,0.6)) drop-shadow(0 0 10px rgba(212,175,122,0.35))",
              }}
            />

            {HEART_GLINTS.map((point, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{
                  duration: 0.5,
                  delay: HEART_DRAW_DURATION + 0.3 + i * 0.15,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              >
                {/* Continuous gentle pulse, independent of the one-time
                    scroll-triggered reveal on the wrapping <g> above. */}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={2.2}
                  fill="#fdf3df"
                  animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
                  transition={{
                    duration: 2.6 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    transformOrigin: `${point.x}px ${point.y}px`,
                    filter: "drop-shadow(0 0 3px rgba(253,243,223,0.85))",
                  }}
                />
              </motion.g>
            ))}
          </svg>
        </div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={fadeUpVariant}
          className="font-display mt-10 text-3xl font-medium text-[#d4af7a] sm:text-4xl"
        >
          {formatSpecialDate(specialDate)}
        </motion.p>
      </div>

      {/* Rendered last (after the z-10 caption/heart/date content above) so
          its own RevealCard — which shares that same z-10 — wins the
          stacking tie via DOM order and correctly covers this whole section
          when a wish is caught, rather than sitting underneath it. This
          section's own ShootingStars above is purely decorative/frequent
          (2.5-4.5s); ShootingStarWish is the separate, much rarer (15-25s)
          catchable one — distinct components, coexisting on purpose. */}
      <ShootingStarWish photoUrl={wishPhotoUrl} />
    </section>
  );
}
