"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { SitePhoto } from "@/types/site";

interface MemoryGalleryProps {
  photos: SitePhoto[];
}

// Real pixel dimensions of the demo photo set (measured, not guessed), so each
// framed piece keeps its true aspect ratio instead of a forced crop.
// Falls back to a generic portrait ratio for any photo not in this set.
const PHOTO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "couple-01.jpg": { width: 436, height: 236 },
  "couple-02.jpg": { width: 100, height: 106 },
  "couple-03.jpg": { width: 136, height: 136 },
  "couple-04.jpg": { width: 136, height: 136 },
  "couple-05.jpg": { width: 136, height: 136 },
  "couple-06.jpg": { width: 136, height: 136 },
  "couple-07.jpg": { width: 136, height: 136 },
  "couple-08.jpg": { width: 136, height: 136 },
  "couple-09.jpg": { width: 136, height: 136 },
  "couple-10.jpg": { width: 136, height: 136 },
  "couple-11.jpg": { width: 136, height: 136 },
  "couple-12.jpg": { width: 136, height: 136 },
  "couple-13.jpg": { width: 136, height: 136 },
  "couple-14.jpg": { width: 136, height: 136 },
  "couple-15.jpg": { width: 136, height: 136 },
  "couple-16.jpg": { width: 136, height: 136 },
};

const DEFAULT_DIMENSIONS = { width: 10, height: 5 };

function getDimensions(src: string) {
  const filename = src.split("/").pop() ?? "";
  return PHOTO_DIMENSIONS[filename] ?? DEFAULT_DIMENSIONS;
}

// Deliberate large/small rhythm through the sequence — every third piece is a
// "feature," the rest are smaller "companion" pieces. Fixed by index, not
// random, so the curation reads as intentional.
const FEATURE_HEIGHT = 600;
const COMPANION_HEIGHT = 400;

export default function MemoryGallery({ photos }: MemoryGalleryProps) {
  return (
    <section className="px-6 py-[120px]">
      <div className="mx-auto max-w-2xl">
        {photos.map((photo, index) => {
          const { src, caption } = photo;
          const { width, height } = getDimensions(src);
          const isFeature = index % 3 === 0;
          const targetHeight = isFeature ? FEATURE_HEIGHT : COMPANION_HEIGHT;
          // Ideal width for that target height at this photo's true aspect
          // ratio, plus the mat's own chrome (border + padding — box-sizing
          // is border-box via Tailwind's preflight) so the FRAME's width
          // resolves the photo itself to ~idealWidth. This has to live on
          // the frame div, not the inner image box: the frame is a flex
          // child under `items-center`, which shrink-wraps it to its
          // content's width — if the inner box's own width were a
          // percentage (min(Npx, 100%)) it would be resolving against a
          // parent that's simultaneously waiting on it to size first, and
          // that circular case collapses to 0 (which is exactly what was
          // happening: images invisible, only the mat's padding visible).
          const idealWidth = Math.round(targetHeight * (width / height));
          const MAT_CHROME_PX = 27; // ~1.5px border + 12px padding, both sides
          const frameWidth = idealWidth + MAT_CHROME_PX;

          return (
            <motion.div
              key={src + index}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="group mb-24 flex flex-col items-center last:mb-0 sm:mb-32"
            >
              {/* Frame: thin gold border + cream mat + soft wall-lit shadow.
                  Width lives here (a concrete value) so the inner image box
                  below can safely be a plain 100%. */}
              <div
                className="rounded-sm border-[1.5px] border-[#d4af7a]/70 bg-[#f7ecd2] p-3 shadow-2xl shadow-black/50 transition-colors duration-500 group-hover:border-[#d4af7a]"
                style={{ width: `min(${frameWidth}px, 100%)` }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: `${width} / ${height}` }}
                >
                  <Image
                    src={src}
                    alt={`Memory ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 90vw, 640px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Wall label */}
              <div className="mt-5 flex flex-col items-center">
                <span className="h-px w-10 bg-[#d4af7a]" />
                <p className="font-display mt-3 max-w-xs text-center text-xs uppercase tracking-widest text-[#d4af7a]">
                  {caption}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
