"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

interface UnlockGateProps {
  children: React.ReactNode;
}

const HEART_PATH =
  "M50,88 C20,62 0,40 0,22 C0,8 12,-2 27,-2 C38,-2 47,5 50,15 C53,5 62,-2 73,-2 C88,-2 100,8 100,22 C100,40 80,62 50,88 Z";

const heartVariants: Variants = {
  idle: {
    scale: [1, 1.07, 1],
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  opening: {
    scale: [1, 1.35, 0.85],
    rotate: [0, -8, 6, 0],
    opacity: [1, 1, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

export default function UnlockGate({ children }: UnlockGateProps) {
  // No randomness or time-based values here, so the initial (unopened) render
  // is identical on server and client — hydration-safe by construction.
  const [opened, setOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Let the burst animation play before the overlay itself fades, so the
    // "opening" feels like a distinct beat rather than an instant cut.
    window.setTimeout(() => setOpened(true), 550);
  };

  return (
    <>
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="unlock-gate"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0a12] via-[#150f30] to-[#0d0a1a] px-6 text-center"
          >
            <button
              type="button"
              onClick={handleOpen}
              aria-label="Open your gift"
              className="group flex flex-col items-center gap-8 focus:outline-none"
            >
              <span className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(212,175,122,0.4) 0%, rgba(212,175,122,0) 70%)",
                  }}
                  animate={{ opacity: [0.4, 0.85, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.svg
                  viewBox="0 0 100 90"
                  className="relative h-14 w-14 sm:h-16 sm:w-16"
                  variants={heartVariants}
                  animate={isOpening ? "opening" : "idle"}
                >
                  <path
                    d={HEART_PATH}
                    fill="#d4af7a"
                    fillOpacity={0.9}
                    stroke="#f7ecd2"
                    strokeWidth={1.5}
                  />
                </motion.svg>
              </span>

              <span>
                <span className="font-display block text-2xl text-[#faf5f0] sm:text-3xl">
                  A gift is waiting for you
                </span>
                <span className="mt-3 block text-xs uppercase tracking-[0.35em] text-[#d4af7a]/80">
                  Tap to open
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {opened && children}
    </>
  );
}
