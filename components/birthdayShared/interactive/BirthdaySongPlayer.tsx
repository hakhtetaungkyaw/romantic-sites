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
// flow, the same corner Anniversary V2's own SongPlayer already uses. A
// live check confirmed this is the ONLY fixed-position element anywhere in
// this product line's bottom-right corner (grepped the whole
// birthdayShared/ tree for other `fixed bottom-*` elements — none), so the
// corner itself was never the problem; see the responsive-collapse note
// below for what actually was.
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
// what its Anniversary counterpart did. This size is now held CONSTANT
// across every breakpoint (see responsive-collapse note below) rather than
// shrunk on mobile — checked interactive/RevealCard.tsx's own close button
// (Anniversary V2) for precedent on how a fixed-position control should
// scale responsively: it also keeps its own 44x44px tap target fixed at
// every breakpoint and only nudges its position slightly (`right-1 top-1`
// -> `sm:right-2 sm:top-2`), never shrinking the target itself — the same
// principle applied here.
//
// Responsive collapse: on narrow viewports (confirmed via live screenshot
// at 375px) this pill's own title text was wide enough to have its
// rendered box reach the bottom-right corner other fixed content also
// wants to occupy there (e.g. interactive/CelebrationHub.tsx's own finale
// CTA, once scrolled/positioned nearby) — genuinely too large a footprint
// on a small screen, not a positioning conflict. Below Tailwind's `sm`
// breakpoint (640px — comfortably covers the 375-430px phone range this
// task called out), the title + note-icon column collapses away entirely
// (`hidden sm:flex`), leaving just the unchanged 44px circular toggle
// button with minimal (`p-1`) surrounding padding so the whole pill reads
// as a small, clean circular badge rather than an oval with dead space;
// at `sm:` and up it reopens into the original full pill with title.
// Neither Anniversary V2's own SongPlayer.tsx nor this file's own earlier
// version had any such collapse — genuinely new behavior for this project,
// not a ported pattern, since nothing existing needed it before this
// template's own hub screen (5 tiles + RoomProgress + a finale CTA, all
// sharing the same small viewport) made a full-width pill a problem.

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
      className="fixed bottom-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#c9a68a]/40 bg-[#fdf6ec]/75 p-1 shadow-lg shadow-[#6b4332]/25 backdrop-blur-md sm:bottom-6 sm:right-6 sm:max-w-[calc(100vw-3rem)] sm:py-2 sm:pl-2 sm:pr-4"
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

      <div className="hidden min-w-0 items-center gap-2 pr-1 sm:flex">
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
