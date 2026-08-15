"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Milestone {
  date: string;
  title: string;
  description?: string;
}

interface TimelineOfUsProps {
  milestones?: Milestone[];
}

function TimelineDot({ delay }: { delay: number }) {
  return (
    <div className="relative flex h-3 w-3 items-center justify-center sm:col-start-2 sm:mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full bg-[#d4af7a]"
        animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay }}
      />
      <div className="relative h-3 w-3 rounded-full bg-[#d4af7a] ring-4 ring-[#1a0a12]" />
    </div>
  );
}

function TimelineCard({
  milestone,
  isLeft,
}: {
  milestone: Milestone;
  isLeft: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`rounded-xl border border-[#d4af7a]/15 bg-[#faf5f0]/[0.04] p-6 backdrop-blur-sm ${
        isLeft
          ? "sm:col-start-1 sm:row-start-1 sm:text-right"
          : "sm:col-start-3 sm:row-start-1"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-[#d4af7a]">
        {milestone.date}
      </p>
      <h3 className="font-display mt-2 text-xl text-[#faf5f0] sm:text-2xl">
        {milestone.title}
      </h3>
      {milestone.description && (
        <p className="mt-3 text-sm leading-relaxed text-[#faf5f0]/65">
          {milestone.description}
        </p>
      )}
    </motion.div>
  );
}

export default function TimelineOfUs({ milestones }: TimelineOfUsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start 0.85", "end 0.4"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const milestoneList = milestones ?? [];
  const hasMilestones = milestoneList.length > 0;

  // `wrapperRef` must stay attached to a real DOM node on every render —
  // useScroll(target) throws "Target ref is defined but not hydrated" if the
  // ref'd element never mounts. So the ref lives on this always-rendered
  // container, and only its *content* (plus the section's own padding) is
  // conditional on having milestones — collapsing to zero footprint instead
  // of returning null outright.
  return (
    <section className={hasMilestones ? "px-6 py-[120px]" : undefined}>
      {hasMilestones && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
        >
          Our story so far
        </motion.p>
      )}

      <div
        ref={wrapperRef}
        className={hasMilestones ? "relative mx-auto max-w-[720px]" : "h-0 w-0 overflow-hidden"}
      >
        {hasMilestones && (
          <>
            <div className="absolute bottom-0 left-4 top-0 w-px bg-[#d4af7a]/15 sm:left-1/2 sm:-translate-x-1/2" />
            <motion.div
              className="absolute left-4 top-0 w-px origin-top bg-[#d4af7a] sm:left-1/2 sm:-translate-x-1/2"
              style={{ scaleY: lineScale, height: "100%" }}
            />

            <div className="flex flex-col gap-14">
              {milestoneList.map((milestone, index) => (
                <div
                  key={milestone.date + milestone.title}
                  className="grid grid-cols-[2rem_1fr] items-center gap-x-6 gap-y-4 sm:grid-cols-[1fr_2rem_1fr]"
                >
                  <TimelineDot delay={index * 0.2} />
                  <TimelineCard
                    milestone={milestone}
                    isLeft={index % 2 === 0}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
