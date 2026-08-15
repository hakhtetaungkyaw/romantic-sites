"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Place {
  name: string;
  caption: string;
  x: number;
  y: number;
  photo?: string;
}

interface PlacesWeveBeenProps {
  places?: Place[];
}

function PinIcon({ className = "h-8 w-8 drop-shadow-md" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className}>
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
        fill="#d4af7a"
      />
      <circle cx="12" cy="12" r="4.5" fill="#1a0a12" />
    </svg>
  );
}

function CompassRose() {
  return (
    <svg
      viewBox="0 0 60 60"
      aria-hidden="true"
      className="pointer-events-none absolute right-6 top-6 h-14 w-14 text-[#d4af7a]/20 sm:h-20 sm:w-20"
    >
      <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="30" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <path d="M30 6 L34 26 L30 30 L26 26 Z" fill="currentColor" />
      <path d="M30 54 L34 34 L30 30 L26 34 Z" fill="currentColor" opacity="0.5" />
      <path d="M6 30 L26 26 L30 30 L26 34 Z" fill="currentColor" opacity="0.5" />
      <path d="M54 30 L34 26 L30 30 L34 34 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Very low-opacity latitude/longitude-style grid — reads as "map" without
// being literal cartography, and sits well beneath the pins/route.
const GRID_LINES = [20, 40, 60, 80];

function MapGrid() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-[#d4af7a]/[0.07]"
    >
      {GRID_LINES.map((pos) => (
        <line key={`h-${pos}`} x1={0} y1={pos} x2={100} y2={pos} stroke="currentColor" strokeWidth={0.2} />
      ))}
      {GRID_LINES.map((pos) => (
        <line key={`v-${pos}`} x1={pos} y1={0} x2={pos} y2={100} stroke="currentColor" strokeWidth={0.2} />
      ))}
    </svg>
  );
}

// Converts an ordered list of points into a single smooth SVG path (uniform
// Catmull-Rom spline, converted to cubic beziers — the standard 1/6-tension
// technique) that passes exactly through every point in sequence. Used so
// the route line traces the real pins in the order they appear in the data,
// not a decorative path unrelated to it.
function smoothPathFromPoints(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function RouteLine({ places }: { places: Place[] }) {
  if (places.length < 2) return null;
  const d = smoothPathFromPoints(places.map((p) => ({ x: p.x, y: p.y })));

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <motion.path
        d={d}
        fill="none"
        stroke="#d4af7a"
        strokeWidth={0.3}
        strokeDasharray="1.4 2.2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.55 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
    </svg>
  );
}

// Small polaroid-framed thumbnail — gold border "mat", slight alternating tilt
// per pin (deterministic from index, not random) for a candid feel.
function PolaroidThumb({
  src,
  alt,
  size,
  tilt,
}: {
  src: string;
  alt: string;
  size: string;
  tilt: "-rotate-2" | "rotate-2";
}) {
  return (
    <div
      className={`mx-auto w-fit rounded-sm border border-[#d4af7a]/50 bg-[#1a0a12] p-1 shadow-md ${tilt}`}
    >
      <div className={`relative ${size} overflow-hidden rounded-[1px]`}>
        <Image src={src} alt={alt} fill sizes="100px" className="object-cover" />
      </div>
    </div>
  );
}

function PlaceCaptionCard({ place, index }: { place: Place; index: number }) {
  const tilt = index % 2 === 0 ? "-rotate-2" : "rotate-2";

  return (
    <div className="rounded-lg border border-[#d4af7a]/30 bg-[#1a0a12]/95 p-3 text-center shadow-xl backdrop-blur-sm">
      {place.photo && (
        <PolaroidThumb
          src={place.photo}
          alt={place.name}
          size="h-20 w-20"
          tilt={tilt}
        />
      )}
      <p className={`font-display text-sm text-[#faf5f0] ${place.photo ? "mt-2" : ""}`}>
        {place.name}
      </p>
      <p className="mt-1 text-xs italic leading-snug text-[#faf5f0]/70">
        {place.caption}
      </p>
    </div>
  );
}

function PlacePin({ place, index }: { place: Place; index: number }) {
  return (
    <div
      className="group absolute"
      style={{
        left: `${place.x}%`,
        top: `${place.y}%`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Pulsing glow anchored at the pin's tip. The static centering
            transform lives on this plain wrapper, not the motion.div, so it
            never fights with framer-motion's own animated transform. */}
        <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#d4af7a]"
            animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: index * 0.3,
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.12 }}
        >
          <PinIcon />
        </motion.div>

        <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 scale-95 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
          <PlaceCaptionCard place={place} index={index} />
        </div>
      </div>
    </div>
  );
}

export default function PlacesWeveBeen({ places }: PlacesWeveBeenProps) {
  if (!places || places.length === 0) return null;

  return (
    <section className="px-6 py-[120px]">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
      >
        Places we&apos;ve been
      </motion.p>

      {/* Discoverability hint — the hover-to-reveal cards aren't obvious from
          a static view. Desktop/tablet only: mobile's stacked list already
          shows every card without needing to hover. */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        className="font-display mb-6 hidden text-center text-xs italic text-[#d4af7a]/60 sm:block"
      >
        Hover over a pin to relive the memory
      </motion.p>

      {/* Desktop/tablet: stylized map with hover-revealed pins. The rounded
          card look + clipped background decoration live on an inner inset-0
          layer, separate from the (unclipped) outer container the pins sit
          in — so a tall caption card near the top edge can pop up freely
          instead of being cut off by the map's own overflow-hidden. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mx-auto hidden aspect-[16/10] w-full max-w-4xl sm:block"
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl border border-[#d4af7a]/20 bg-gradient-to-br from-[#2b0f1a] via-[#3a1220] to-[#1a0a12] shadow-2xl shadow-black/40">
          <MapGrid />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,122,0.07)_0%,transparent_70%)]" />
          <RouteLine places={places} />
          <CompassRose />
        </div>

        {places.map((place, index) => (
          <PlacePin key={place.name} place={place} index={index} />
        ))}
      </motion.div>

      {/* Mobile: a stacked list — hover-revealed pins on a tiny map don't
          translate well to touch, so cards are shown inline instead. */}
      <div className="mx-auto flex max-w-md flex-col gap-4 sm:hidden">
        {places.map((place, index) => (
          <motion.div
            key={place.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
            className="flex items-start gap-3 rounded-xl border border-[#d4af7a]/15 bg-[#faf5f0]/[0.04] p-4"
          >
            {place.photo ? (
              <PolaroidThumb
                src={place.photo}
                alt={place.name}
                size="h-12 w-12"
                tilt={index % 2 === 0 ? "-rotate-2" : "rotate-2"}
              />
            ) : (
              <PinIcon className="h-6 w-6 shrink-0" />
            )}
            <div>
              <p className="font-display text-base text-[#faf5f0]">{place.name}</p>
              <p className="mt-1 text-sm italic leading-relaxed text-[#faf5f0]/65">
                {place.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
