"use client";

import { motion } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";

import { fadeUpVariant, staggerContainerVariant, viewportRepeat } from "@/lib/v2ScrollReveal";

interface ElegantCountdownProps {
  specialDate: string;
  label?: string;
}

interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO_ELAPSED: Elapsed = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function getElapsed(specialDate: string): Elapsed {
  const diff = Math.max(0, Date.now() - new Date(specialDate).getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function subscribe(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

export default function ElegantCountdown({
  specialDate,
  label = "Together for",
}: ElegantCountdownProps) {
  // useSyncExternalStore ticks the clock without a setState-in-effect render pass,
  // and lets the server/first-paint snapshot (zeroed) differ safely from the live one.
  const cacheRef = useRef<Elapsed>(ZERO_ELAPSED);

  const elapsed = useSyncExternalStore(
    subscribe,
    () => {
      const next = getElapsed(specialDate);
      const prev = cacheRef.current;
      if (
        prev.days === next.days &&
        prev.hours === next.hours &&
        prev.minutes === next.minutes &&
        prev.seconds === next.seconds
      ) {
        return prev;
      }
      cacheRef.current = next;
      return next;
    },
    () => ZERO_ELAPSED,
  );

  const units: { value: number; label: string }[] = [
    { value: elapsed.days, label: "Days" },
    { value: elapsed.hours, label: "Hours" },
    { value: elapsed.minutes, label: "Minutes" },
    { value: elapsed.seconds, label: "Seconds" },
  ];

  return (
    <section className="relative z-20 -mt-16 px-6 sm:-mt-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportRepeat}
        variants={staggerContainerVariant}
        className="mx-auto max-w-3xl rounded-3xl border border-[#d4af7a]/20 bg-[#faf5f0]/[0.04] px-6 py-8 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-10 sm:py-10"
      >
        <motion.p variants={fadeUpVariant} className="mb-6 text-xs uppercase tracking-[0.35em] text-[#e8b4bc]/70 sm:text-sm">
          {label}
        </motion.p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
          {units.map((unit) => (
            <motion.div
              key={unit.label}
              variants={fadeUpVariant}
              className="flex w-[70px] flex-col items-center rounded-2xl border border-[#d4af7a]/25 bg-white/[0.03] py-4 backdrop-blur-md sm:w-20 sm:py-5"
            >
              {/* Per-tick digit pop — the countdown's own live-update
                  animation, not a scroll reveal, untouched. */}
              <motion.span
                key={unit.value}
                initial={{ opacity: 0.4, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="font-display text-2xl font-medium text-[#faf5f0] sm:text-3xl"
              >
                {String(unit.value).padStart(2, "0")}
              </motion.span>
              <span className="mt-1 text-[10px] uppercase tracking-widest text-[#faf5f0]/50">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
