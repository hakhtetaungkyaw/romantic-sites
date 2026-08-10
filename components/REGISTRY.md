# Component Registry

Every component in `components/shared/`, organized by its category subfolder, plus
both templates in `components/templates/`. Update this file whenever a shared
component is added, removed, moved, or repurposed — see `PROJECT_CONTEXT.md`
section 4.

`SitePhoto` (`{ src: string; caption?: string }`, defined in `types/site.ts`) is the
shape of every entry in `SiteData.photos` — both gallery photo components take
`SitePhoto[]`, though only `gallery/Magazine.tsx` displays the caption.

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
  media, rose/burgundy V1 palette — used in: V1 — props: `partnerA: string`,
  `partnerB: string`, `title: string`
- `CinematicVideo.tsx` — full-viewport background video with dark overlay,
  letter-by-letter staggered name reveal, self-drawing gold divider line (SVG
  `pathLength`), pulsing scroll indicator, poster fallback, hearts scoped to this
  section only (imports `ambient/FloatingHearts` directly) — used in: V2 — props:
  `videoSrc: string`, `poster?: string`, `partnerA: string`, `partnerB: string`,
  `title: string`

## gallery/

- `UniformGrid.tsx` — uniform grid, no border, equal-size cells (2/4 cols), simple
  hover zoom, `rounded-lg` — used in: V1 — props: `photos: SitePhoto[]`
- `Magazine.tsx` — asymmetric masonry columns (CSS `columns-1/2/3`,
  `break-inside-avoid`, so any photo count packs with no empty gaps), each cell
  sized by the photo's real aspect ratio, thin gold mat-frame border, hover
  brightens border + gold glow + slight scale + reveals the photo's caption over a
  dark scrim, staggered scroll reveal — used in: V2 — props: `photos: SitePhoto[]`
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
  stack on mobile, renders `null` if no milestones — used in: V2 — props:
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
  depth layers with independent scroll-parallax rates, a hand-placed 10-point heart
  constellation draws itself in (`pathLength`) on scroll into view, centered
  caption + the couple's special date in large serif gold (UTC-based formatting so
  it can't shift a day between server/client timezones), star count reduced ~⅔ on
  mobile — used in: V2 — props: `specialDate: string`

## interactive/

Site-wide fixed UI utilities the visitor acts on — distinct from `ambient/`
(passive mood decoration) and from narrative sections.

- `UnlockGate.tsx` — full-screen "unlock" overlay on first load: pulsing gold heart
  icon, "A gift is waiting for you" / "Tap to open". Click plays a scale/rotate/fade
  burst, then the overlay cross-fades out; wrapped children only mount once opened,
  so every section's entrance animation starts fresh at reveal, not before. Locks
  `document.body` scroll while showing. Hydration-safe by construction (`opened`
  starts at a static `false`) — used in: V2 (wraps the entire template) — props:
  `children: React.ReactNode`
- `SongPlayer.tsx` — small fixed bottom-right pill, glass-morphism background, gold
  border, play/pause toggle over a plain `<audio>` element, music-note icon, italic
  serif song title, no autoplay. If `songUrl` is missing, still renders (title +
  icon) but the button is disabled and no `<audio>` element is mounted at all — used
  in: V2 — props: `songTitle?: string`, `songUrl?: string`
- `LoveNote.tsx` — small fixed bottom-left tab (pulsing gold heart) mirroring
  `SongPlayer`'s position, click opens a small popover card with a short personal
  note, dismissible via × or backdrop click, renders `null` if no note is provided
  — used in: V2 — props: `note?: string`
- `ScrollProgressIndicator.tsx` — thin (3px) gold bar fixed to the right viewport
  edge, `scaleY` tied to page `scrollYProgress`, high `z-40` so it stays above all
  content — used in: V2 — props: *(none)*

## closing/

- `Signature.tsx` — closing line, couple names styled as a rotated handwritten
  signature, gold SVG heart that draws then fills on scroll into view, fades to a
  darker gradient at the page's bottom edge — used in: V2 — props:
  `partnerA: string`, `partnerB: string`, `closingLine?: string`
