"use client";

import { motion } from "framer-motion";

interface HeroProps {
  partnerA: string;
  partnerB: string;
  title: string;
}

export default function Hero({ partnerA, partnerB, title }: HeroProps) {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-4 text-sm uppercase tracking-[0.3em] text-rose-200/80"
      >
        A love story
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        className="font-serif text-5xl font-medium text-rose-50 sm:text-6xl md:text-7xl"
      >
        {partnerA} <span className="text-rose-300/70">&amp;</span> {partnerB}
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
        className="mt-6 max-w-xl font-serif text-xl italic text-rose-100/80 sm:text-2xl"
      >
        {title}
      </motion.h2>
    </section>
  );
}
