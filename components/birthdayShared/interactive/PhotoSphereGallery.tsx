"use client";

import { Billboard, Image as DreiImage, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Group, Mesh } from "three";

import type { SitePhoto } from "@/types/site";

// Birthday V2 Phase 5b — the 3D sphere photo gallery. Design/interaction
// reference: a Framer component (SphereGallery3D) built in raw WebGL,
// because Framer components must be dependency-free single files — that
// constraint doesn't apply here, so this is a full reimplementation on our
// already-installed @react-three/fiber + @react-three/drei + three stack
// (from Phase 3's cake), not a port of that raw WebGL code. Confirmed in
// the Phase 5 investigation report that drei already has real primitives
// for most of this: `<Billboard>` (always faces camera), `<Image>`
// (textured rounded-rect quad, texture loading built in), `<Line>` (the
// nucleus-to-node connectors) — meaningfully less code than hand-rolling
// matrix math a second time.
//
// Deliberately CUT from the reference (per the investigation's own
// recommendation, confirmed): magnetic hover-pull (ray-vs-node proximity +
// per-node spring physics). Real complexity for a decorative flourish that
// has no touch equivalent at all — there's no continuously-tracked pointer
// position between taps on a phone, and this product's audience is
// confirmed phone-first. Replaced with something that works identically on
// touch or desktop: a gentle idle "breathing" scale pulse per node (offset
// phase so they don't move in sync) plus a press-scale on tap, the same
// `whileTap`-style feedback every other tap target in this codebase already
// uses — see Node below.
//
// Self-contained, same shape as the existing 2D lightboxes in this
// codebase (gallery/SunlitPolaroids.tsx's own Lightbox, gallery/
// Magazine.tsx's own): owns its own `fixed inset-0` + `createPortal` +
// close button + body-scroll lock. A caller just conditionally renders
// `{open && <PhotoSphereGallery photos={...} onClose={...} />}` — nothing
// about WHERE this gets triggered from (a tile, a banner, whatever Phase 5c
// decides) needs to live in this file.
//
// Tapping a node opens a plain 2D full-screen lightbox for that photo (with
// prev/next) INSIDE this same component — reuses the exact established
// lightbox visual language (plain <img>, CSS-only sizing, portal, close/
// prev/next buttons) rather than inventing new interaction patterns. The 3D
// sphere view and the 2D lightbox view are mutually exclusive (AnimatePresence
// swap), not stacked.
//
// frameloop is left at R3F's default ("always"), NOT "demand" like
// CakeCenterpiece3D.tsx — auto-rotate-when-idle and the per-node breathing
// pulse both need continuous rendering, there's no way around that for
// this feature. This is a deliberately different, less strict performance
// posture than the cake, flagged in the investigation report as needing
// its own real-device spot-check before Phase 5c wires this into the hub.
//
// Palette — same tokens established in Phases 1-3, not new colors: accent
// #4fbdc2, background #0f2b30/#050b0f, text #eaf6f6.

interface PhotoSphereGalleryProps {
  photos: SitePhoto[];
  /** How many times each photo repeats around the sphere (total node count
   *  = `photos.length * multiplier`), admin-set per order via
   *  app/admin/_shared/birthdayV2Order.ts's own `galleryRepeatMultiplier`
   *  field. Undefined (the admin left it blank) is NOT "no repeat" — it
   *  means "auto-calculate a sensible multiplier from the photo count,"
   *  resolved by `resolveRepeatMultiplier` below, not a hardcoded default
   *  here. A sparse 6-photo order and a rich 15-photo order need very
   *  different multipliers to both land at a reasonable node count, which
   *  is exactly why this is a per-order admin control rather than a single
   *  constant. */
  repeatMultiplier?: number;
  onClose: () => void;
}

const ACCENT = "#4fbdc2";
const TEXT_COLOR = "#eaf6f6";
const SPHERE_RADIUS = 3.4;
const NODE_WIDTH = 0.86;
const NODE_HEIGHT = 0.64;
const NUCLEUS_RADIUS = 0.32;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 5;
// Aimed for visually "full but not crowded" at this file's own
// SPHERE_RADIUS/NODE_WIDTH — verified in Phase 5b's own live testing that
// 8 nodes already read comfortably spaced at this radius, and the sphere's
// surface area leaves plenty of room well past this target (even the
// MAX_MULTIPLIER extreme, a 4-photo order at x5 = 20 nodes, covers only a
// small fraction of the sphere's own surface).
const TARGET_NODE_COUNT = 18;

// Resolves the admin's own (optional) explicit multiplier, or — when they
// left it blank — auto-calculates one from the photo count so the sphere
// lands near TARGET_NODE_COUNT regardless of how many real photos an order
// has. Either way, clamped to [MIN_MULTIPLIER, MAX_MULTIPLIER] as a final
// backstop (the admin form already validates this range, but a raw prop
// value shouldn't have to trust its caller blindly). Exported for the
// admin form's own reference/tests to stay in sync with this component's
// actual behavior, not a second hardcoded copy of the same math.
export function resolveRepeatMultiplier(photoCount: number, explicit?: number): number {
  const raw = explicit !== undefined ? explicit : Math.round(TARGET_NODE_COUNT / Math.max(1, photoCount));
  return Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, Math.round(raw)));
}

// Evenly distributes n points across a sphere's surface via the golden-
// angle (Fibonacci sphere) method — works for any n, from 1 up through
// hundreds, with no clustering, which is the whole point of the algorithm
// (confirmed in the investigation report; VOWX orders have a variable,
// admin-entered photo count, so this can't assume a fixed n). n=1 is a
// special case (the general formula divides by n-1).
function fibonacciSpherePoints(n: number, radius: number): [number, number, number][] {
  if (n <= 0) return [];
  if (n === 1) return [[0, 0, radius]];
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return points;
}

// The glowing core — same self-illuminated-material language
// CakeCenterpiece3D.tsx already established for this template (emissive
// material, not dependent on scene lighting to read), plus a slow
// continuous pulse since this scene already renders continuously anyway
// (no frameloop="demand" cost being protected here, unlike the cake).
function Nucleus() {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 1.4) * 0.08;
    ref.current?.scale.setScalar(scale);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[NUCLEUS_RADIUS, 24, 24]} />
      <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.9} roughness={0.3} />
    </mesh>
  );
}

interface NodeProps {
  photo: SitePhoto;
  position: [number, number, number];
  phaseOffset: number;
  onOpen: () => void;
}

// One photo node — a Billboard-wrapped drei <Image> (built-in texture
// loading + rounded corners + cover-fit cropping, the same "one fixed
// frame, cropped to fill" approach gallery/SunlitPolaroids.tsx already
// established for handling photos of unknown/varying aspect ratio).
// Breathing pulse offset per-node via `phaseOffset` so a whole sphere of
// nodes doesn't move in unison. `whileTap`-equivalent press feedback via
// plain pointer events (R3F meshes get real pointer/click events with
// correct raycasting built in — no hand-rolled hit-testing needed, unlike
// the reference's own raw-WebGL ray math).
function Node({ photo, position, phaseOffset, onOpen }: NodeProps) {
  const groupRef = useRef<Group>(null);
  const [pressed, setPressed] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const breathe = 1 + Math.sin(t * 1.1 + phaseOffset) * 0.035;
    const pressScale = pressed ? 0.92 : 1;
    groupRef.current?.scale.setScalar(breathe * pressScale);
  });

  return (
    <group ref={groupRef} position={position}>
      <Billboard>
        <DreiImage
          url={photo.src}
          scale={[NODE_WIDTH, NODE_HEIGHT]}
          radius={0.06}
          transparent
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setPressed(true);
          }}
          onPointerUp={() => setPressed(false)}
          onPointerOut={() => setPressed(false)}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            document.body.style.cursor = "auto";
          }}
        />
      </Billboard>
    </group>
  );
}

function SphereScene({
  photos,
  repeatMultiplier,
  onOpenIndex,
}: {
  photos: SitePhoto[];
  repeatMultiplier?: number;
  onOpenIndex: (i: number) => void;
}) {
  const multiplier = useMemo(
    () => resolveRepeatMultiplier(photos.length, repeatMultiplier),
    [photos.length, repeatMultiplier],
  );
  // Node count is photos.length * multiplier, NOT capped to the raw photo
  // array — nodes beyond photos.length cycle back through the same photos
  // (photos[i % photos.length]) so a sparse gallery still fills the sphere
  // out. Each node's own onOpen still maps back to `i % photos.length`, not
  // the raw node index — the lightbox only ever knows about the real
  // (non-repeated) photos array, so tapping any repeated instance of photo
  // 2 opens the same single photo 2 in the lightbox, not a nonexistent
  // "node 14."
  const nodeCount = photos.length * multiplier;
  const points = useMemo(() => fibonacciSpherePoints(nodeCount, SPHERE_RADIUS), [nodeCount]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 3]} intensity={1} color={TEXT_COLOR} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color={TEXT_COLOR} />
      <pointLight position={[0, 0, 0]} intensity={0.6} color={ACCENT} />

      <Nucleus />

      {points.map((point, i) => (
        <Line
          key={`line-${i}`}
          points={[[0, 0, 0], point]}
          color={ACCENT}
          transparent
          opacity={0.28}
          lineWidth={1}
        />
      ))}

      {points.map((point, i) => {
        const photoIndex = i % photos.length;
        return (
          <Node
            key={i}
            photo={photos[photoIndex]}
            position={point}
            phaseOffset={i * 0.7}
            onOpen={() => onOpenIndex(photoIndex)}
          />
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={9}
        autoRotate
        autoRotateSpeed={0.6}
        rotateSpeed={0.6}
      />
    </>
  );
}

// ---- 2D lightbox for a tapped node — same established visual language as
// gallery/SunlitPolaroids.tsx's own Lightbox / gallery/Magazine.tsx's own:
// plain <img> (CSS-only sizing, no next/image dimension requirement), a
// portal, close + prev/next buttons. Recolored to this template's own
// teal palette rather than copied verbatim (per this project's standing
// file-isolation convention — reimplemented locally, not imported). ----
function noopSubscribe() {
  return () => {};
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"
      />
    </svg>
  );
}

interface PhotoLightboxProps {
  photos: SitePhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function PhotoLightbox({ photos, index, onClose, onNavigate }: PhotoLightboxProps) {
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const photo = photos[index];

  const goPrev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const goNext = () => onNavigate((index + 1) % photos.length);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!isMounted || !photo) return null;

  return createPortal(
    <motion.div
      key="sphere-gallery-lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden p-4 sm:p-8"
      style={{ background: "rgba(5,11,15,0.92)" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0a1518] text-[#4fbdc2] shadow-lg shadow-black/50 ring-1 ring-[#4fbdc2]/30 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_18px_rgba(79,189,194,0.45)]"
      >
        <CloseIcon />
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#0a1518] text-[#4fbdc2] shadow-lg shadow-black/50 ring-1 ring-[#4fbdc2]/30 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_18px_rgba(79,189,194,0.45)] sm:left-6"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#0a1518] text-[#4fbdc2] shadow-lg shadow-black/50 ring-1 ring-[#4fbdc2]/30 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_18px_rgba(79,189,194,0.45)] sm:right-6"
        >
          <ChevronRightIcon />
        </button>
      )}

      <motion.div
        key={photo.src}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-0 flex w-fit max-h-[90vh] max-w-[92vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex w-fit max-w-full flex-col items-center rounded-md border border-[#4fbdc2]/25 bg-[#0a1518] p-3 pb-5 shadow-2xl shadow-black/60 sm:p-4 sm:pb-6">
          {/* Plain <img>, not next/image — same reasoning already
              established for every other lightbox in this codebase: shows
              the photo at its own real, natural aspect ratio, no
              width/height dimension source needed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.caption ?? "Enlarged memory"}
            className="block h-auto max-h-[58vh] w-auto max-w-[82vw] rounded-sm object-contain sm:max-h-[62vh]"
          />
          {photo.caption && (
            <p className="font-display mt-3 max-w-[240px] text-center text-sm italic leading-snug text-[#eaf6f6] sm:max-w-xs sm:text-base">
              {photo.caption}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

// ---- WebGL context-loss recovery — a real finding from this component's
// own Step-equivalent real-device-adjacent spot-check, not a hypothetical:
// tested in a headless/software-rendered environment (no real GPU
// available there either) and found that sustained continuous rendering
// (frameloop="always", required for auto-rotate + the idle breathing pulse
// — see this file's own top doc comment on why "demand" mode isn't an
// option here) reliably lost the WebGL context after a few seconds, with
// or without any user interaction at all — isolated via testing idle
// auto-rotate alone with zero drag input, which reproduced it just as
// reliably as dragging did. That specific trigger is very likely tied to
// the software rasterizer used in that headless environment rather than
// real GPU hardware, so it may not reproduce identically on a real phone —
// but WebGL context loss under memory/thermal pressure is itself a real,
// well-documented phenomenon on real mobile browsers (not invented for
// this codebase), and a continuously-rendering scene is exactly the
// higher-risk case for it. Recovering gracefully instead of going
// permanently blank is standard practice for any production WebGL app,
// not a workaround specific to the environment that surfaced it.
//
// The browser only attempts automatic context restoration if
// `preventDefault()` is called on the `webglcontextlost` event — without
// that call, a lost context stays lost forever, which is what the
// component looked like before this fix (a silent, permanent blank
// canvas, no error surfaced anywhere). On `webglcontextrestored`,
// `sceneKey` increments to force React to fully remount `<SphereScene>` —
// deliberately not relying on assumptions about which of three.js's own
// internal GPU resources (textures, geometries) would or wouldn't survive
// restoration; a fresh mount recreates everything from scratch, the same
// safe-by-construction guarantee a full page reload would give, without
// actually reloading the page.
function SphereCanvas({
  photos,
  repeatMultiplier,
  onOpenIndex,
}: {
  photos: SitePhoto[];
  repeatMultiplier?: number;
  onOpenIndex: (i: number) => void;
}) {
  const [contextLost, setContextLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0.6, 7], fov: 50 }}
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              setContextLost(true);
            },
            false,
          );
          canvas.addEventListener(
            "webglcontextrestored",
            () => {
              setContextLost(false);
              setSceneKey((k) => k + 1);
            },
            false,
          );
        }}
      >
        <SphereScene key={sceneKey} photos={photos} repeatMultiplier={repeatMultiplier} onOpenIndex={onOpenIndex} />
      </Canvas>

      {/* Quiet, non-alarming — this recovers on its own within a moment in
          practice; no retry button needed for what's a brief, automatic
          reconnect, not a dead end. */}
      <AnimatePresence>
        {contextLost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#eaf6f6]/50">Reconnecting…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Root component ----
export default function PhotoSphereGallery({ photos, repeatMultiplier, onClose }: PhotoSphereGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isMounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openIndex === null) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, onClose]);

  if (!isMounted || photos.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #0f2b30 0%, #050b0f 75%)" }}
    >
      <AnimatePresence>
        {openIndex === null && (
          <motion.div
            key="sphere-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close gallery"
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0a1518] text-[#4fbdc2] shadow-lg shadow-black/50 ring-1 ring-[#4fbdc2]/30 transition-all duration-200 hover:scale-110 hover:shadow-[0_0_18px_rgba(79,189,194,0.45)]"
            >
              <CloseIcon />
            </button>
            <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-center text-xs uppercase tracking-[0.35em] text-[#eaf6f6]/50">
              Drag to look around
            </p>
            <SphereCanvas photos={photos} repeatMultiplier={repeatMultiplier} onOpenIndex={setOpenIndex} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openIndex !== null && (
          <PhotoLightbox
            photos={photos}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
