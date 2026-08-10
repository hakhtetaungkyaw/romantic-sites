"use client";

import { motion } from "framer-motion";

interface StoryLetterProps {
  message: string;
}

export default function StoryLetter({ message }: StoryLetterProps) {
  return (
    <section className="relative px-6 py-[120px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mx-auto max-w-[720px] overflow-hidden rounded-2xl border border-[#d4af7a]/15 bg-[#faf5f0]/[0.04] px-8 py-14 shadow-2xl shadow-black/30 backdrop-blur-sm sm:px-12 sm:py-16"
      >
        <span
          aria-hidden="true"
          className="font-display pointer-events-none absolute left-4 top-0 select-none text-8xl leading-none text-[#d4af7a]/20 sm:left-6 sm:text-9xl"
        >
          &ldquo;
        </span>

        <p className="font-display relative text-lg leading-relaxed text-[#faf5f0]/90 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-medium first-letter:leading-[0.8] first-letter:text-[#d4af7a] sm:text-xl">
          {message}
        </p>

        <span
          aria-hidden="true"
          className="font-display pointer-events-none absolute bottom-0 right-4 select-none text-8xl leading-none text-[#d4af7a]/20 sm:right-6 sm:text-9xl"
        >
          &rdquo;
        </span>
      </motion.div>
    </section>
  );
}
