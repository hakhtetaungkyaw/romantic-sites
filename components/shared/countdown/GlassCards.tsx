"use client";

import { motion } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";

import { fadeUpVariant, staggerContainerVariant, viewportRepeat } from "@/lib/v2ScrollReveal";

interface ElegantCountdownProps {
  specialDate: string;
  label?: string;
}

interface Elapsed {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO_ELAPSED: Elapsed = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

// BUG FIX: this used to be pure fixed-duration math (days = floor(totalSeconds
// / 86400), no larger units at all) — same bug already fixed in V1's
// countdown/SunflowerCountdown.tsx, see that file's own comment for the full
// reasoning. Years/months are calendar concepts (variable month lengths, leap
// years), so they're walked forward with native Date arithmetic (no new
// dependency — none is installed or needed) rather than division/modulo.
// UTC throughout so server render and client hydration agree regardless of
// the visitor's local timezone.
function getElapsed(specialDate: string): Elapsed {
  const start = new Date(specialDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - start.getTime());

  let years = 0;
  let months = 0;
  let days = 0;

  if (diffMs > 0) {
    years = now.getUTCFullYear() - start.getUTCFullYear();
    months = now.getUTCMonth() - start.getUTCMonth();
    days = now.getUTCDate() - start.getUTCDate();

    if (days < 0) {
      months -= 1;
      days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { years, months, days, hours, minutes, seconds };
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
        prev.years === next.years &&
        prev.months === next.months &&
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

  // Tier 1: Years/Months/Days as the primary card row — Years only shown
  // once non-zero (a "0 Years" card reads as noise pre-first-anniversary),
  // Months and Days always shown. Always 2 or 3 cards, same as V1's
  // SunflowerCountdown.
  const tier1Units: { value: number; label: string }[] =
    elapsed.years > 0
      ? [
          { value: elapsed.years, label: "Years" },
          { value: elapsed.months, label: "Months" },
          { value: elapsed.days, label: "Days" },
        ]
      : [
          { value: elapsed.months, label: "Months" },
          { value: elapsed.days, label: "Days" },
        ];

  const timeOfDay = [elapsed.hours, elapsed.minutes, elapsed.seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

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
          {tier1Units.map((unit) => (
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

        {/* Tier 2 — Hours:Minutes:Seconds, deliberately subordinate to Tier
            1's cards: a single live-ticking inline string, not matching
            card chrome. Same pattern as V1's SunflowerCountdown. */}
        <motion.p
          variants={fadeUpVariant}
          className="mt-5 text-sm tracking-[0.15em] text-[#faf5f0]/40"
        >
          {timeOfDay}
        </motion.p>
      </motion.div>
    </section>
  );
}
