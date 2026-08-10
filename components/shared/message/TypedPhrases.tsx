"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface TypedPhrasesProps {
  phrases?: string[];
}

const TYPE_MS = 75;
const DELETE_MS = 30;
const PAUSE_MS = 2000;

function useTypewriter(phrases: string[]) {
  // Empty string on both server and first client paint — identical either
  // way, so there's nothing for hydration to mismatch on. The actual typing
  // loop only starts inside the effect, after mount.
  const [text, setText] = useState("");

  useEffect(() => {
    if (phrases.length === 0) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex % phrases.length];

      if (!deleting) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeoutId = setTimeout(tick, PAUSE_MS);
          return;
        }
        timeoutId = setTimeout(tick, TYPE_MS);
      } else {
        charIndex -= 1;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex += 1;
          timeoutId = setTimeout(tick, TYPE_MS);
          return;
        }
        timeoutId = setTimeout(tick, DELETE_MS);
      }
    };

    timeoutId = setTimeout(tick, TYPE_MS);
    return () => clearTimeout(timeoutId);
  }, [phrases]);

  return text;
}

export default function TypedPhrases({ phrases }: TypedPhrasesProps) {
  const text = useTypewriter(phrases ?? []);

  if (!phrases || phrases.length === 0) return null;

  return (
    <section className="px-6 py-[120px]">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-[#e8b4bc]/70 sm:text-sm"
      >
        A promise, on repeat
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative mx-auto max-w-2xl rounded-2xl border border-[#d4af7a]/20 bg-[#faf5f0]/[0.04] px-8 py-14 text-center shadow-2xl shadow-black/30 backdrop-blur-sm sm:px-14 sm:py-16"
      >
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-7 flex h-6 w-6 items-center justify-center text-[#d4af7a]"
        >
          <Heart size={22} fill="currentColor" />
        </motion.div>

        <p className="font-display min-h-[2.6em] text-2xl italic leading-relaxed text-[#faf5f0] sm:min-h-[2em] sm:text-3xl">
          {text}
          <span
            aria-hidden="true"
            className="typewriter-cursor ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] bg-[#d4af7a] align-middle"
          />
        </p>

        <div className="mx-auto mt-8 h-px w-16 bg-[#d4af7a]/40" />
      </motion.div>
    </section>
  );
}
