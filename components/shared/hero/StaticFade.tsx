"use client";

import { motion } from "framer-motion";

import { formatPeopleHeading } from "@/lib/people";
import type { SitePerson } from "@/types/site";

interface HeroProps {
  people: SitePerson[];
  groupTitle?: string;
  title: string;
}

function withAccentedAmpersands(text: string) {
  return text
    .split(/(&)/)
    .map((part, i) =>
      part === "&" ? (
        <span key={i} className="text-rose-300/70">
          &amp;
        </span>
      ) : (
        part
      ),
    );
}

export default function Hero({ people, groupTitle, title }: HeroProps) {
  const heading = formatPeopleHeading(people, groupTitle);

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
        {withAccentedAmpersands(heading)}
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
