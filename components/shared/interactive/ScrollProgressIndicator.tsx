"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollProgressIndicator() {
  const { scrollYProgress } = useScroll();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-2 top-0 z-40 h-screen w-[3px] sm:right-3"
    >
      <div className="absolute inset-0 bg-[#faf5f0]/10" />
      <motion.div
        className="absolute inset-x-0 top-0 h-full origin-top bg-[#d4af7a]"
        style={{ scaleY: scrollYProgress }}
      />
    </div>
  );
}
