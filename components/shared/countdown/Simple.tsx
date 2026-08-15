"use client";

import { useRef, useSyncExternalStore } from "react";

interface CountdownTimerProps {
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

export default function CountdownTimer({
  specialDate,
  label = "Together for",
}: CountdownTimerProps) {
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
    <section className="px-6 py-12 text-center">
      <p className="mb-6 text-sm uppercase tracking-[0.3em] text-[#c9a0a0]">
        {label}
      </p>
      <div className="mx-auto flex max-w-xl justify-center gap-4 sm:gap-8">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span className="font-serif text-3xl font-medium text-[#2c2420] sm:text-4xl">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs uppercase tracking-widest text-[#b8935f]">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
