"use client";

import { motion } from "framer-motion";
import { Music, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

interface SongPlayerProps {
  songTitle?: string;
  songUrl?: string;
}

export default function SongPlayer({ songTitle, songUrl }: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!songTitle) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // Only flip to "playing" once playback actually starts — setting it
      // optimistically would leave the button showing "pause" even if the
      // browser rejects the play() call (invalid source, decode error, etc).
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error("Unable to play song:", error);
          setIsPlaying(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-30 flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-full border border-[#d4af7a]/30 bg-[#1a0a12]/60 py-2.5 pl-3 pr-4 shadow-lg shadow-black/30 backdrop-blur-md"
    >
      {/* Only mounted when a real file exists — an <audio> with no src can
          still fire a console warning/error in some browsers on play(). */}
      {songUrl && (
        <audio
          ref={audioRef}
          src={songUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={!songUrl}
        aria-label={isPlaying ? "Pause our song" : "Play our song"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d4af7a]/50 text-[#d4af7a] transition-colors enabled:hover:border-[#d4af7a] enabled:hover:bg-[#d4af7a]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <Music size={14} className="shrink-0 text-[#d4af7a]/70" />
        <span className="font-display truncate text-sm italic text-[#faf5f0]/90">
          {songTitle}
        </span>
      </div>
    </motion.div>
  );
}
