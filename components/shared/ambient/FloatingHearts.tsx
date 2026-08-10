"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

interface FloatingHeartsProps {
  count?: number;
  color?: string;
}

interface HeartConfig {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function randomHeart(id: number): HeartConfig {
  return {
    id,
    left: Math.random() * 100,
    size: 14 + Math.random() * 18,
    duration: 9 + Math.random() * 9,
    delay: -(Math.random() * 9),
    opacity: 0.25 + Math.random() * 0.5,
  };
}

const EMPTY_HEARTS: HeartConfig[] = [];

function noopSubscribe() {
  return () => {};
}

export default function FloatingHearts({
  count = 18,
  color = "pink",
}: FloatingHeartsProps) {
  // useSyncExternalStore renders EMPTY_HEARTS on the server and on first client
  // paint (matching, so no hydration mismatch), then swaps in the random client-only
  // layout without an extra setState-in-effect render pass.
  const cacheRef = useRef<{ count: number; hearts: HeartConfig[] } | null>(null);

  const hearts = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (!cacheRef.current || cacheRef.current.count !== count) {
        cacheRef.current = {
          count,
          hearts: Array.from({ length: count }, (_, i) => randomHeart(i)),
        };
      }
      return cacheRef.current.hearts;
    },
    () => EMPTY_HEARTS,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute bottom-0"
          style={{ left: `${heart.left}%`, opacity: heart.opacity }}
          initial={{ y: "10vh" }}
          animate={{ y: "-110vh" }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Heart size={heart.size} color={color} fill={color} />
        </motion.div>
      ))}
    </div>
  );
}
