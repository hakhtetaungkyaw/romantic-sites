"use client";

import { motion } from "framer-motion";

import { formatPeopleHeading } from "@/lib/people";
import type { SitePerson } from "@/types/site";

interface ClosingSignatureProps {
  people: SitePerson[];
  groupTitle?: string;
  closingLine?: string;
}

const HEART_PATH =
  "M50,88 C20,62 0,40 0,22 C0,8 12,-2 27,-2 C38,-2 47,5 50,15 C53,5 62,-2 73,-2 C88,-2 100,8 100,22 C100,40 80,62 50,88 Z";

function withAccentedAmpersands(text: string) {
  return text
    .split(/(&)/)
    .map((part, i) =>
      part === "&" ? (
        <span key={i} className="text-[#d4af7a]">
          &amp;
        </span>
      ) : (
        part
      ),
    );
}

export default function ClosingSignature({
  people,
  groupTitle,
  closingLine,
}: ClosingSignatureProps) {
  const heading = formatPeopleHeading(people, groupTitle);

  return (
    <section className="relative bg-gradient-to-b from-transparent to-[#0d0509] px-6 pb-[140px] pt-[120px] text-center">
      {closingLine && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="font-display mx-auto max-w-xl text-xl italic text-[#faf5f0]/80 sm:text-2xl"
        >
          {closingLine}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
        whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        className="font-display mt-8 text-4xl italic text-[#faf5f0] sm:text-5xl"
      >
        {withAccentedAmpersands(heading)}
      </motion.div>

      <motion.svg
        width="42"
        height="38"
        viewBox="0 0 100 90"
        fill="none"
        className="mx-auto mt-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.5 }}
      >
        <motion.path
          d={HEART_PATH}
          stroke="#d4af7a"
          strokeWidth={3}
          fill="#d4af7a"
          variants={{
            // Explicit (not default-spring) retract so leaving the viewport
            // looks like a deliberate un-drawing rather than a jarring snap —
            // fill fades first, then the stroke retraces itself away.
            hidden: {
              pathLength: 0,
              fillOpacity: 0,
              transition: {
                fillOpacity: { duration: 0.3, ease: "easeIn" },
                pathLength: { duration: 0.6, ease: "easeIn", delay: 0.2 },
              },
            },
            visible: {
              pathLength: 1,
              fillOpacity: 0.9,
              transition: {
                pathLength: { duration: 1.4, ease: "easeOut", delay: 0.6 },
                fillOpacity: { duration: 0.8, ease: "easeOut", delay: 1.6 },
              },
            },
          }}
        />
      </motion.svg>
    </section>
  );
}
