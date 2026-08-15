"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const PHOTO_COUNT = 16;
const PHOTOS = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/demo-assets/photos/couple-${String(i + 1).padStart(2, "0")}.jpg`,
);

const TILE_COUNT = 16;
const SHUFFLE_INTERVAL_MS = 3000;
const MOBILE_QUERY = "(max-width: 767px)";

interface Tile {
  id: number;
  src: string;
}

// Fixed pool of 16 tiles, cycling through the photo set (only 15 unique
// photos exist, so one repeats). This exact order is the deterministic
// first-paint arrangement — server and client render the same markup;
// shuffling only starts client-side after mount.
const TILE_POOL: Tile[] = Array.from({ length: TILE_COUNT }, (_, i) => ({
  id: i,
  src: PHOTOS[i % PHOTOS.length],
}));

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Side-by-side hero visual — a 4x4 grid of couple photos that periodically
 * reshuffles. Every tile keeps a stable `id` (its React key) across
 * reshuffles, so Framer Motion's `layout` prop animates each one sliding to
 * its new grid cell (a FLIP-style reorder) instead of crossfading in place.
 */
export default function HeroShuffleGrid() {
  const [tiles, setTiles] = useState<Tile[]>(TILE_POOL);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia(MOBILE_QUERY);
    if (reducedMotion.matches || mobile.matches) return;

    const interval = setInterval(() => {
      setTiles((current) => shuffle(current));
    }, SHUFFLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="grid h-[280px] grid-cols-4 grid-rows-4 gap-2 sm:h-[360px] md:h-[420px]"
    >
      {tiles.map((tile) => (
        <motion.div
          key={tile.id}
          layout
          transition={{ duration: 1.5, type: "spring" }}
          className="relative overflow-hidden rounded-md"
        >
          <Image
            src={tile.src}
            alt=""
            fill
            sizes="(max-width: 767px) 22vw, 12vw"
            className="object-cover"
          />
        </motion.div>
      ))}
    </div>
  );
}
