# Component Registry

Every component in `components/shared/`, organized by its category subfolder, plus
both templates in `components/templates/`. Update this file whenever a shared
component is added, removed, moved, or repurposed — see `PROJECT_CONTEXT.md`
section 4.

`SitePhoto` (`{ src: string; caption?: string }`, defined in `types/site.ts`) is the
shape of every entry in `SiteData.photos` — both gallery photo components take
`SitePhoto[]`, though only `gallery/Magazine.tsx` displays the caption.

`SitePerson` (`{ name: string }`, defined in `types/site.ts`) is the shape of every
entry in `SiteData.people` (minimum 1 entry). Any component that displays the
couple/group's name(s) — `hero/StaticFade`, `hero/CinematicVideo`,
`closing/Signature` — takes `people: SitePerson[]` plus an optional `groupTitle:
string`, and derives its display string via `formatPeopleHeading()` in
`lib/people.ts`: `groupTitle` if set, `"For {name}"` for exactly 1 person, `"{a} &
{b}"` for exactly 2, comma-joined with a final `&` for 3+. `SiteData.videos` (`{
src: string; caption?: string; role?: string }[]`) and `SiteData.songs` (`{ url:
string; title: string }[]`) are similarly flexible arrays — templates pick which
entries to use (by `role` for videos, `[0]` for songs) and pass plain `src`/
`caption`/`songTitle`/`songUrl`-style props down, so individual components stay
unaware of the array shape.

## Templates

- `templates/AnniversaryV1.tsx` — composes `hero/StaticFade`, `countdown/Simple`,
  `gallery/UniformGrid`, `message/SimpleCentered`, `ambient/FloatingHearts`. Warm
  rose/burgundy palette, Georgia-based `font-serif`, plain flat sections, page-wide
  ambient hearts.
- `templates/AnniversaryV2.tsx` — composes `interactive/UnlockGate` (wraps
  everything), `interactive/ScrollProgressIndicator`,
  `interactive/SongPlayer`, `interactive/LoveNote`, `hero/CinematicVideo`,
  `countdown/GlassCards`, `message/TypedPhrases`, `message/LetterCard`,
  `ambient/NightSky`, `gallery/Magazine`, `gallery/Video`,
  `timeline/VerticalLine`, `places/PlacesWeveBeen`, `closing/Signature`. Deep
  burgundy/champagne-gold palette, self-hosted Playfair Display
  (`font-display`), video hero + moment video, scroll-driven background
  gradient, click-to-enter unlock gate.

## hero/

- `StaticFade.tsx` — simple centered hero, staggered fade-up text, no background
  media, rose/burgundy V1 palette, ampersands in the formatted heading are wrapped
  in an accent-colored span — used in: V1 (old rose/burgundy template,
  pre-"Golden Hour" redesign) — props: `people: SitePerson[]`,
  `groupTitle?: string`, `title: string`
- `CinematicVideo.tsx` — full-viewport background video with dark overlay,
  letter-by-letter staggered reveal of the formatted heading, self-drawing gold
  divider line (SVG `pathLength`), pulsing scroll indicator, poster fallback,
  hearts scoped to this section only (imports `ambient/FloatingHearts` directly)
  — used in: V2 — props: `videoSrc: string`, `poster?: string`, `people:
  SitePerson[]`, `groupTitle?: string`, `title: string`
- `GiftBoxUnlock.tsx` — V1 "Golden Hour" redesign's opening gate (renders
  first, before `ambient/GoldenSkySection.tsx`), V1's counterpart to
  `interactive/UnlockGate.tsx`: same "wrap children, gate them behind an
  `opened` flag, lock body scroll until then" mechanism, reimplemented
  locally rather than shared, styled as a wrapped gift box instead of a
  pulsing heart. Idle-bounce cream/rose-gold box (own local bezier ribbon +
  bow, a small sunflower-petal sticker reusing `lib/v1SunflowerColors.ts`,
  and a resting `butterfly.json` Lottie tuned via `lib/v1ButterflyFilters.ts`)
  with a "Tap to unwrap" caption; tapping plays a lid-lift + ribbon-fade, a
  one-shot radial light burst, a randomized falling-petal burst
  (hydration-safe `useSyncExternalStore` pattern, same as
  `ambient/FloatingHearts.tsx`), and the butterfly launching off along an
  arced flight path, before the couple's names fade/scale in (same heading
  data via `lib/people.ts` and typography as `hero/SunsetHero.tsx`). Once
  opened, the gate unmounts for the rest of the session and the wrapped
  sections become scrollable — used in: V1 (wraps `ambient/GoldenSkySection.tsx`
  and every section after it in `AnniversaryV1.tsx`) — props: `people:
  SitePerson[]`, `groupTitle?: string`, `children: React.ReactNode`
- `SunsetHero.tsx` — V1 "Golden Hour" redesign's hero (Section 1 of the new
  palette/motif system, see `PROJECT_CONTEXT.md` section 5): muted peach-to-cream
  gradient sky, corner sun glow, drifting warm light motes, a bottom sunflower
  silhouette field (16 fixed `SunflowerSvg` flowers, foreground/mid/background
  depth tiers by size+color, some swaying), and 7 free-flying butterflies
  rendered via the real `public/animations/butterfly.json` Lottie (hand-drawn
  waypoint flight paths per instance, muted to warm coral/dusty-rose/terracotta/
  gold via per-instance CSS `filter`, sped-up wing flap via `lottieRef.setSpeed`)
  — used in: V1 (new "Golden Hour" redesign, not yet wired into
  `AnniversaryV1.tsx`) — props: `people: SitePerson[]`, `groupTitle?: string`,
  `title: string`

## gallery/

- `UniformGrid.tsx` — uniform grid, no border, equal-size cells (2/4 cols), simple
  hover zoom, `rounded-lg` — used in: V1 (old rose/burgundy template,
  pre-"Golden Hour" redesign) — props: `photos: SitePhoto[]`
- `Magazine.tsx` — "Museum Wall" single-column exhibition layout (`max-w-2xl`,
  one photo per row, generous vertical spacing), each photo in a thin gold-border
  frame with a cream mat and wall-lit shadow, sized via a large/small
  feature-vs-companion rhythm (every third photo is a larger "feature" piece) at
  its true aspect ratio (`PHOTO_DIMENSIONS`, no crop/distortion), permanent
  small-caps gold "wall label" caption below each frame (no hover-to-reveal),
  hover brightens the frame border + slight image scale, each piece fades/slides
  up independently on scroll into view — used in: V2 — props: `photos:
  SitePhoto[]`
- `Video.tsx` — standalone cinematic video block (separate from the hero video),
  vignette overlay, minimal gold play/pause toggle, italic serif caption below,
  renders `null` if no video source — used in: V2 — props: `videoSrc?: string`,
  `caption?: string`
- `SunlitPolaroids.tsx` — V1 "Golden Hour" counterpart to `Magazine.tsx`: a
  scrapbook/polaroid metaphor instead of a formal gallery wall — cream-bordered
  polaroid cards in a responsive grid, fixed (not random) alternating tilt per
  index, a small rotated "washi tape" corner strip per photo, italic caption in
  the polaroid's bottom strip, independent staggered fade/rotate-settle on
  scroll into view, hover straightens + scales the card slightly. Own local
  copy of `Magazine.tsx`'s photo-dimensions lookup (same demo asset files,
  no shared code) — used in: V1 (new "Golden Hour" redesign) — props:
  `photos: SitePhoto[]`

## message/

- `SimpleCentered.tsx` — plain centered italic quote, no card or frame — used in:
  V1 (old rose/burgundy template, pre-"Golden Hour" redesign) — props: `message: string`
- `LetterCard.tsx` — letter-styled glass card (warm paper tint, backdrop-blur),
  large gold drop cap on first letter, oversized serif quotation marks — used in:
  V2 — props: `message: string`
- `SealedLetter.tsx` — V1 "Golden Hour" counterpart to `LetterCard.tsx`: warm
  cream paper card (rose-gold border, terracotta drop cap, same oversized quote
  marks) topped with a small decorative sunflower-bloom "wax seal" medallion
  (own local bezier-petal construction, same technique as
  `countdown/SunflowerCountdown.tsx`'s digit blooms but not shared code) —
  used in: V1 (new "Golden Hour" redesign) — props: `message: string`
- `TypedPhrases.tsx` — glass-morphism card (own section, sits right after the
  countdown) with a pulsing gold heart above a large italic serif line that
  types itself out character-by-character, pauses, deletes, and loops to the
  next phrase, with a hard-blinking cursor (CSS `cursor-blink` keyframe) and a
  thin gold divider below. Hydration-safe: text starts as `""` on both
  server/first paint, the typing loop only starts inside a `useEffect`.
  Renders `null` if no phrases — used in: V2 — props:
  `phrases?: string[]`

## countdown/

- `Simple.tsx` — flat row of digits, no card/border, rose color scheme,
  hydration-safe (`useSyncExternalStore`, static zero snapshot on server/first
  paint) — used in: V1 (old rose/burgundy template, pre-"Golden Hour"
  redesign) — props: `specialDate: string`, `label?: string`
- `GlassCards.tsx` — glass-morphism bordered tiles overlapping into the hero
  (negative margin), gold border, serif numerals, scale-pulse on each tick,
  hydration-safe (same pattern as `countdown/Simple`) — used in: V2 — props:
  `specialDate: string`, `label?: string`
- `SunflowerCountdown.tsx` — V1 "Golden Hour" counterpart to `GlassCards.tsx`:
  same elapsed-time math and per-tick digit scale-pop, but warm cream cards
  with a rose-gold border and a small pulsing sunflower-bloom marker (own
  local bezier-petal construction) above each digit instead of a plain top
  edge, hydration-safe (same `useSyncExternalStore` pattern as `GlassCards`)
  — used in: V1 (new "Golden Hour" redesign) — props: `specialDate: string`,
  `label?: string` (default `"Blooming since"`)

## timeline/

- `VerticalLine.tsx` — vertical relationship timeline, center gold line draws in
  via scroll progress, pulsing dots, cards alternate left/right on desktop and
  stack on mobile. With no milestones, collapses to a zero-footprint empty
  container rather than returning `null` outright — its `useScroll(target)` ref
  must stay attached to a real DOM node on every render, or Framer Motion throws
  ("Target ref is defined but not hydrated") — used in: V2 — props:
  `milestones?: { date: string; title: string; description?: string }[]`
- `SunsetTimeline.tsx` — V1 "Golden Hour" redesign's Section 4.5 (sits between
  `gallery/SunlitPolaroids.tsx` and `countdown/SunflowerCountdown.tsx`), ported
  from Aceternity's Timeline component rather than built from scratch like
  `VerticalLine.tsx` — deliberately not sharing any code with that file despite
  both being scroll-animated milestone timelines, per the V1/V2 file-separation
  rule. Sticky date label alongside a small sunflower petal-path marker
  (own local bezier-petal construction, cream circular backing plate) at each
  milestone, entry content in a warm cream card (rose-gold border, soft
  warm-toned shadow — same paper/card language as `message/SealedLetter.tsx`),
  a terracotta-to-rose-gold vertical progress line over a soft dusty-rose
  static track that draws in via `useScroll`/`useTransform` height + opacity
  as the section scrolls into view. No background of its own (transparent, like
  every other V1 section post-page-level-gradient). Same "stay attached to a
  real DOM node" empty-state pattern as `VerticalLine.tsx` when there are no
  milestones — used in: V1 (new "Golden Hour" redesign) — props:
  `milestones?: { date: string; title: string; description?: string }[]`

## places/

Not one of the original eight categories — added because none of them fit a
spatial "map of memories" section (closest candidates, `gallery/` and
`timeline/`, are about media and chronology respectively, not location).

- `PlacesWeveBeen.tsx` — stylized abstract map (gold-on-burgundy gradient, faint
  dashed "road" lines and a corner compass rose, both simple SVG decoration, not a
  real map embed). Gold teardrop pins positioned by `x`/`y` percentages, each with
  a calm pulsing glow (same style family as `timeline/VerticalLine`'s dots);
  hovering a pin fades+scales in a caption card with the place name and caption.
  On mobile the pin/hover metaphor is replaced entirely with a stacked list (pin
  icon + name + caption, always visible) since hover-revealed captions on a small
  map don't translate to touch. Renders `null` if no places — used in: V2 —
  props: `places?: { name: string; caption: string; x: number; y: number }[]`

## ambient/

Mood/atmosphere layers — decorative, not functional UI or narrative content.

- `FloatingHearts.tsx` — drifting heart particles, configurable count/color,
  hydration-safe (`useSyncExternalStore`, empty list on server/first paint,
  randomized client-only layout after); containment (page-wide vs. hero-only) is
  controlled by whichever component mounts it, not by the component itself — used
  in: V1 (old rose/burgundy template, page-wide), V2 (hero-scoped, via
  `hero/CinematicVideo`) — props: `count?: number` (default 18), `color?:
  string` (default `"pink"`)
- `FloatingHeartsV1.tsx` — V1-exclusive fork of `FloatingHearts.tsx`, created to
  fix an earlier file-sharing violation (`FloatingHearts.tsx` was being imported
  by both templates). Same drifting-heart mechanics and hydration-safe pattern;
  kept free to diverge from the original — used in: V1 (new "Golden Hour"
  redesign, not yet wired in) — props: same as `FloatingHearts.tsx`
- `GoldenSkySection.tsx` — V1 "Golden Hour" redesign's Section 2 (the "wow"
  moment, V1's counterpart to `NightSky.tsx`): deep peach-to-terracotta gradient
  sky, a pulsing centered sun glow, 3 drifting cloud shapes (seeded-PRNG
  positions, same technique as `NightSky.tsx`'s clouds but a local
  reimplementation), drifting/falling sunflower petals (own local bezier-petal
  construction, colored to match the Lottie below), and the real
  `public/animations/sunflower.json` Lottie — unfiltered, full native color —
  as the section's large centerpiece, confirmed via direct JSON inspection to
  be a genuinely seamless loop. Centered caption + the couple's special date in
  large serif terracotta (UTC-based formatting, same reasoning as
  `NightSky.tsx`) — used in: V1 (new "Golden Hour" redesign, not yet wired into
  `AnniversaryV1.tsx`) — props: `specialDate: string`
- `NightSky.tsx` — full-width navy-to-purple gradient section (`#0d0a1a` →
  `#1e1240`, distinct from the burgundy elsewhere), ~100 fixed twinkling stars
  (seeded PRNG, not `Math.random()`, for hydration-safe stable positions) across 3
  depth layers with independent scroll-parallax rates. Also: a crescent moon
  (SVG mask "two overlapping circles" technique, craters, pulsing glow, top-right
  corner), 4 slow-drifting translucent clouds (same seeded-PRNG technique as the
  stars, so no client-only gating needed), and occasional shooting stars (a
  gradient-trail SVG streak on a steep diagonal, true runtime-random timing
  re-rolled every ~2.5–4.5s — the one genuinely client-only-randomized piece in
  this file, gated behind a `useEffect`). A smooth bezier-curve heart (not a
  dot/polygon constellation) draws itself in (`pathLength`) on scroll into view,
  with 3 pulsing "glint" accents along the path; centered caption + the couple's
  special date in large serif gold (UTC-based formatting so it can't shift a day
  between server/client timezones), star count reduced ~⅔ on mobile — used in:
  V2 — props: `specialDate: string`

## interactive/

Site-wide fixed UI utilities the visitor acts on — distinct from `ambient/`
(passive mood decoration) and from narrative sections.

- `UnlockGate.tsx` — full-screen "unlock" overlay on first load: pulsing gold heart
  icon, "A gift is waiting for you" / "Tap to open". Click plays a scale/rotate/fade
  burst, then the overlay cross-fades out; wrapped children only mount once opened,
  so every section's entrance animation starts fresh at reveal, not before. Locks
  `document.body` scroll while showing. Hydration-safe by construction (`opened`
  starts at a static `false`) — used in: V2 (wraps the entire template) — props:
  `children: React.ReactNode`, `onOpen?: () => void` (fired synchronously inside
  the click handler, before the opening-animation delay — `AnniversaryV2` uses
  this to start `SongPlayer` playback within the same user gesture, satisfying
  browser autoplay policies)
- `SongPlayer.tsx` — small fixed bottom-right pill, glass-morphism background, gold
  border, play/pause toggle over a plain `<audio>` element, music-note icon,
  italic serif song title. Autoplays once, the moment `UnlockGate` is clicked
  (via an imperative `play()` handle exposed through `ref`/`useImperativeHandle`
  — `AnniversaryV2` mounts `SongPlayer` *outside* `UnlockGate`'s gated children so
  the `<audio>` element already exists at click-time), after which the
  play/pause toggle controls it normally. If `songUrl` is missing, still renders
  (title + icon) but the button is disabled, no `<audio>` element mounts, and
  the autoplay call is a no-op — used in: V2 — props: `songTitle?: string`,
  `songUrl?: string`, `ref?: React.Ref<SongPlayerHandle>`
- `LoveNote.tsx` — small fixed bottom-left tab (pulsing gold heart) mirroring
  `SongPlayer`'s position, click opens a small popover card with a short personal
  note, dismissible via × or backdrop click, renders `null` if no note is provided
  — used in: V2 — props: `note?: string`
- `ScrollProgressIndicator.tsx` — thin (3px) gold bar fixed to the right viewport
  edge, `scaleY` tied to page `scrollYProgress`, high `z-40` so it stays above all
  content — used in: V2 — props: *(none)*

## closing/

- `Signature.tsx` — closing line, formatted heading styled as a rotated handwritten
  signature (ampersands accent-colored, same pattern as `hero/StaticFade`), gold
  SVG heart that draws then fills on scroll into view, fades to a darker gradient
  at the page's bottom edge — used in: V2 — props: `people: SitePerson[]`,
  `groupTitle?: string`, `closingLine?: string`
- `SunsetSignature.tsx` — V1 "Golden Hour" counterpart to `Signature.tsx`: same
  closing-line + handwritten-signature-heading structure (ampersands accented in
  terracotta), but in place of the drawn-heart SVG, the closing visual beat is
  the real `sunflower.json` Lottie at a smaller scale, unfiltered/full native
  color — deliberately the same treatment as `ambient/GoldenSkySection.tsx`'s
  centerpiece, so the template's opening "wow" and closing beat visually rhyme.
  Fades to a deep dusk terracotta (`#6b4332`) at the page's bottom edge rather
  than `Signature.tsx`'s near-black, staying in the warm family to the last
  pixel — used in: V1 (new "Golden Hour" redesign, not yet wired into
  `AnniversaryV1.tsx`) — props: `people: SitePerson[]`, `groupTitle?: string`,
  `closingLine?: string`
