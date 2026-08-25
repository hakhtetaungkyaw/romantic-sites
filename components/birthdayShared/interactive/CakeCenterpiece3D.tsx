"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

// Birthday V2 Phase 3 — the real 3D cake, replacing interactive/ArcadeHub.tsx's
// Phase 2 static line-art CakeSilhouette placeholder. Procedural primitives
// only (cylinders/torus/cones/spheres), not a sourced model — see the
// Phase 3 investigation report for the full reasoning (zero licensing risk
// for a commercial product, no 3D-artist bottleneck, decoration-state
// flexibility for Phase 4, and a better style match for this template's
// established flat/geometric teal identity than a realistic sourced model
// would be).
//
// LIGHTING/READABILITY FIX (real-device spot-check found this, not caught
// in the earlier headless/software-rendered testing): the first pass used
// one ambient light (0.55) + one directional key light + one small accent
// point light, and a dark frosting base color (#1d3d40) with no
// self-illumination. On a real device, rotating away from the key light's
// side made the whole cake read as nearly black — a single-key-light setup
// with a dark, non-emissive PBR material has no floor: whichever face
// isn't catching the directional light has almost nothing lighting it.
// Also found independently while investigating: the candles/toppings were
// never actually nested inside CakeTiers' own `[0, -0.5, 0]` offset group —
// they rendered as CakeScene siblings at unrelated Y coordinates, so they
// floated about half a unit above the actual frosting surface, disconnected
// from the tiers. That geometry bug (not just lighting) is a big part of
// why the default angle read as "a ring and 3 dots," not a cake.
//
// Fixed on both fronts:
//   - One shared assembly group (CAKE_GROUP_OFFSET below) now holds tiers,
//     candles, AND toppings in the same local coordinate space, positioned
//     relative to the tiers' own top surface — candles/toppings can no
//     longer drift out of sync with the tiers again.
//   - Ambient light raised substantially (0.55 -> 0.95) so every surface
//     has a real lit floor regardless of camera angle, PLUS a second
//     directional fill light from roughly the opposite azimuth of the key
//     light, so there's no single "dark side."
//   - Tier materials now carry their own `emissive={frostingColor}` at a
//     real intensity — self-illuminated in their own current color, not
//     dependent on external light hitting them at all. This is the
//     intentional direction, not a fallback: this template's whole visual
//     language (flat SVG icons, glowing aurora backgrounds, spotlight
//     glows) is already stylized/self-lit rather than photoreal, so a
//     self-glowing cake is a better fit than one that needs perfect studio
//     lighting to read, and it's what actually solves "must look like a
//     cake from every angle, not just one."
//   - Frosting base color lightened (#1d3d40 -> #2f6167) so it has real
//     inherent luminance on top of the emissive term, rather than starting
//     from a tone barely distinguishable from the near-black background.
//   - Tier heights increased slightly (more visible cylinder wall area per
//     tier) and the default camera pulled back/re-angled — more surface
//     for the shape's own silhouette and lighting to register on, so it
//     reads as tiered/cylindrical rather than a flat disc even before
//     rotating.
//
// TOP-DOWN VIEW FIX (a follow-up revision): the lighting/geometry fix above
// solved "goes dark/disconnected from most angles," but the vertical range
// was then CLAMPED (~50-85deg from vertical) specifically to hide a
// separate problem — directly overhead, a plain 2-tier cylinder cake reads
// as flat concentric rings, not a cake ("the ring and 3 dots complaint").
// Revisited per the person's own instruction: fix the actual top visual
// instead of hiding it behind a restricted camera range. Added a real
// top-down decoration (CakeTiers' own center accent ring + two piped
// DotRing borders — one on the top tier's rim, one on the exposed
// bottom-tier shelf) and rearranged Candles into a rotationally-even
// cluster (previously an arc compressed toward the camera, which looked
// lopsided from near-overhead). With real content up there, minPolarAngle
// opened from ~50deg to ~7deg — see the OrbitControls prop below for the
// full reasoning on exactly how far, and why maxPolarAngle (the underside)
// stayed clamped.
//
// Validated via a throwaway Step A prototype (deleted once its findings
// were reported): real production bundle impact for three +
// @react-three/fiber + @react-three/drei (OrbitControls only) is ~232KB
// gzip, isolated to this one route (confirmed empirically — zero
// three-related chunks load on any other route), zero render errors on a
// scene this simple. Init time under throttled CPU could NOT be
// independently verified against a real device or a working production
// build in that environment (this repo's own `next build` fails during
// static prerendering on an unrelated, pre-existing
// .env.production/DATABASE_URL issue, flagged separately, not fixed here).
//
// frameloop="demand" + no shadows — same performance posture actually
// tested in Step A. Specifically NOT added: an idle candle-flicker
// animation loop or OrbitControls' own `autoRotate` — both would require
// continuous per-frame rendering, which contradicts "demand" mode; the
// original Phase 3 scope also only ever asked for "static display with
// orbit/rotate camera controls," not an auto-rotating one. The flame still
// reads as lit via a static bright emissive material + a soft translucent
// glow sphere, not motion.
//
// Decoration state (Phase 4 wires the actual mini-game -> unlock logic;
// this phase only builds the rendering mechanism, not the wiring):
//   - frostingColor: fed into the tier materials' own color AND emissive
//     props — a plain color swap, no texture authoring needed, and a
//     swapped color keeps self-illuminating in its own new tone.
//   - toppingsUnlocked: an array of TOPPING_CATALOG ids below; any id
//     present conditionally mounts its own small primitive mesh(es),
//     correctly nested in the cake's own coordinate space now. Empty by
//     default this phase (no mini-game has been completed yet) —
//     deliberately not "Coming Soon" fakery the way ArcadeHub.tsx's own
//     cabinet tiles are, since the mechanism itself is real, there's just
//     nothing unlocked yet.
//   - candleCount: each candle is its own independent primitive group
//     (body + flame), so Phase 4's per-candle lit/unlit + blow interaction
//     has real individual objects to target. Defaults to 3, all lit, sitting
//     directly on the top tier's own surface (see the geometry fix above).

export type CakeToppingId = "sparkle-topper" | "orbit-rings" | "dot-scatter";

export interface CakeCenterpiece3DProps {
  frostingColor?: string;
  toppingsUnlocked?: CakeToppingId[];
  candleCount?: number;
}

const DEFAULT_FROSTING_COLOR = "#2f6167";
const ACCENT = "#4fbdc2";
const CANDLE_BODY_COLOR = "#eaf6f6";

// ---- Shared local coordinate space for the whole assembly (tiers, ring
// trims, candles, toppings) — every Y value below is relative to the
// BOTTOM tier's own bottom surface sitting at local Y=0, so nothing can
// silently drift out of sync with the tiers again the way the candles did
// in the first pass. CAKE_GROUP_OFFSET shifts the whole finished assembly
// so its visual center sits near world Y=0, a reasonable default for
// OrbitControls' own target. ----
const BOTTOM_TIER_HEIGHT = 0.85;
const TOP_TIER_HEIGHT = 0.68;
const SEAM_Y = BOTTOM_TIER_HEIGHT; // top surface of the bottom tier
const TOP_SURFACE_Y = SEAM_Y + TOP_TIER_HEIGHT; // top surface of the top tier
const CAKE_GROUP_OFFSET: [number, number, number] = [0, -0.65, 0];

// Evenly-spaced ring of small piped "frosting dot" bumps — the actual fix
// for the top-down view, not the vertical-angle clamp that used to hide it.
// Used twice in CakeTiers below: once on the top tier's own rim, once on
// the exposed shelf where the wider bottom tier peeks out past the
// narrower top tier — from directly overhead that shelf used to read as a
// bare, undecorated ring; now both tiers carry a piped border, so the
// top-down view reads as "a decorated 2-tier cake," not a plain disc.
function DotRing({ radius, count, y, size }: { radius: number; count: number; y: number; size: number }) {
  const dots: [number, number, number][] = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  });
  return (
    <>
      {dots.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[size, 10, 10]} />
          <meshStandardMaterial
            color={CANDLE_BODY_COLOR}
            emissive={CANDLE_BODY_COLOR}
            emissiveIntensity={0.25}
            roughness={0.4}
          />
        </mesh>
      ))}
    </>
  );
}

function CakeTiers({ frostingColor }: { frostingColor: string }) {
  return (
    <>
      <mesh position={[0, BOTTOM_TIER_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[1.4, 1.5, BOTTOM_TIER_HEIGHT, 40]} />
        <meshStandardMaterial
          color={frostingColor}
          roughness={0.6}
          metalness={0.05}
          emissive={frostingColor}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, SEAM_Y + TOP_TIER_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.92, 1, TOP_TIER_HEIGHT, 40]} />
        <meshStandardMaterial
          color={frostingColor}
          roughness={0.6}
          metalness={0.05}
          emissive={frostingColor}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Two frosting rings — same signature-accent teal as the rest of the
          template, giving the cake a "trimmed with glowing piping" read
          rather than a plain solid mass. Sit exactly at the tier seam and
          the top tier's own top surface, not at arbitrary floating Ys. */}
      <mesh position={[0, TOP_SURFACE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.08, 16, 56]} />
        <meshStandardMaterial color={ACCENT} roughness={0.3} metalness={0.15} emissive={ACCENT} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, SEAM_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.05, 16, 56]} />
        <meshStandardMaterial color={ACCENT} roughness={0.3} metalness={0.15} emissive={ACCENT} emissiveIntensity={0.45} />
      </mesh>
      {/* Top-down decoration — a small center accent ring, then two piped
          dot borders: one just inside the top tier's own rim, one further
          out on the exposed bottom-tier shelf. Nothing here depends on
          camera angle; it reads as normal cake trim from the side too, it's
          just what actually makes the view straight down look intentional. */}
      <mesh position={[0, TOP_SURFACE_Y + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.02, 12, 48]} />
        <meshStandardMaterial color={ACCENT} roughness={0.3} metalness={0.15} emissive={ACCENT} emissiveIntensity={0.4} />
      </mesh>
      <DotRing radius={0.78} count={14} y={TOP_SURFACE_Y + 0.02} size={0.055} />
      <DotRing radius={1.2} count={20} y={SEAM_Y + 0.02} size={0.05} />
    </>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, 0.32, 12]} />
        <meshStandardMaterial color={CANDLE_BODY_COLOR} emissive={CANDLE_BODY_COLOR} emissiveIntensity={0.15} />
      </mesh>
      {/* Flame — a bright emissive cone core plus a larger, translucent
          glow sphere behind it standing in for bloom (no post-processing
          pass this phase, keeping the render pipeline as simple as what
          Step A actually validated). Static, not flickering — see this
          file's own top doc comment for why. */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.045, 0.11, 12]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

// A tight, evenly-spaced circular cluster standing directly on the top
// tier's own top surface (TOP_SURFACE_Y) — replaces an earlier arc that was
// compressed toward the camera (Z scaled by 0.4): that read fine from the
// original side-ish default angle, but from close to directly overhead a
// squashed arc doesn't have the rotational symmetry to read as
// intentional — it looks off-center/lopsided instead. A real (not
// Z-flattened) evenly-spaced ring, small enough to sit inside the new
// center accent ring (radius 0.45, see CakeTiers), looks like a deliberate
// clustered arrangement from every angle, top-down included, matching how
// birthday cakes are commonly presented (candles grouped near center)
// rather than spread wide toward the rim.
function Candles({ count }: { count: number }) {
  if (count <= 0) return null;
  const clusterRadius = 0.28;
  const baseY = TOP_SURFACE_Y + 0.16; // candle cylinder's own half-height, so its bottom rests exactly on the tier surface
  const positions: [number, number, number][] =
    count === 1
      ? [[0, baseY, 0]]
      : Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2;
          return [Math.cos(angle) * clusterRadius, baseY, Math.sin(angle) * clusterRadius];
        });
  return (
    <>
      {positions.map((pos, i) => (
        <Candle key={i} position={pos} />
      ))}
    </>
  );
}

// ---- Topping catalog — each entry a small primitive decoration, correctly
// positioned relative to the tiers' own surfaces (TOP_SURFACE_Y / SEAM_Y),
// not the arbitrary unlinked Ys the first pass used. Conditionally rendered
// when its id is present in toppingsUnlocked. Phase 4 decides what actually
// unlocks each one and what it represents narratively; this phase only
// builds the rendering mechanism + a placeholder catalog, so that mechanism
// is real and provable rather than just a documented intention. ----
function SparkleTopper() {
  // +0.55, not the original +0.35 — with the new center candle cluster
  // (see Candles above) reaching up to roughly +0.42 at the flame tips,
  // +0.35 would have sat just below/inside them if both were ever unlocked
  // together. Kept comfortably clear.
  return (
    <mesh position={[0, TOP_SURFACE_Y + 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
      <octahedronGeometry args={[0.14, 0]} />
      <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.6} roughness={0.2} metalness={0.3} />
    </mesh>
  );
}

function OrbitRings() {
  return (
    <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[1.9, 0.02, 8, 64]} />
      <meshStandardMaterial color={ACCENT} transparent opacity={0.5} emissive={ACCENT} emissiveIntensity={0.4} />
    </mesh>
  );
}

function DotScatter() {
  // radius 0.55, not the original 0.75 — CakeTiers' own new permanent
  // DotRing (see above) now sits at radius 0.78, right where this used to
  // be; moved inward so an unlocked "dot-scatter" topping reads as its own
  // additional layer instead of nearly overlapping the base cake's piping.
  const dots: [number, number, number][] = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    return [Math.cos(angle) * 0.55, TOP_SURFACE_Y, Math.sin(angle) * 0.55];
  });
  return (
    <>
      {dots.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={CANDLE_BODY_COLOR} emissive={CANDLE_BODY_COLOR} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </>
  );
}

const TOPPING_COMPONENTS: Record<CakeToppingId, () => React.JSX.Element> = {
  "sparkle-topper": SparkleTopper,
  "orbit-rings": OrbitRings,
  "dot-scatter": DotScatter,
};

function CakeScene({
  frostingColor,
  toppingsUnlocked,
  candleCount,
}: Required<CakeCenterpiece3DProps>) {
  return (
    <>
      {/* Uniform floor light — with self-illuminated (emissive) materials
          this alone already guarantees every surface has real baseline
          visibility, but it's raised well past the first pass's 0.55 so
          the object never approaches black from any angle even before
          emissive/directional contributions are added. */}
      <ambientLight intensity={0.95} />
      {/* Key light. */}
      <directionalLight position={[3, 4.5, 2.5]} intensity={1} color={CANDLE_BODY_COLOR} />
      {/* Fill light from roughly the opposite azimuth/elevation of the key
          light — this is the actual fix for "goes fully dark from certain
          angles": a single directional light has no floor on the side
          facing away from it, a second one from the other side does. */}
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.55} color={CANDLE_BODY_COLOR} />
      {/* Accent rim glow — decorative, not load-bearing for readability. */}
      <pointLight position={[-2, 1.5, 2]} intensity={0.35} color={ACCENT} />
      <group position={CAKE_GROUP_OFFSET}>
        <CakeTiers frostingColor={frostingColor} />
        <Candles count={candleCount} />
        {toppingsUnlocked.map((id) => {
          const Topping = TOPPING_COMPONENTS[id];
          return Topping ? <Topping key={id} /> : null;
        })}
      </group>
    </>
  );
}

export default function CakeCenterpiece3D({
  frostingColor = DEFAULT_FROSTING_COLOR,
  toppingsUnlocked = [],
  candleCount = 3,
}: CakeCenterpiece3DProps) {
  return (
    // gl={{ alpha: true }} — the canvas's own WebGL surface needs to be
    // genuinely transparent, not just visually masked by a CSS wrapper:
    // ArcadeHub.tsx used to clip this into a circular "porthole" div (a
    // bordered, rounded-full, dark-background container); that was removed
    // after visual review found it made a real rotatable 3D object feel
    // boxed into a flat icon frame. Without alpha:true, three.js's default
    // opaque clear color would just swap that circular box for a square
    // one — alpha:true is what actually lets ArcadeHub's own aurora
    // background show through wherever this scene doesn't draw anything,
    // so the cake reads as existing in open space with nothing bounding it.
    <Canvas
      frameloop="demand"
      shadows={false}
      dpr={[1, 2]}
      camera={{ position: [2.7, 1.35, 2.9], fov: 42 }}
      gl={{ alpha: true }}
    >
      <CakeScene frostingColor={frostingColor} toppingsUnlocked={toppingsUnlocked} candleCount={candleCount} />
      {/* Vertical range — REVISED from the original ~50-85deg clamp. That
          first pass hid the "reads as flat concentric rings from directly
          overhead" problem by simply not letting the camera get there; this
          pass fixes the actual cause instead (CakeTiers' own new center
          ring + two piped DotRing borders + the Candles cluster rearranged
          to be rotationally even, not squashed toward the camera — see
          those components' own comments), so the top-down view now has
          real content and the clamp can open up toward it.
          minPolarAngle ~7deg — very close to straight down, not exactly 0
          (a literal 0 sits at OrbitControls' own polar singularity, which
          can jitter) — confirmed via a vertical sweep that the new top
          decoration reads clearly the whole way up to this limit, no
          "unfinished" transition. maxPolarAngle is UNCHANGED at ~85deg:
          the underside is just the bottom tier's own flat, undecorated
          base cap — customers have no real reason to look up at the
          bottom of a cake, so that end stays clamped rather than investing
          in geometry nobody will look for. */}
      <OrbitControls
        enablePan={false}
        minDistance={2.3}
        maxDistance={5}
        target={[0, 0.15, 0]}
        minPolarAngle={Math.PI * 0.04} // ~7deg from vertical — very close to top-down
        maxPolarAngle={Math.PI * 0.47} // ~85deg from vertical — closest to underneath allowed, unchanged
      />
    </Canvas>
  );
}
