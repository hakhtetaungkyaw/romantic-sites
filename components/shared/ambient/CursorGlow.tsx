"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useSyncExternalStore } from "react";

function subscribeFinePointer(callback: () => void) {
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getFinePointerSnapshot() {
  return window.matchMedia("(pointer: fine)").matches;
}

// Desktop-only ambient effect — skip entirely on touch devices, where there's
// no persistent cursor for it to follow. Server/first-paint snapshot is false
// (matching, so no hydration mismatch); the real value only matters client-side.
function getServerFinePointerSnapshot() {
  return false;
}

export default function CursorGlow() {
  const isFinePointer = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getServerFinePointerSnapshot,
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 28, stiffness: 80, mass: 0.6 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 80, mass: 0.6 });

  useEffect(() => {
    if (!isFinePointer) return;

    mouseX.set(window.innerWidth / 2);
    mouseY.set(window.innerHeight / 2);

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isFinePointer, mouseX, mouseY]);

  if (!isFinePointer) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        background:
          "radial-gradient(circle, rgba(212,175,122,0.08) 0%, rgba(212,175,122,0) 70%)",
      }}
    />
  );
}
