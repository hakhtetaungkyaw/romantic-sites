"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { SitePhoto } from "@/types/site";

interface MemoryGalleryProps {
  photos: SitePhoto[];
}

// Real pixel dimensions of the demo photo set (measured, not guessed), so each
// masonry item is sized by its actual aspect ratio instead of a forced height/span.
// Falls back to a generic portrait ratio for any photo not in this set.
const PHOTO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "couple-01.jpg": { width: 106, height: 131 },
  "couple-02.jpg": { width: 136, height: 285 },
  "couple-03.jpg": { width: 236, height: 304 },
  "couple-04.jpg": { width: 136, height: 285 },
  "couple-05.jpg": { width: 100, height: 100 },
  "couple-06.jpg": { width: 236, height: 381 },
  "couple-07.jpg": { width: 350, height: 525 },
  "couple-08.jpg": { width: 736, height: 136 },
  "couple-09.jpg": { width: 236, height: 381 },
  "couple-10.jpg": { width: 735, height: 499 },
  "couple-11.jpg": { width: 280, height: 320 },
  "couple-12.jpg": { width: 136, height: 285 },
  "couple-13.jpg": { width: 736, height: 414 },
  "couple-14.jpg": { width: 236, height: 381 },
  "couple-15.jpg": { width: 736, height: 736 },
};

const DEFAULT_DIMENSIONS = { width: 12, height: 5 };

function getDimensions(src: string) {
  const filename = src.split("/").pop() ?? "";
  return PHOTO_DIMENSIONS[filename] ?? DEFAULT_DIMENSIONS;
}

export default function MemoryGallery({ photos }: MemoryGalleryProps) {
  return (
    <section className="px-6 py-[120px]">
      <div className="mx-auto max-w-7xl columns-1 gap-x-5 sm:columns-2 lg:columns-4">
        {photos.map((photo, index) => {
          const { src, caption } = photo;
          const { width, height } = getDimensions(src);
          return (
            <motion.div
              key={src + index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.7,
                ease: "easeOut",
                delay: (index % 4) * 0.08,
              }}
              className="group mb-5 break-inside-avoid rounded-lg border border-[#d4af7a]/50 p-1.5 shadow-lg shadow-black/30 transition-all duration-500 hover:border-[#d4af7a]/90 hover:shadow-[0_0_24px_-4px_rgba(212,175,122,0.45)]"
            >
              <div className="relative overflow-hidden rounded-md">
                <Image
                  src={src}
                  alt={`Memory ${index + 1}`}
                  width={width}
                  height={height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <p className="font-display relative translate-y-3 px-4 pb-3 text-center text-sm italic text-[#faf5f0] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {caption}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
