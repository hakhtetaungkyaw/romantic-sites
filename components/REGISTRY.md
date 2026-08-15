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
  everything), `ambient/CursorGlow`, `interactive/ScrollProgressIndicator`,
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
  in an accent-colored span — used in: V1 — props: `people: SitePerson[]`,
  `groupTitle?: string`, `title: string`
- `CinematicVideo.tsx` — full-viewport background video with dark overlay,
  letter-by-letter staggered reveal of the formatted heading, self-drawing gold
  divider line (SVG `pathLength`), pulsing scroll indicator, poster fallback,
  hearts scoped to this section only (imports `ambient/FloatingHearts` directly)
  — used in: V2 — props: `videoSrc: string`, `poster?: string`, `people:
  SitePerson[]`, `groupTitle?: string`, `title: string`

## gallery/

- `UniformGrid.tsx` — uniform grid, no border, equal-size cells (2/4 cols), simple
  hover zoom, `rounded-lg` — used in: V1 — props: `photos: SitePhoto[]`
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

## message/

- `SimpleCentered.tsx` — plain centered italic quote, no card or frame — used in:
  V1 — props: `message: string`
- `LetterCard.tsx` — letter-styled glass card (warm paper tint, backdrop-blur),
  large gold drop cap on first letter, oversized serif quotation marks — used in:
  V2 — props: `message: string`
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
  paint) — used in: V1 — props: `specialDate: string`, `label?: string`
- `GlassCards.tsx` — glass-morphism bordered tiles overlapping into the hero
  (negative margin), gold border, serif numerals, scale-pulse on each tick,
  hydration-safe (same pattern as `countdown/Simple`) — used in: V2 — props:
  `specialDate: string`, `label?: string`

## timeline/

- `VerticalLine.tsx` — vertical relationship timeline, center gold line draws in
  via scroll progress, pulsing dots, cards alternate left/right on desktop and
  stack on mobile. With no milestones, collapses to a zero-footprint empty
  container rather than returning `null` outright — its `useScroll(target)` ref
  must stay attached to a real DOM node on every render, or Framer Motion throws
  ("Target ref is defined but not hydrated") — used in: V2 — props:
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
  in: V1 (page-wide), V2 (hero-scoped, via `hero/CinematicVideo`) — props:
  `count?: number` (default 18), `color?: string` (default `"pink"`)
- `CursorGlow.tsx` — soft 400px radial gold glow (opacity 0.08) that follows the
  cursor with a spring lag, desktop-only (`(pointer: fine)` check via
  `useSyncExternalStore`, renders `null` on touch devices), rendered as a `z-0`
  sibling before the `z-10` content wrapper in `AnniversaryV2` so it stays behind
  readable content without negative z-index — used in: V2 — props: *(none)*
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
