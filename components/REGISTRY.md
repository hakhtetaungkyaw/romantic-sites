# Component Registry

Every component in `components/shared/` (Anniversary) and `components/birthdayShared/`
(Birthday), organized by category subfolder, plus every template in
`components/templates/`. Update this file whenever a shared component is added,
removed, moved, or repurposed — see `PROJECT_CONTEXT.md` section 4.

`components/shared/` and `components/birthdayShared/` are two entirely separate
trees — neither ever imports from the other, the same file-isolation principle
Anniversary V1 and V2 already hold between each other, just drawn one level
higher (by product line, not just by template version within one line).

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
- `templates/BirthdayV1.tsx` — "Celebration Room," the first template in the
  new Birthday product line, restructured from a vertical scroll-stack into
  hub-and-spoke navigation. Composes components from
  `components/birthdayShared/` only (see that section below) — never
  `components/shared/`. `hero/BirthdayGate` wraps everything (the
  candle-blow/wish moment — this is also where the "cake" wish moment
  lives; the decorate-your-own-cake object, `interactive/CakeCustomizer`,
  is a separate, unrelated discoverable object reached from the hub).
  `interactive/BirthdaySongPlayer` mounts as a sibling BEFORE the gate
  (outside its gated children) so its `<audio>` element already exists when
  the gate's own `onOpen` fires the player's exposed `play()` synchronously
  within the candle-blow tap. Inside the gate, one `h-dvh` `main` holds a
  7-way `activeView` state machine
  (`"hub" | "balloons" | "gift" | "photos" | "cake" | "wishes" | "finale"`),
  swapped via a single `AnimatePresence mode="wait"` between full-screen
  (`absolute inset-0`, own `overflow-y-auto` + `hide-scrollbar`) panels:
  `"hub"` shows `interactive/CelebrationHub` (5 tiles) plus
  `interactive/RoomProgress` as a complementary aggregate readout beneath
  it; `"balloons"`/`"gift"`/`"cake"`/`"wishes"` show
  `interactive/BalloonReveal`/`interactive/GiftUnwrap`/
  `interactive/CakeCustomizer`/`interactive/WishLetter` full-screen with
  their own `onBack`-driven Back button returning to the hub; `"photos"`
  shows `interactive/MemoryFrames` with `autoOpen` (skips its idle stack,
  jumps straight into the gallery) whose existing "Close gallery" button is
  repurposed via `onBack` to return to the hub instead of just closing in
  place; `"finale"` shows `closing/GrandFinale` (reached only via the hub's
  own CTA tile once all 5 objects are discovered, never automatically) with
  a template-level `FinaleBackButton` overlay, since `GrandFinale.tsx`
  itself stays unmodified. Most objects' own per-object progress is lifted
  to this template (`poppedBalloons: number[]`, `giftLandedItem: string`,
  `galleryDiscovered: boolean`, `cakeFrosting: FrostingId | null`,
  `cakeToppings: ToppingId[]`, `cakeDiscovered: boolean`,
  `wishesDiscovered: boolean`) so it survives the real unmount/remount a hub
  round-trip causes, seeded back down via each object's own
  `initialPopped`/`initialLandedItem`/`autoOpen`/`initialFrosting`+
  `initialToppings` props and kept in sync via
  `onPoppedChange`/`onWheelSpin`/`onGalleryOpen`/`onSelectionChange` —
  `interactive/WishLetter` is the one exception, with nothing to seed back
  (each wish is written and released, never kept), so only its one-shot
  `onWishSent` discovered signal is lifted. This template still owns no
  per-object interaction logic of its own, it only listens and re-seeds.
  Data plumbing:
  `people[0].name`/`title`/`message`/`photos`/`songs[0]` from `SiteData`
  directly, Birthday-specific extras from `SiteData.customData.birthday`
  (shaped by the `BirthdayCustomData` interface in `types/site.ts`) —
  props: `data: SiteData`

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

## birthdayShared/hero/

Birthday product line's own component tree — a sibling to `components/shared/`
(Anniversary's tree), not a subfolder of it, and never imports from it.

- `BirthdayGate.tsx` — BirthdayV1 "Celebration Room"'s opening gate, the same
  "wrap children, gate them behind an `opened` flag, lock body scroll until
  then" mechanism as `hero/GiftBoxUnlock.tsx` (Anniversary V1) /
  `interactive/UnlockGate.tsx` (Anniversary V2), reimplemented fully
  locally. Supersedes an earlier `interactive/CakeWish.tsx` entirely — that
  file (a tap-to-blow-candles object with its own reveal card) has been
  deleted; the cake concept now lives here instead, as the gate's own
  centerpiece, with no reveal card/message/photo of its own. Sequence: an
  automatic "Happy Birthday[, name]!" greeting, then a two-tier cake (piped
  wavy frosting, confetti sprinkles, a stand, layered-glow candle flames
  scaled to `age`, capped at 12) drops in tier-by-tier then candle-by-candle
  (spring physics), lights up, prompts "Tap to make a wish," and on tap
  extinguishes staggered (smoke puffs, soft vignette dim) before
  cross-fading out. No `fixed`+`createPortal` needed (unlike
  `interactive/RevealCard.tsx`/the deleted `CakeWish.tsx`'s own reveal
  card) — this component IS the outermost wrapper, the same role
  `GiftBoxUnlock.tsx`/`UnlockGate.tsx` already play, so there's no smaller
  ancestor for its own `fixed inset-0` to escape — used in: Birthday V1
  (wraps the entire template in `templates/BirthdayV1.tsx`) — props:
  `children: React.ReactNode`, `onOpen?: () => void`, `age?: number`,
  `personName?: string`

## birthdayShared/interactive/

The Celebration Room's navigation hub, its 5 discoverable objects, and the
progress indicator tracking them. Each object exposes its own "discovered"
completion callback (see each entry below) so `templates/BirthdayV1.tsx`
can drive `CelebrationHub`, `RoomProgress`, and `closing/GrandFinale`
without owning any per-object completion logic itself. Since
`templates/BirthdayV1.tsx`'s hub-and-spoke restructure, each of the 5
objects also genuinely unmounts/remounts on hub navigation (rather than
just hiding/showing in place), so most accept an optional seed prop
(`initialPopped`/`initialLandedItem`/`autoOpen`/`initialFrosting`+`initialToppings`)
to restore progress on remount and an optional change callback to report it
back up (`interactive/WishLetter` is the one exception — it has no progress
to seed, by design), plus every object accepts an optional `onBack` to
leave it and return to the hub — every object's own former "reset
everything on close" behavior has been removed (a hub round-trip must not
wipe progress; only a real page reload resets state now), while each
object's own separate "dismiss a single piece of content" close logic (a
per-balloon message panel, the wheel's landed-item modal) is unaffected.

- `CelebrationHub.tsx` — the room's own directory screen: a primary heading
  ("Happy Birthday, {personName}!," same emotional weight as
  `hero/BirthdayGate.tsx`'s own candle-blow greeting and
  `closing/GrandFinale.tsx`'s own heading) with `title` ("[Name]'s
  Celebration Room") demoted to a small eyebrow label above it, then 5
  tappable tiles (Balloons/Gift/Photos/Cake/Wishes) scattered at asymmetric,
  depth-scaled positions (`TILE_PLACEMENTS`) rather than a uniform grid —
  reads as objects placed around a small room. Each tile is a hand-drawn
  SVG icon (deliberately not emoji, to stay consistent with every other
  Birthday object's premium illustrated style) with its own small looping
  micro-animation (balloons bob/sway independently, the gift box gets an
  occasional shake + twinkling sparkle glints, the photo stack periodically
  fans and settles, the cake's candle flickers, the wishes tile's comet
  trail streaks and rests) + label + a discovered/partial-progress caption
  (e.g. "3 of 7 popped"), with a gold checkmark badge once that object is
  fully discovered. A floating 3-lantern cluster (`HeroCenterpiece`, varied
  size/opacity/speed for depth) plus scattered ambient confetti/sparkle
  glints sit behind everything as this screen's own atmosphere — a
  floating-lantern motif rather than a birthday-cake one, chosen
  specifically because `hero/BirthdayGate.tsx` already spends the cake
  motif on the candle-blow moment just before this screen. A dot-pattern
  background and 2-row bunting garland (both ported from
  `interactive/MemoryFrames.tsx`'s own party-atmosphere recipe,
  reimplemented locally) complete it. Once all 5 objects are discovered, a
  CTA button fades in ("See the Grand Finale") — proceeding is always a
  deliberate tap, never automatic, so the user can freely revisit any
  object first. Renders no modal/portal itself; `templates/BirthdayV1.tsx`
  wraps whichever view is active (this hub included) in one shared
  full-screen panel — used in: Birthday V1 — props: `title: string`,
  `personName?: string`, `balloonsPopped: number`, `balloonsTotal: number`,
  `balloonsDiscovered: boolean`, `giftDiscovered: boolean`,
  `galleryDiscovered: boolean`, `cakeDiscovered: boolean`,
  `wishesDiscovered: boolean`, `onSelectBalloons: () => void`,
  `onSelectGift: () => void`, `onSelectPhotos: () => void`,
  `onSelectCake: () => void`, `onSelectWishes: () => void`,
  `onProceedToFinale: () => void`
- `BalloonReveal.tsx` — a tap-to-pop balloon bouquet (up to 7, one per
  `customData.birthday.balloonMessages` entry), warm-palette gradient
  balloons on hand-placed slots with independent idle float/sway, tap pops
  one (scatter-burst + squash exit) and reveals that balloon's own message
  in a shared, lighter-weight inline panel below the bouquet (not a modal —
  7 stacked full-screen takeovers would be excessive for what's a quick
  read each). Once every balloon is popped, a proper
  `fixed`+`createPortal(document.body)` modal opens (same shape as
  `interactive/PetalOracle.tsx`'s own reveal, since this IS a single
  one-time payoff) showing `balloonCompletionMessage` + `photos[0]`;
  closing it no longer resets anything (popped balloons stay popped) — used
  in: Birthday V1 — props: `messages: string[]`, `completionMessage:
  string`, `photoUrl?: string`, `onAllPopped?: () => void` (fires the
  moment the final balloon is popped, not gated on the completion modal's
  own display/hold timing), `initialPopped?: number[]` (seeds `popped` on
  mount), `onPoppedChange?: (popped: number[]) => void` (fires the full
  current set after every pop), `onBack?: () => void` (shows a dedicated
  fixed top-left Back button when provided)
- `GiftUnwrap.tsx` — a gift box unwrapped across 3 layers (ribbon -> paper
  -> lid), each removal its own distinct animation (falling/spinning
  ribbon+bow, peeling paper, lifting lid + sparkle burst), with layers 1-2
  revealing a small inline icon/word and a short phrase
  (`giftLayerTwoPhrase`) respectively. Layer 3 doesn't go straight to a
  reveal — it opens a spin wheel (7 segments from
  `customData.birthday.giftWheelItems`, realistic decelerating spin
  physics, gold pointer/hub) that only THEN opens the final
  `fixed`+`createPortal` modal, leading with the landed item ("You get:
  {item}! 🎉") and `giftMessage` as supporting text. Closing no longer
  resets the sequence — once landed, layer 3 instead shows a compact
  "You got: {item}! — View your gift again" summary rather than replaying
  the unwrap+spin — used in: Birthday V1 — props: `giftMessage: string`,
  `giftLayerTwoPhrase: string`, `giftWheelItems: string[]`,
  `onWheelSpin?: (landedItem: string) => void` (fires once the wheel
  lands, not on the tap itself, now with the landed label),
  `initialLandedItem?: string` (seeds `layer`/`landedItem` on mount,
  skipping straight to the claimed summary), `onBack?: () => void` (shows a
  dedicated fixed top-left Back button when provided)
- `MemoryFrames.tsx` — meaningfully different shape from the other
  objects (a browsable gallery, not a one-time tap-and-reveal): idle state
  is a small fanned polaroid stack (first 2-3 photos); tapping opens a
  `fixed`+`createPortal` gallery showing every entry in `SiteData.photos`
  one at a time (large single polaroid, caption in its own bottom border),
  navigable via real prev/next buttons, arrow keys, or touch/mouse
  drag-swipe (Framer Motion `drag="x"` on a wrapper kept separate from the
  slide-transition content, so the two animation systems don't fight),
  with a "MEMORY 0X" counter + dot row + a party-themed atmosphere (2-row
  bunting garland, ambient background balloons, scattered-dot backdrop
  texture, confetti near the card, candle icons flanking the bottom
  counter). Backdrop-tap-to-dismiss (matching every other Birthday modal)
  plus the close button both work; reopening always starts fresh at photo
  1 via a remount-on-open key, since browsing has nothing to "reset" — used
  in: Birthday V1 — props: `photos: SitePhoto[]`, `onGalleryOpen?: () =>
  void` (fires on first open), `autoOpen?: boolean` (skips the idle stack,
  opens the gallery immediately on mount), `onBack?: () => void`
  (repurposes the existing "Close gallery" button/backdrop-tap to call
  this instead of just closing in place — no second Back button is added,
  unlike `BalloonReveal`/`GiftUnwrap`, since this component already has one
  natural close affordance to reuse)
- `CakeCustomizer.tsx` — decorate-your-own-cake object #4: a full 2-tier
  cake at the same depth/quality bar as `hero/BirthdayGate.tsx`'s own
  (gradient tiers, wavy piped frosting bands, cake stand, soft shadow),
  reimplemented locally, plus 3 individually tappable candles reusing that
  same file's layered-glow/flicker/extinguish-puff technique (all start
  unlit — lighting one is a deliberate tap, not a default). 7 frosting
  flavors (Chocolate/Vanilla/Strawberry/Lemon/Caramel/Mint/Blueberry — Mint
  and Blueberry recolored to a warm sage-cream and dusty rose-mauve rather
  than literal green/blue) and 7 multi-select toppings (Strawberries/
  Sprinkles/Chocolate Chips/Gold Pearls/Blueberries/Mint Leaves/Cherries),
  every option individually labeled beneath its swatch/icon. Selecting a
  frosting swaps the cake's color instantly and plays a decorative one-shot
  "pour" blob in the same color so the two read as one continuous moment;
  toppings drop in with a spring bounce at fixed hand-placed positions and
  fade out on deselect. No colored backdrop panel behind the cake (two
  earlier passes tried one, both reverted) — the candle glow was
  strengthened instead (two-layer bloom: a wide soft outer glow + a
  brighter tight inner halo) so it reads as clearly lit against the same
  plain cream background everything else sits on. "Save to Your Photos"
  clones the live `<svg>` (deterministically settling any mid-flicker lit
  candle to a clean "on" state first — Framer Motion's own SVG opacity
  attribute can otherwise read stale at the instant of serialization),
  serializes it, draws it onto an offscreen canvas at 2x scale, and
  triggers a real browser download (`<a download>`) of a PNG — purely
  client-side, no API route/server action/persistence — while
  simultaneously playing a full-screen one-shot `confetti.json` burst
  (same asset/pattern as `closing/GrandFinale.tsx` and
  `hero/BirthdayGate.tsx`, fading itself back out afterward via
  `AnimatePresence` rather than hiding behind a screen transition) and
  showing a brief fading "Saved to your photos" confirmation.
  `onCakeCustomized` fires once, on mount — same "opening the object at all
  is the signal" shape `MemoryFrames.tsx`'s own `onGalleryOpen` uses, not
  tied to Save — used in: Birthday V1 — props:
  `initialFrosting?: FrostingId | null`, `initialToppings?: ToppingId[]`,
  `onSelectionChange?: (frosting: FrostingId | null, toppings: ToppingId[]) => void`,
  `onCakeCustomized?: () => void`, `onBack?: () => void`
- `WishLetter.tsx` — object #5, this room's own bookend to
  `hero/BirthdayGate.tsx`'s silent candle-blow wish: a warm dusk-toned
  scene (deep warm brown fading to amber near the horizon — the one object
  in this room with a genuinely dark scene rather than the light cream
  every sibling sits on) with a from-scratch seeded ambient starfield
  (`mulberry32`, reimplemented locally — no comparable ambient starfield
  existed anywhere in Birthday V1 to reuse), across which a shooting star
  periodically transits. Adapts the catch mechanic from Anniversary V2's
  `interactive/ShootingStarWish.tsx` (same timing constants, generous
  hit-area padding well past the visible streak, pulsing "tap me" ring,
  slower transit for real tap-ability) into a fresh, non-shared
  implementation recolored to warm gold rather than that file's own
  rose-gold — reimplemented, not imported, per this project's product-line
  isolation principle; misses have no penalty and fade out, the next star
  already scheduled. Catching one opens a local `fixed`+`createPortal`
  letter-writing card (own implementation, styled per the warm-paper visual
  language of Anniversary V1's `message/SealedLetter.tsx` but not copied
  from it) prompting "What's your wish?" with a real `<textarea>` and a
  Send button; sending folds/fades the card upward and off-screen into a
  brief "Sent to the stars" confirmation (a hand-drawn sparkle icon, no
  emoji) before returning to the starfield. By design the wish text is
  never sent to any API, never stored anywhere, and is discarded from local
  state the instant Send is tapped — genuinely ephemeral, unlike every
  other object's keepsake-shaped payoff. `onWishSent` fires once, the first
  time a wish is successfully sent (not on open, since — unlike
  `MemoryFrames`/`CakeCustomizer` — this object has a genuine idle starfield
  state to sit in before that happens) — used in: Birthday V1 — props:
  `onWishSent?: () => void`, `onBack?: () => void`
- `RoomProgress.tsx` — small, quiet status readout (a "X of Y discovered"
  label + a dot row, same filled/unfilled terracotta-glow dot styling
  every other Birthday progress row in this section uses) — genuinely
  stateless, just renders whatever counts it's given; owns no
  discovery-tracking logic of its own — used in: Birthday V1 — props:
  `discoveredCount: number`, `total: number`
- `BirthdaySongPlayer.tsx` — small fixed bottom-right glass-morphism pill
  (warm cream/rose-gold, not Anniversary V2's dark-gold-on-burgundy), same
  imperative-`play()`-via-ref autoplay pattern `interactive/SongPlayer.tsx`
  (V2) + `interactive/UnlockGate.tsx` use: mounted as a sibling BEFORE
  `hero/BirthdayGate.tsx` in `templates/BirthdayV1.tsx` (outside its gated
  children) so its `<audio>` element already exists when the gate's own
  `onOpen` fires the exposed `play()` synchronously within the same
  candle-blow tap, satisfying browser autoplay policy. Toggle button is a
  real 44x44px tap target (V2's own equivalent is 36px); hand-drawn local
  play/pause/note icons rather than an icon-package import, matching every
  other Birthday file's own convention. Reuses `SiteData.songs?.[0]`
  directly (same sourcing `templates/AnniversaryV2.tsx` already uses) — no
  new `customData.birthday` field. If `songUrl` is missing, still renders
  (icon + title) with the toggle disabled and no `<audio>` mounted,
  matching V2's own graceful degradation. If `songTitle` is missing,
  renders nothing at all — used in: Birthday V1 — props: `songTitle?:
  string`, `songUrl?: string`, `ref?: React.Ref<BirthdaySongPlayerHandle>`

## birthdayShared/closing/

- `GrandFinale.tsx` — locked (a small muted prompt) until
  `templates/BirthdayV1.tsx` reports all 5 Celebration Room objects
  discovered, then reveals a fade/scale entrance: a one-shot (non-looping)
  `public/animations/confetti.json` Lottie burst behind "Happy Birthday,
  {name}!" and `SiteData.message`. Checked Anniversary's own
  `closing/Signature.tsx` (V2) and `closing/SunsetSignature.tsx` (V1) for a
  closing-beat reference per this task's own instruction, but this is a
  genuinely new Birthday-specific implementation, not a shared/ported file
  — neither Anniversary component gates on a completion condition, and
  deliberately kept simpler than either for this first pass (a single
  entrance + one confetti burst, not a whole choreographed sequence with
  ambient petals/butterflies/glow) — used in: Birthday V1 — props:
  `personName?: string`, `message: string`, `unlocked: boolean`

## birthdayShared/ (remaining categories)

- `ambient/` — still not built; no Celebration Room container/scene
  component exists yet. `templates/BirthdayV1.tsx` renders each of its 5
  interactive objects directly as its own full-screen hub-and-spoke panel
  rather than inside a dedicated scene wrapper.
