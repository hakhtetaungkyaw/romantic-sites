"use client";

import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VideoMomentProps {
  videoSrc?: string;
  caption?: string;
}

export default function VideoMoment({
  videoSrc,
  caption = "A moment we'll never stop replaying.",
}: VideoMomentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => setIsPlaying(false));
  }, []);

  if (!videoSrc) return null;

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="px-6 py-[120px]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="mx-auto max-w-[1080px]"
      >
        <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 8rem 2rem rgba(26, 10, 18, 0.65)",
            }}
          />

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="absolute bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af7a]/50 bg-[#1a0a12]/50 text-[#d4af7a] backdrop-blur-md transition-colors hover:border-[#d4af7a] hover:bg-[#1a0a12]/70"
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>

        <p className="font-display mt-6 text-center text-lg italic text-[#faf5f0]/70 sm:text-xl">
          {caption}
        </p>
      </motion.div>
    </section>
  );
}
