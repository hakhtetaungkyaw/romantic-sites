"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { SitePhoto } from "@/types/site";

interface PhotoGalleryGridProps {
  photos: SitePhoto[];
}

export default function PhotoGalleryGrid({ photos }: PhotoGalleryGridProps) {
  return (
    <section className="px-6 py-16 sm:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.src + index}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-[#2c2420]/5 shadow-lg shadow-[#2c2420]/10"
          >
            <Image
              src={photo.src}
              alt={`Memory ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
