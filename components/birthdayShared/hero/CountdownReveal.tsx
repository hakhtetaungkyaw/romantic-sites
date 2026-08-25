"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState, type ReactNode } from "react";

import confettiAnimation from "@/public/animations/confetti.json";

// Birthday V2's own entrance sequence — lives in components/birthdayShared/
// alongside Birthday V1's hero/BirthdayGate.tsx (not a new "V2" sibling
// folder; see this component's own REGISTRY.md entry for why), and does not
// import anything from that file or any other V1 component. Structurally
// inspired by BirthdayGate's "wrap children, only mount them once the
// sequence finishes" shape, but the interaction model is deliberately
// different: BirthdayGate needs a tap to blow out the candles; this sequence
// has NO tap targets at all anywhere in its 4 beats — every stage advances
// on its own timer, so there is no way to skip or speed through it. The
// visitor watches the whole thing every visit, by design.
//
// "Spotlight Countdown" visual identity — deep teal/blue-black "sophisticated
// night" palette, revised after live-testing the original warm rose-pink
// version: checked Anniversary V2's own tokens first (ambient/NightSky.tsx's
// section background is deep indigo-violet #0d0a1a/#150f30/#1e1240,
// templates/AnniversaryV2.tsx's own page wash is burgundy/wine
// #1a0a12/#2b0f1a/#3a1220, both gold-accented #d4af7a/#f2dfb0) so this
// stays a genuinely distinct hue family — cool teal/blue, not violet, not
// wine, no gold — rather than reading as a re-skin of that template. One
// accent color only (ACCENT below) rather than pairing it with a second warm
// hue, which is what reads as restrained/"sophisticated" instead of
// "party." Background is a soft aurora drift (see AuroraDrift below), not
// the single centered radial glow + scattered star-dot field this used to
// have — that combination was explicitly disliked after seeing it live.
// Big serif countdown numerals and a confetti burst (reusing the same
// already-licensed public/animations/confetti.json asset BirthdayGate.tsx
// and closing/GrandFinale.tsx already use — a shared static asset file, not
// shared component code, so this doesn't cross the V1/V2 isolation line;
// recolored for just this instance via a CSS hue-rotate/saturate filter,
// the same shared-Lottie-recolor trick lib/v1ButterflyFilters.ts's
// BUTTERFLY_FILTER_GOLD already established, since the asset's own baked-in
// warm party colors would otherwise clash with this cooler backdrop).

// Background gradient stops, used in the actual inline `style` below —
// Tailwind's arbitrary-value classes can't reference a JS variable, so the
// accent (#4fbdc2) and text color (#eaf6f6) mentioned above are hardcoded
// directly in each className that needs them instead of a matching const
// here; these two stay real consts since `style={{ background: ... }}`
// genuinely can interpolate them.
const BG_CENTER = "#0f2b30";
const BG_EDGE = "#050b0f";
// Shifts the confetti Lottie's own baked-in warm palette toward this
// template's cool teal accent — hue-rotate does the actual color shift,
// saturate keeps it from looking washed out afterward (a plain hue-rotate on
// already-vivid colors tends to desaturate the result).
const CONFETTI_FILTER = "hue-rotate(140deg) saturate(1.3)";

interface CountdownRevealProps {
  /** The birthday person's name — reads data.people[0]?.name directly, same
   *  single-honoree pattern hero/BirthdayGate.tsx's own personName prop
   *  already uses for Birthday V1 (confirmed with the person: Birthday V2
   *  matches V1's single-honoree design, not Anniversary's people[] list —
   *  see app/admin/_shared/birthdayV2Order.ts's own doc comment on
   *  BirthdayV2OrderInput.name). Optional, same reasoning BirthdayGate.tsx's
   *  own prop documents: falls back to a plain greeting when unset, so this
   *  stays usable/testable without requiring a name. */
  personName?: string;
  /** The entrance sequence's one piece of customizable text — SiteData's
   *  own birthdayV2Message field. */
  message: string;
  /** Whatever comes after the sequence — Phase 1 passes a plain "Main hub
   *  coming soon" placeholder; a later phase swaps this for the real hub
   *  without this component needing to change at all. */
  children: ReactNode;
}

type Stage = "anticipation" | "countdown" | "burst" | "message";

// ---- Timings — generous enough to read comfortably, not so long the
// sequence drags on a repeat visit (it plays every time, with no skip).
// Anticipation/burst no longer have a flat hold duration — they hold only
// once their own typewriter effect (below) has finished typing, so the
// stage's actual on-screen time scales with how long its text is instead of
// racing (or lagging behind) a hardcoded guess. ----
const ANTICIPATION_TYPE_CHAR_MS = 55;
const ANTICIPATION_HOLD_AFTER_MS = 1000;
const COUNTDOWN_DIGIT_MS = 900;
const COUNTDOWN_DIGITS = [3, 2, 1];
const BURST_TYPE_CHAR_MS = 60;
const BURST_HOLD_AFTER_MS = 1400;
const MESSAGE_HOLD_MS = 6000;

// ---- One-shot typewriter — types a sequence of lines (one at a time, each
// fully typed before the next starts) and stops, no delete/loop phase.
// Reimplemented locally rather than importing message/TypedPhrases.tsx's own
// useTypewriter (a components/shared/ file — off-limits per this project's
// per-product-line isolation convention, same reasoning
// hero/CountdownReveal's own top comment already gives for not importing
// from hero/BirthdayGate.tsx): same character-by-character `setTimeout`
// state-machine technique that file already established, generalized from
// one string to a sequence of lines (needed here so the two-line "Happy
// Birthday," / "{name}!" layout still types top-to-bottom like a real
// typewriter's carriage return, instead of one long string with a literal
// "\n" JSX can't render as a line break).
//
// While inactive, the returned `typedLines`/`done` are masked to "nothing
// typed yet" purely at render time (see the return below) rather than by
// resetting the underlying counters via a synchronous setState call in an
// effect — react-hooks/set-state-in-effect flags the latter (same fix
// pattern already applied to lib/useV1InViewport.ts). The internal counters
// themselves are never reset, so a stage that went inactive and later
// became active again would resume mid-type instead of replaying from
// scratch — a real difference from a true reset, but not one that matters
// for how this hook is actually used here: each stage (anticipation, burst)
// only ever activates once per mount of the whole sequence, never
// re-enters, and the sequence itself doesn't remount mid-visit.
function useTypeSequence(
  active: boolean,
  lines: string[],
  charMs: number,
): { typedLines: string[]; lineIndex: number; done: boolean } {
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const currentLine = lines[lineIndex] ?? "";

    if (charCount < currentLine.length) {
      const timeoutId = window.setTimeout(() => setCharCount((c) => c + 1), charMs);
      return () => window.clearTimeout(timeoutId);
    }

    // Current line fully typed — advance to the next one after a brief
    // beat (a little longer than one character's own delay, so the pause
    // between lines reads as a deliberate line break, not just another
    // character tick).
    if (lineIndex < lines.length - 1) {
      const timeoutId = window.setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharCount(0);
      }, charMs * 2);
      return () => window.clearTimeout(timeoutId);
    }
  }, [active, lineIndex, charCount, lines, charMs]);

  const typedLines = active
    ? lines.map((line, i) => (i < lineIndex ? line : i === lineIndex ? line.slice(0, charCount) : ""))
    : lines.map(() => "");
  const lastLine = lines[lines.length - 1] ?? "";
  const done = active && lineIndex === lines.length - 1 && charCount >= lastLine.length;

  return { typedLines, lineIndex, done };
}

function TypewriterCursor() {
  return (
    <span
      aria-hidden="true"
      className="typewriter-cursor ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.15em] bg-current align-middle"
    />
  );
}

// Replaces the previous single centered radial glow + scattered twinkle-dot
// field entirely (both disliked live, not just their old rose-pink color) —
// 3 large, heavily-blurred elongated gradient "ribbons," each drifting
// slowly at its own independent phase/duration so their combined movement
// reads as organic rather than a single pulsing blob. Fixed, hand-placed
// positions/tones (not Math.random()) — same hydration-safety reasoning as
// every other deterministic decorative field across this project: needs to
// render identically server/client, only needs to look ambient, not
// actually be random. Pure CSS radial-gradients on absolutely-positioned
// blurred divs — no new SVG or library.
const AURORA_RIBBONS: {
  left: string;
  top: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}[] = [
  { left: "22%", top: "28%", width: 520, height: 300, color: "79,189,194", duration: 9, delay: 0 },
  { left: "78%", top: "68%", width: 480, height: 320, color: "58,110,165", duration: 11, delay: 1.2 },
  { left: "50%", top: "45%", width: 380, height: 260, color: "125,214,214", duration: 8, delay: 0.6 },
];

// `intensity` still drives the same "builds toward the reveal" pacing the
// old single SpotlightGlow had — each ribbon's own opacity/scale scales
// with it, just distributed across 3 independently-drifting layers instead
// of one centered pulse.
function AuroraDrift({ intensity }: { intensity: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {AURORA_RIBBONS.map((ribbon, i) => (
        <motion.div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            left: ribbon.left,
            top: ribbon.top,
            width: ribbon.width,
            height: ribbon.height,
            background: `radial-gradient(ellipse, rgba(${ribbon.color},0.4) 0%, rgba(${ribbon.color},0) 70%)`,
          }}
          animate={{
            x: [0, 24, -16, 0],
            y: [0, -18, 14, 0],
            scale: [1, 1.08 + intensity * 0.05, 0.97, 1],
            opacity: [0.35 + intensity * 0.1, 0.55 + intensity * 0.12, 0.35 + intensity * 0.1],
          }}
          transition={{ duration: ribbon.duration, delay: ribbon.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const ANTICIPATION_LINES = ["Your Special Day Is Coming"];

export default function CountdownReveal({ personName, message, children }: CountdownRevealProps) {
  const [stage, setStage] = useState<Stage>("anticipation");
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Two lines when a name is known ("Happy Birthday," / "{name}!", typed top
  // to bottom like a real typewriter's carriage return), one plain line
  // otherwise — same fallback BirthdayGate.tsx's own personName prop uses.
  const burstLines = personName ? ["Happy Birthday,", `${personName}!`] : ["Happy Birthday!"];

  const anticipationType = useTypeSequence(stage === "anticipation", ANTICIPATION_LINES, ANTICIPATION_TYPE_CHAR_MS);
  const burstType = useTypeSequence(stage === "burst", burstLines, BURST_TYPE_CHAR_MS);

  // Locks body scroll for as long as the sequence is showing — same
  // technique every other full-screen gate in this project uses
  // (hero/BirthdayGate.tsx, hero/GiftBoxUnlock.tsx, interactive/UnlockGate.tsx).
  useEffect(() => {
    if (revealed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [revealed]);

  // Stage 1 -> 2, once the anticipation line has fully typed (see
  // useTypeSequence above) plus a short hold so it's actually readable
  // before the countdown takes over.
  useEffect(() => {
    if (stage !== "anticipation" || !anticipationType.done) return;
    const timeoutId = window.setTimeout(() => setStage("countdown"), ANTICIPATION_HOLD_AFTER_MS);
    return () => window.clearTimeout(timeoutId);
  }, [stage, anticipationType.done]);

  // Stage 2: advances through 3 -> 2 -> 1, then into the burst stage. Each
  // digit is its own timer tick rather than one big interval, so the
  // cleanup on unmount/stage-change can't leave a stray tick firing after
  // the countdown has already moved on.
  useEffect(() => {
    if (stage !== "countdown") return;
    const timeoutId = window.setTimeout(() => {
      if (countdownIndex < COUNTDOWN_DIGITS.length - 1) {
        setCountdownIndex((i) => i + 1);
      } else {
        setStage("burst");
      }
    }, COUNTDOWN_DIGIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [stage, countdownIndex]);

  // Stage 3 -> 4, same "type fully, then hold briefly" pattern as stage 1.
  useEffect(() => {
    if (stage !== "burst" || !burstType.done) return;
    const timeoutId = window.setTimeout(() => setStage("message"), BURST_HOLD_AFTER_MS);
    return () => window.clearTimeout(timeoutId);
  }, [stage, burstType.done]);

  // Stage 4 -> reveal children (the future hub; a plain placeholder today).
  useEffect(() => {
    if (stage !== "message") return;
    const timeoutId = window.setTimeout(() => setRevealed(true), MESSAGE_HOLD_MS);
    return () => window.clearTimeout(timeoutId);
  }, [stage]);

  const intensity = stage === "anticipation" ? 0 : stage === "countdown" ? 1 : stage === "burst" ? 2 : 1.4;

  return (
    <>
      <AnimatePresence>
        {!revealed && (
          <motion.div
            key="countdown-reveal"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center"
            style={{ background: `radial-gradient(ellipse at center, ${BG_CENTER} 0%, ${BG_EDGE} 75%)` }}
          >
            <AuroraDrift intensity={intensity} />

            <AnimatePresence mode="wait">
              {stage === "anticipation" && (
                <motion.p
                  key="anticipation"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="font-display relative z-10 text-3xl font-normal text-[#eaf6f6] sm:text-4xl md:text-5xl"
                >
                  {anticipationType.typedLines[0]}
                  {!anticipationType.done && <TypewriterCursor />}
                </motion.p>
              )}

              {stage === "countdown" && (
                <motion.p
                  key={`digit-${countdownIndex}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.35, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="font-display relative z-10 text-8xl font-medium text-[#4fbdc2] sm:text-9xl"
                  style={{ textShadow: "0 0 40px rgba(79,189,194,0.6)" }}
                >
                  {COUNTDOWN_DIGITS[countdownIndex]}
                </motion.p>
              )}

              {stage === "burst" && (
                <motion.div
                  key="burst"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-10"
                >
                  {/* Mounts fresh exactly once, right as the burst stage
                      starts, so autoplay always begins at frame 0 — same
                      one-shot loop={false} pattern as
                      hero/BirthdayGate.tsx's own confetti burst. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
                    style={{ filter: CONFETTI_FILTER }}
                  >
                    <Lottie animationData={confettiAnimation} loop={false} autoplay />
                  </div>
                  <p className="font-display text-4xl font-normal text-[#eaf6f6] sm:text-5xl md:text-6xl">
                    {burstLines.length === 2 ? (
                      <>
                        {burstType.typedLines[0]}
                        {!burstType.done && burstType.lineIndex === 0 && <TypewriterCursor />}
                        <br />
                        <span className="text-[#4fbdc2]">
                          {burstType.typedLines[1]}
                          {!burstType.done && burstType.lineIndex === 1 && <TypewriterCursor />}
                        </span>
                      </>
                    ) : (
                      <>
                        {burstType.typedLines[0]}
                        {!burstType.done && <TypewriterCursor />}
                      </>
                    )}
                  </p>
                </motion.div>
              )}

              {stage === "message" && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative z-10 max-w-md rounded-2xl border border-[#4fbdc2]/30 bg-[#0a1518]/70 px-6 py-8 shadow-2xl shadow-black/50 backdrop-blur-md sm:px-10 sm:py-10"
                >
                  <p className="font-display whitespace-pre-wrap text-lg italic leading-relaxed text-[#eaf6f6] sm:text-xl">
                    {message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {revealed && children}
    </>
  );
}
