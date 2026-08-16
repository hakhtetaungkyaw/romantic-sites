"use client";

import { motion } from "framer-motion";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";

// V1's own song context/provider + floating control — fully self-contained
// from V2's interactive/SongPlayer.tsx + UnlockGate.tsx per the project's
// V1/V2 file-separation rule (no shared component files). The underlying
// autoplay-trigger APPROACH is the same one already verified working in
// V2 (see the investigation this task opened with): `audio.play()` must be
// called synchronously within the same call stack as the user gesture that
// triggers it, not from a useEffect reacting to state change afterward —
// V2's chain is UnlockGate's button onClick -> handleOpen() (sync) ->
// onOpen?.() (sync) -> songPlayerRef.current?.play() (sync ref call) ->
// attemptPlay() (sync) -> audio.play() (sync call, async-resolving
// Promise, which is fine — browsers only require the *call* to originate
// synchronously in the gesture, not that it resolve synchronously). V1 has
// no gate/ref-imperative-handle indirection (there's no separate "gate"
// component sitting in front of the whole page the way V2's UnlockGate
// does) — instead this context exposes `playFirstTime` directly, and
// message/SealedLetter.tsx calls it synchronously inside its own envelope
// click handler, one level of indirection shallower than V2's ref-handle
// chain but the same underlying guarantee.
interface V1SongContextValue {
  hasSong: boolean;
  hasStarted: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  /** Starts playback the first time it's called; every call after the first no-ops (does not restart or otherwise interfere with whatever play/pause state the floating control is currently in). Must be called synchronously from within a real user-gesture event handler — see the file header. */
  playFirstTime: () => void;
  /** Play/pause toggle for the floating control. */
  toggle: () => void;
  toggleMute: () => void;
}

const V1SongContext = createContext<V1SongContextValue | null>(null);

export function useV1Song(): V1SongContextValue {
  const ctx = useContext(V1SongContext);
  if (!ctx) {
    throw new Error("useV1Song must be used within a V1SongProvider");
  }
  return ctx;
}

// Bootstrap Icons glyphs, inlined as raw path data rather than pulling in
// the bootstrap-icons package for four icons — same pattern already used
// throughout V1 (message/SealedLetter.tsx's CloseIcon, gallery/
// SunlitPolaroids.tsx's chevrons).
function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width={13} height={13} fill="currentColor" aria-hidden="true">
      <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={13} height={13} fill="currentColor" aria-hidden="true">
      <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z" />
    </svg>
  );
}

function VolumeUpIcon() {
  return (
    <svg viewBox="0 0 16 16" width={15} height={15} fill="currentColor" aria-hidden="true">
      <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8a7.48 7.48 0 0 1-2.197 5.303z" />
      <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" />
      <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg viewBox="0 0 16 16" width={15} height={15} fill="currentColor" aria-hidden="true">
      <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06" />
      <path d="M11.096 8l1.402-1.402a.5.5 0 0 0-.707-.707L10.39 7.293 8.988 5.89a.5.5 0 1 0-.707.708L9.683 8l-1.402 1.402a.5.5 0 1 0 .707.707l1.402-1.402 1.401 1.402a.5.5 0 0 0 .707-.707z" />
    </svg>
  );
}

// Only appears once `playFirstTime` has actually been called (i.e. the
// envelope in SealedLetter.tsx has been opened) — before that, there is
// nothing to control yet, so it stays entirely absent (not just hidden)
// rather than sitting on screen as a dead control the whole time. Bottom-
// right, matching V2's interactive/SongPlayer.tsx position, restyled onto
// V1's own peach/cream/rose-gold/terracotta tokens (never V2's dark
// burgundy/gold).
function V1FloatingPlayer({ songTitle }: { songTitle?: string }) {
  const { hasSong, hasStarted, isPlaying, isMuted, toggle, toggleMute } = useV1Song();

  if (!hasSong || !hasStarted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-30 flex max-w-[calc(100vw-3rem)] items-center gap-1.5 rounded-full border border-[#c9a68a]/40 bg-[#fdf6ec]/95 py-2 pl-2 pr-3 shadow-lg shadow-[#6b4332]/15 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause our song" : "Play our song"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d97a5f] text-[#fdf6ec] transition-transform duration-200 hover:scale-105 hover:bg-[#c1573a]"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b4332] transition-colors duration-200 hover:bg-[#c9a68a]/15"
      >
        {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
      </button>

      {songTitle && (
        <span className="font-display max-w-[9rem] truncate pl-0.5 text-xs italic text-[#4a2f26]/80 sm:max-w-[12rem] sm:text-sm">
          {songTitle}
        </span>
      )}
    </motion.div>
  );
}

interface V1SongProviderProps {
  songUrl?: string;
  songTitle?: string;
  children: ReactNode;
}

// Wraps the whole V1 template composition (templates/AnniversaryV1.tsx) so
// every section — specifically message/SealedLetter.tsx, which triggers the
// first play, and this file's own V1FloatingPlayer, which controls it
// afterward — shares the one <audio> instance/play state via context,
// instead of each needing its own prop-drilled ref.
export function V1SongProvider({ songUrl, songTitle, children }: V1SongProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const attemptPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Only flip to "playing" once playback actually starts — setting it
    // optimistically would leave the control showing "pause" even if the
    // browser rejects the play() call (autoplay blocked, decode error,
    // etc). Rejection is expected/handled, not a bug.
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((error) => {
        console.error("Unable to play song:", error);
        setIsPlaying(false);
      });
  };

  const playFirstTime = () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setHasStarted(true);
    attemptPlay();
  };

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

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  return (
    <V1SongContext.Provider
      value={{
        hasSong: Boolean(songUrl),
        hasStarted,
        isPlaying,
        isMuted,
        playFirstTime,
        toggle,
        toggleMute,
      }}
    >
      {/* Only mounted when a real file exists — an <audio> with no src can
          still fire a console warning/error in some browsers on play(). */}
      {songUrl && <audio ref={audioRef} src={songUrl} onEnded={() => setIsPlaying(false)} />}

      {children}

      <V1FloatingPlayer songTitle={songTitle} />
    </V1SongContext.Provider>
  );
}
