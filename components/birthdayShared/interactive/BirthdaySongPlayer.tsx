"use client";

import { motion } from "framer-motion";
import { useImperativeHandle, useRef, useState } from "react";

export interface BirthdaySongPlayerHandle {
  /** Attempts playback; safely no-ops if there's no track or the ref isn't attached yet. */
  play: () => void;
}

interface BirthdaySongPlayerProps {
  songTitle?: string;
  songUrl?: string;
  ref?: React.Ref<BirthdaySongPlayerHandle>;
}

// Birthday V1's own song player — same imperative-play autoplay pattern
// Anniversary V2's interactive/SongPlayer.tsx + interactive/UnlockGate.tsx
// pairing uses (checked both per this task's own instruction), reimplemented
// fully locally rather than imported/shared: nothing here imports from
// components/shared/, per this project's product-line isolation principle.
// Mounted as a sibling BEFORE hero/BirthdayGate.tsx in
// templates/BirthdayV1.tsx (outside its gated children) so the <audio>
// element already exists at candle-blow-tap time — play() has to fire
// synchronously within that same tap for browser autoplay policy to allow
// it, exactly like interactive/UnlockGate.tsx's own onOpen prop documents.
// Like V2's own SongPlayer sitting behind UnlockGate's z-50 overlay until
// it opens, this sits behind hero/BirthdayGate.tsx's own z-50 gate the same
// way — invisible but present (and playing) until the gate fades away.
//
// Positioned bottom-right — checked every other fixed-position element
// already on screen across this template's own views before picking a
// corner: hero/BirthdayGate.tsx has none of its own,
// interactive/BalloonReveal.tsx / interactive/GiftUnwrap.tsx's own Back
// buttons and templates/BirthdayV1.tsx's own FinaleBackButton all sit
// top-left, interactive/MemoryFrames.tsx's own gallery close button sits
// top-right — bottom-right is genuinely unclaimed at every stage of the
// flow, the same corner Anniversary V2's own SongPlayer already uses.
//
// Palette: warm glass-morphism (translucent cream fill, rose-gold border),
// not V2's dark-gold-on-burgundy — matches every other Birthday surface's
// own cream/terracotta family rather than porting V2's palette wholesale.
// Hand-drawn local play/pause/note icons rather than an icon-package import
// (V2's own SongPlayer uses lucide-react) — every other Birthday file in
// this product line builds its own small SVG glyphs locally instead of
// pulling in an icon library, so this stays consistent with that.
// Toggle button is a real 44x44px tap target (h-11 w-11) — V2's own
// equivalent is a smaller 36px (h-9 w-9), but this project's own standing
// touch-target lesson applies to every new Birthday surface regardless of
// what its Anniversary counterpart did.

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M4.5 2.8a.9.9 0 0 1 1.36-.77l7.2 4.2a.9.9 0 0 1 0 1.55l-7.2 4.2a.9.9 0 0 1-1.36-.77Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden="true">
      <rect x={3.5} y={2.5} width={3} height={11} rx={1} />
      <rect x={9.5} y={2.5} width={3} height={11} rx={1} />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M6 2.75a.5.5 0 0 1 .62-.485l5 1.25a.5.5 0 0 1 .38.485v6.9a2.1 2.1 0 1 1-1-1.78V6.14l-4-1v5.86a2.1 2.1 0 1 1-1-1.78Z" />
    </svg>
  );
}

export default function BirthdaySongPlayer({ songTitle, songUrl, ref }: BirthdaySongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const attemptPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Only flip to "playing" once playback actually starts — same reasoning
    // interactive/SongPlayer.tsx (V2) documents: an optimistic flip would
    // leave the button showing "pause" even if the browser rejected play()
    // (autoplay blocked, decode error, invalid source, etc — rejection is
    // expected/handled here, not a bug).
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((error) => {
        console.error("Unable to play birthday song:", error);
        setIsPlaying(false);
      });
  };

  // Exposed so hero/BirthdayGate.tsx's own onOpen can start playback
  // synchronously within the same tap that extinguishes the candles.
  useImperativeHandle(ref, () => ({ play: attemptPlay }), []);

  if (!songTitle) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      attemptPlay();
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
      className="fixed bottom-6 right-6 z-30 flex max-w-[calc(100vw-3rem)] items-center gap-2 rounded-full border border-[#c9a68a]/40 bg-[#fdf6ec]/75 py-2 pl-2 pr-4 shadow-lg shadow-[#6b4332]/25 backdrop-blur-md"
    >
      {/* Only mounted when a real file exists — same reasoning
          interactive/SongPlayer.tsx documents: an <audio> with no src can
          still fire a console warning/error in some browsers on play(). */}
      {songUrl && <audio ref={audioRef} src={songUrl} onEnded={() => setIsPlaying(false)} />}

      <button
        type="button"
        onClick={toggle}
        disabled={!songUrl}
        aria-label={isPlaying ? "Pause the birthday song" : "Play the birthday song"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c9a68a]/50 text-[#c05e3d] transition-colors enabled:hover:border-[#d97a5f] enabled:hover:bg-[#d97a5f]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="flex min-w-0 items-center gap-2 pr-1">
        <MusicNoteIcon />
        <span className="font-display truncate text-sm text-[#4a2f26]">{songTitle}</span>
      </div>
    </motion.div>
  );
}

// ---- Usage (wired into templates/BirthdayV1.tsx, mounted before hero/BirthdayGate.tsx) ----
// import BirthdaySongPlayer, {
//   type BirthdaySongPlayerHandle,
// } from "@/components/birthdayShared/interactive/BirthdaySongPlayer";
//
// const songPlayerRef = useRef<BirthdaySongPlayerHandle>(null);
// const song = data.songs?.[0];
//
// <BirthdaySongPlayer ref={songPlayerRef} songTitle={song?.title} songUrl={song?.url} />
// <BirthdayGate onOpen={() => songPlayerRef.current?.play()} ...>
//   {/* rest of the Celebration Room */}
// </BirthdayGate>
//
// Reuses SiteData's own existing `songs?: SiteSong[]` field directly (same
// `songs?.[0]` sourcing templates/AnniversaryV2.tsx already uses) — no new
// customData.birthday field, since that field is already generic across
// every template family and Birthday needs nothing beyond title/url from
// it.
