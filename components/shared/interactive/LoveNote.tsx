"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

interface LoveNoteProps {
  note?: string;
}

// How long the wax-seal break plays before the flap opens and the card
// reveals — keeps the two beats sequential ("break the seal, then open the
// letter") instead of simultaneous.
const SEAL_BREAK_MS = 350;

export default function LoveNote({ note }: LoveNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sealBroken, setSealBroken] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);

  if (!note) return null;

  const handleTabClick = () => {
    if (!sealBroken) {
      setSealBroken(true);
      window.setTimeout(() => {
        setFlapOpen(true);
        setIsOpen(true);
      }, SEAL_BREAK_MS);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleTabClick}
        aria-label="Read a little note"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        className="fixed bottom-6 left-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af7a]/30 bg-[#1a0a12]/60 text-[#d4af7a] shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-[#d4af7a]/60"
      >
        <motion.span
          animate={sealBroken ? {} : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >
          <svg viewBox="0 0 24 18" className="h-6 w-7">
            {/* Envelope body */}
            <rect
              x="1"
              y="3"
              width="22"
              height="14"
              rx="1.2"
              fill="#1a0a12"
              stroke="#d4af7a"
              strokeWidth="1.1"
            />

            {/* Flap — lifts and fades to a faint outline once opened, rather
                than a literal 3D rotation (reads poorly at this icon size)
                or vanishing entirely (leaves a plain rectangle that no
                longer reads as an envelope). */}
            <motion.path
              d="M1,3 L23,3 L12,11 Z"
              fill="#241019"
              stroke="#d4af7a"
              strokeWidth="1.1"
              strokeLinejoin="round"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: flapOpen ? -1.5 : 0, opacity: flapOpen ? 0.35 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            {/* Wax seal on the flap — a simple embossed circle (base +
                highlight + shadow arc) with a small heart mark, rather than a
                literal two-piece crack, which wouldn't read cleanly at this
                scale. Breaks via scale + fade + slight rotate. */}
            <AnimatePresence>
              {!sealBroken && (
                <motion.g
                  key="wax-seal"
                  initial={{ opacity: 1, scale: 1, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.2, rotate: 18 }}
                  transition={{ duration: SEAL_BREAK_MS / 1000, ease: "easeIn" }}
                  style={{ transformOrigin: "12px 7.5px" }}
                >
                  <circle cx="12" cy="7.5" r="2.6" fill="#8b1e3f" />
                  <path
                    d="M10.1,6.6 A2.6,2.6 0 0 1 12,5 L12,5.4 A2.2,2.2 0 0 0 10.5,6.7 Z"
                    fill="#b04868"
                    opacity="0.6"
                  />
                  <path
                    d="M13.9,8.4 A2.6,2.6 0 0 1 12,10 L12,9.6 A2.2,2.2 0 0 0 13.5,8.3 Z"
                    fill="#5c1229"
                    opacity="0.6"
                  />
                  <path
                    d="M12,8.7 C11.2,8 10.7,7.5 10.7,7 C10.7,6.6 11,6.35 11.3,6.35 C11.6,6.35 11.85,6.5 12,6.75 C12.15,6.5 12.4,6.35 12.7,6.35 C13,6.35 13.3,6.6 13.3,7 C13.3,7.5 12.8,8 12,8.7 Z"
                    fill="#f0d9b5"
                  />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="love-note-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />

            <motion.div
              key="love-note-card"
              role="dialog"
              aria-label="A little note"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed bottom-24 left-6 z-40 max-w-xs rounded-2xl border border-[#d4af7a]/30 bg-[#1a0a12]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-3 text-[#faf5f0]/50 transition-colors hover:text-[#faf5f0]"
              >
                <X size={14} />
              </button>

              <p className="font-display pr-4 text-base italic leading-relaxed text-[#faf5f0]/90">
                {note}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
