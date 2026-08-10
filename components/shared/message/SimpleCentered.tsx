"use client";

import { motion } from "framer-motion";

interface MessageSectionProps {
  message: string;
}

export default function MessageSection({ message }: MessageSectionProps) {
  return (
    <section className="px-6 py-20 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="font-serif text-xl italic leading-relaxed text-rose-50/90 sm:text-2xl">
          &ldquo;{message}&rdquo;
        </p>
      </motion.div>
    </section>
  );
}
