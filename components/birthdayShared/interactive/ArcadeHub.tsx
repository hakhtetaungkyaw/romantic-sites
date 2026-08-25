"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Birthday V2 "Arcade Hub" — Phase 2's own hub screen, replacing Phase 1's
// plain "Main hub coming soon" placeholder (see templates/BirthdayV2.tsx).
// Lives alongside Birthday V1's own interactive/CelebrationHub.tsx in
// components/birthdayShared/ (same per-product-line, not per-version,
// isolation convention already established for hero/CountdownReveal.tsx —
// see that file's own doc comment), but is a genuinely different metaphor:
// V1 is an asymmetric, hand-placed "room" scatter (soft, celebration-room
// objects, absolute-positioned at percentage coordinates). This is an
// orderly "arcade floor" instead — a centered attraction (where the real 3D
// cake lands in Phase 3) flanked by a symmetric row/grid of arcade-cabinet
// tiles (Phase 4 wires these up to real mini-games). That structural
// regularity — plain CSS Grid/Flexbox, not hand-placed scatter coordinates —
// is what actually reads as "arcade" rather than just different icons on
// the same layout idea.
//
// No shared code with CelebrationHub.tsx or any of its siblings — every
// icon/gradient/motif below is a fresh, small-scale local construction, per
// this file's own sibling-isolation convention (CelebrationHub.tsx's own
// doc comment already establishes this: nothing in that file imports from
// its own siblings either, even within the same folder). Same reasoning:
// the aurora background below is its own local reimplementation, not an
// import from hero/CountdownReveal.tsx's own AuroraDrift, even though the
// visual idea deliberately continues that file's own established look.
//
// Phase 2 (this hub's own layout) + Phase 3 (the real 3D cake centerpiece,
// interactive/CakeCenterpiece3D.tsx — see that file's own doc comment for
// the full build/validation notes) are both built; still no functional
// mini-games (Phase 4) — every cabinet tile below is still a
// non-interactive placeholder card, not a <button> that would do nothing on
// tap (which reads as broken); the dimmed styling + "Coming Soon" pill IS
// the affordance, honestly signaling "not yet interactive" rather than
// faking a working control. The cake centerpiece is different: it's a real,
// working 3D object now (orbit/rotate, swappable frosting color, an actual
// — if currently empty — decoration-unlock mechanism), so it no longer
// carries a "Coming Soon" pill the way the tiles still do; Phase 4 wires
// mini-game completion to its decoration state, it doesn't need to be
// rebuilt. No music toggle either — Birthday V2 has no song field anywhere
// in its admin form yet (confirmed with the person; deferred to a later
// phase if/when a real song feature is actually built).
//
// CakeCenterpiece3D is loaded via next/dynamic({ ssr: false }) — allowed
// directly here (unlike the throwaway Step A prototype's own preview page,
// which needed a separate Client Component wrapper) since this whole file
// already starts with "use client". WebGL/Canvas only exists in the
// browser, so ssr:false isn't an optimization here, it's a requirement.
//
// Palette — same tokens established in Phase 1's hero/CountdownReveal.tsx,
// read directly from that file rather than re-derived: background
// #0f2b30 (center) -> #050b0f (edge), one accent color #4fbdc2, cool
// off-white text #eaf6f6.

interface ArcadeHubProps {
  personName?: string;
}

// ---- Aurora background — same 3-ribbon drifting-gradient technique
// established in hero/CountdownReveal.tsx's own AuroraDrift, reimplemented
// locally per this file's own isolation note above (fresh positions/tones,
// not copy-pasted 1:1 — sized and placed for this screen's own, taller,
// scrollable layout rather than that file's fixed full-viewport overlay).
const AURORA_RIBBONS: {
  left: string;
  top: string;
  width: number;
  height: number;
  color: string;
  duration: number;
  delay: number;
}[] = [
  { left: "18%", top: "10%", width: 460, height: 300, color: "79,189,194", duration: 10, delay: 0 },
  { left: "82%", top: "55%", width: 500, height: 340, color: "58,110,165", duration: 12, delay: 1.5 },
  { left: "50%", top: "85%", width: 420, height: 280, color: "125,214,214", duration: 9, delay: 0.8 },
];

function AuroraBackground() {
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
            background: `radial-gradient(ellipse, rgba(${ribbon.color},0.32) 0%, rgba(${ribbon.color},0) 70%)`,
          }}
          animate={{
            x: [0, 20, -14, 0],
            y: [0, -16, 12, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: ribbon.duration, delay: ribbon.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ---- Shared "Coming Soon" pill — same small badge used on both the
// centerpiece and every cabinet tile, so the two read as one consistent
// design language rather than the centerpiece inventing its own separate
// treatment. ----
function ComingSoonPill() {
  return (
    <span className="rounded-full border border-[#4fbdc2]/30 bg-[#0a1518]/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#4fbdc2]/80">
      Coming Soon
    </span>
  );
}

// Phase 3's real 3D cake — dynamically imported (ssr:false is required, not
// an optimization; WebGL/Canvas only exists in the browser) so its whole
// three.js/@react-three chunk only ever loads on this route, never on any
// other page's initial bundle. `loading` renders nothing — the brief window
// before the chunk arrives (per the Step A prototype's own measurements,
// typically well under a second on a real production bundle) just shows
// the spotlight glow blob below on its own, no separate placeholder shape
// to pop/swap away from once the real canvas mounts.
const CakeCenterpiece3D = dynamic(() => import("./CakeCenterpiece3D"), {
  ssr: false,
  loading: () => null,
});

// ---- Centerpiece — a glowing spotlight pedestal holding the real,
// interactive 3D cake (interactive/CakeCenterpiece3D.tsx). REMOVED: the
// circular bordered "porthole" frame that used to clip the canvas — visual
// review after the cake started actually working found it made a genuinely
// rotatable 3D object feel boxed into a flat 2D icon frame, undermining the
// "exists in open space" feeling a real orbit-controls object should have.
// The canvas's own WebGL surface is now transparent (gl={{ alpha: true }}
// on the Canvas itself, in CakeCenterpiece3D.tsx) so the hub's own aurora
// background shows through directly wherever the scene doesn't draw
// anything — no dark disc, no square patch, nothing bounding it at all.
// Pointer events still hit the full canvas element for OrbitControls'
// drag-to-orbit; removing the visual clip doesn't change that. ----
function CakeCenterpiece() {
  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Spotlight pedestal — a soft radial glow blob the cake appears to
          be standing on, same "spotlight" language Phase 1's entrance
          sequence already established for this template. Now the only
          "grounding" visual cue around the cake (the hard circular canvas
          edge is gone), so widened/softened slightly from its original
          size — still a gradual radial-gradient fade with no hard stop,
          just more generous, so the cake still reads as spotlit rather
          than floating with no visual anchor at all. */}
      <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
        <motion.div
          aria-hidden="true"
          className="absolute inset-[-20%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(79,189,194,0.38) 0%, rgba(79,189,194,0) 68%)" }}
          animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative h-full w-full">
          <CakeCenterpiece3D />
        </div>
      </div>
      <p className="font-display text-lg text-[#eaf6f6] sm:text-xl">Your Cake</p>
    </div>
  );
}

// ---- Arcade cabinet tiles — a "screen" bezel with a small glowing icon, a
// marquee label, and a Coming Soon pill. Non-interactive display cards, not
// <button>s — see this file's own top doc comment for why. ----
interface ArcadeTileConfig {
  label: string;
  icon: React.ReactNode;
}

function ArcadeTile({ label, icon }: ArcadeTileConfig) {
  return (
    <div
      aria-label={`${label} — coming soon`}
      className="flex w-full max-w-[168px] flex-col items-center gap-3 rounded-2xl border border-[#4fbdc2]/15 bg-[#0a1518]/50 px-4 py-5 text-center opacity-80"
      style={{ cursor: "not-allowed" }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#4fbdc2]/25 bg-[#050b0f]">
        {icon}
      </div>
      <span className="font-display text-sm text-[#eaf6f6] sm:text-base">{label}</span>
      <ComingSoonPill />
    </div>
  );
}

function iconProps() {
  return { width: 32, height: 32, viewBox: "0 0 32 32", stroke: "#4fbdc2", strokeWidth: 1.5, fill: "none" } as const;
}

function SpinWheelIcon() {
  return (
    <svg {...iconProps()} aria-hidden="true">
      <circle cx={16} cy={16} r={11} />
      <circle cx={16} cy={16} r={2} fill="#4fbdc2" stroke="none" />
      <path d="M16 5 L16 16 L25.5 21" />
      <path d="M16 5 L16 16 L6.5 21" />
    </svg>
  );
}

function RingTossIcon() {
  return (
    <svg {...iconProps()} aria-hidden="true">
      <line x1={16} y1={6} x2={16} y2={27} />
      <ellipse cx={16} cy={13} rx={9} ry={3.4} opacity={0.55} />
      <ellipse cx={16} cy={18} rx={9} ry={3.4} opacity={0.75} />
      <ellipse cx={16} cy={23} rx={9} ry={3.4} />
    </svg>
  );
}

function MemoryMatchIcon() {
  return (
    <svg {...iconProps()} aria-hidden="true">
      <rect x={5} y={8} width={10} height={14} rx={1.5} transform="rotate(-6 10 15)" />
      <rect x={17} y={8} width={10} height={14} rx={1.5} transform="rotate(6 22 15)" />
      <path d="M9 15 L11 17 L15 12" transform="rotate(-6 10 15)" />
      <path d="M20 15 L22 17 L26 12" transform="rotate(6 22 15)" />
    </svg>
  );
}

function ClawMachineIcon() {
  return (
    <svg {...iconProps()} aria-hidden="true">
      <rect x={5} y={5} width={22} height={17} rx={1.5} />
      <line x1={16} y1={5} x2={16} y2={11} />
      <path d="M16 11 L11 17 L13 20 L16 17 L19 20 L21 17 Z" />
      <circle cx={16} cy={25} r={2.4} fill="#4fbdc2" stroke="none" opacity={0.7} />
    </svg>
  );
}

const TILES: ArcadeTileConfig[] = [
  { label: "Spin the Wheel", icon: <SpinWheelIcon /> },
  { label: "Ring Toss", icon: <RingTossIcon /> },
  { label: "Memory Match", icon: <MemoryMatchIcon /> },
  { label: "Claw Machine", icon: <ClawMachineIcon /> },
];

export default function ArcadeHub({ personName }: ArcadeHubProps) {
  const heading = personName ? (
    <>
      {personName}&apos;s <span className="text-[#4fbdc2]">Arcade</span>
    </>
  ) : (
    "The Arcade"
  );

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col items-center overflow-hidden px-6 py-16"
      style={{ background: "radial-gradient(ellipse at center, #0f2b30 0%, #050b0f 75%)" }}
    >
      <AuroraBackground />

      <div className="relative z-10 flex w-full flex-col items-center">
        <p className="text-center text-xs uppercase tracking-[0.35em] text-[#eaf6f6]/50">
          The Celebration Continues
        </p>
        <h1 className="font-display mt-2 text-center text-3xl font-normal text-[#eaf6f6] sm:text-4xl">{heading}</h1>

        {/* Desktop/tablet (lg+): 2 tiles flank the centerpiece left and
            right in one horizontal row — the actual "arcade floor" read.
            Mobile: the flanking columns are hidden, and a single 2x2 grid
            (rendered separately below) takes over instead. Duplicate
            markup + CSS visibility toggling rather than one unified
            grid-template-areas layout — simplest robust option for a
            handful of static, cheap placeholder cards with no state. */}
        <div className="mt-12 flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
          <div className="hidden lg:flex lg:flex-col lg:gap-6">
            <ArcadeTile {...TILES[0]} />
            <ArcadeTile {...TILES[1]} />
          </div>

          <CakeCenterpiece />

          <div className="hidden lg:flex lg:flex-col lg:gap-6">
            <ArcadeTile {...TILES[2]} />
            <ArcadeTile {...TILES[3]} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:hidden">
            {TILES.map((tile) => (
              <ArcadeTile key={tile.label} {...tile} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
