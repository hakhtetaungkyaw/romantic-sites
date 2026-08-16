# Project Context

## 1. Project Identity

The public-facing brand name is **VOWX**. It was renamed from the earlier working
name "Romantic Sites" / "Forever & Always" — the rebrand touches everything
user-facing: nav, footer, page metadata, and `package.json`'s `name` field. The
local folder and GitHub repo remain named `romatic-sites` and are intentionally
not renamed — the rebrand only affects what users see, not the codebase's
internal naming.

## 2. Homepage

`components/home/` — a complete redesign in a dark modern theme, deliberately
distinct from the romantic templates' own aesthetics: near-black background,
indigo accent `#6366f1`, clean sans-serif type. Sections, top to bottom:

- Sticky nav with scroll-spy
- Hero with an animated shuffle-grid photo gallery, laid out side-by-side with
  the hero text (not a full-bleed background image)
- Template showcase with category filter tabs (All / Anniversary / Birthday)
  and compact premium cards showing MMK pricing
- "How It Works" — 4-step section
- Telegram/TikTok CTA (`t.me/vowxteam`)
- Footer

## 3. Database & Order Fulfillment

Backend runs on **Neon**, not Supabase — Supabase was migrated away from after
unfixable local network issues (VPN/Windows Defender blocking Prisma's
schema-engine binary; see Known Environment Quirks). Connection uses the
standard Neon pattern: `DATABASE_URL` (pooled, port 6543) for the app, plus
`DIRECT_URL` (port 5432) for Prisma migrations.

Schema (`prisma/schema.prisma`) has two models, `Template` and `Order`. Order's
content fields (`photos`, `videos`, `songs`, `people`, `milestones`, `places`,
`customData`) are all flexible `Json` columns by design, so new template
content shapes don't require schema migrations.

Fulfillment is fully manual, not self-serve: a customer orders via Telegram DM,
the operator curates and organizes their photos/story off-platform, then runs
`lib/scripts/createOrder.ts` — an interactive CLI — to insert the order and
generate a private slug. The customer-facing page is the dynamic route
`app/site/[slug]/page.tsx`, marked `noindex`/`nofollow` and excluded via
`robots.ts` (these pages are never meant to be publicly discoverable).

## 4. Component Registry

`components/shared/` is organized into category subfolders — hero/, gallery/,
message/, countdown/, timeline/, ambient/, interactive/, closing/ — and every
component in there (plus both templates in `components/templates/`) is documented
in `components/REGISTRY.md`: its folder/category, which template(s) use it, a
one-line style description, and its props.

**Convention:** update `components/REGISTRY.md` every time a shared component is
added, removed, moved, or repurposed. When adding a genuinely new kind of
component, put it in the subfolder matching what it *does* (not which template it
belongs to); only add a new subfolder if none of the existing eight fit. This keeps
the registry a reliable map of what exists without having to read every component
file to find the right one.

## 5. Templates

Two Anniversary templates exist, deliberately built as separate visual
identities.

**V2 — "Night Sky" (`AnniversaryV2.tsx`) — complete, feature-rich.**
UnlockGate (tap-to-open, triggers song autoplay) → CinematicHero (video
background, typing animation) → ElegantCountdown → StoryLetter → LoveNote
(wax-seal envelope) → MemoryGallery (Museum Wall style: framed photos,
wall-label captions) → NightSkySection (crescent moon, drifting clouds,
shooting stars every ~3s, firework entrance burst, organic line-art
constellation heart) → TimelineOfUs → PlacesWeveBeen (connected route line,
hover memory cards, textured background) → SongPlayer → ClosingSignature.

**V1 — "Golden Hour Sunflower" (`AnniversaryV1.tsx`) — in progress, Phase 1.**
Muted peach-cream-rose gradient palette, warm-brown text (`#4a2f26`),
terracotta/dusty-rose/rose-gold accents, sunflower/butterfly motifs — chosen to
read as clearly distinct from V2's night-sky/heart motifs.

- **CRITICAL ARCHITECTURE RULE:** V1 and V2 must never share component files.
  Always build new V1-specific files; never edit anything `AnniversaryV2.tsx`
  imports. This is so customers can freely mix styles across templates in
  custom orders (e.g. "V2's gallery with V1's countdown") without one
  template's edits silently affecting the other.
- **Section 1 (SunsetHero) — done.** Gradient sky, repositioned sun glow,
  sunflower silhouette field (many flowers, botanically-refined petal/leaf
  shapes, all silhouettes — no Lottie mixed into the field), 7 free-flying
  butterflies using the real `butterfly.json` Lottie (muted via CSS filter to
  warm coral/dusty-rose/terracotta/gold tones, sped up via the `speed` prop
  for a livelier wing flap), light motes, couple names with typing/fade
  entrance. An earlier experimental version mixed Lottie sunflowers into the
  field itself; that was reverted — the field is silhouette-only.
- **Section 2 (GoldenSkySection) — done.** Sun glow, drifting clouds, light
  rays, falling petals (color-synced to the Lottie's own palette), and the
  real `sunflower.json` Lottie as the section's centerpiece. Reaching this
  took several failed attempts at custom SVG burst/mandala effects before
  landing on the actual Lottie file (see Section 6 and the "hand-coded vs.
  Lottie" note below).
- **Sections 3-6 — done.** `message/SealedLetter.tsx` (letter card on warm
  cream paper, terracotta drop cap, small sunflower-bloom "wax seal"
  medallion in place of V2's envelope-and-crack icon), `gallery/
  SunlitPolaroids.tsx` (scrapbook/polaroid grid — tilted cream-bordered
  cards, washi-tape corners — instead of V2's formal Museum Wall),
  `countdown/SunflowerCountdown.tsx` (same elapsed-time math and per-tick
  digit pop as V2's `GlassCards`, warm cream cards with a pulsing bloom
  marker per digit), `closing/SunsetSignature.tsx` (handwritten-signature
  heading, closing beat is the real `sunflower.json` Lottie at small scale —
  unfiltered, same treatment as GoldenSkySection's centerpiece, so the
  template's opening and closing "wow" moments visually rhyme). All 4 have
  standalone `/preview/*` routes for isolated review, same as Sections 1-2.
- **Key learning:** complex generative/procedural animations built from
  scratch in SVG + Framer Motion (shooting stars, bird wing-flaps, burst
  effects) repeatedly fell short of quality expectations after multiple
  iterations. Switching to real, properly-licensed pre-made Lottie animations
  produced much better results for complex organic motion (flower blooming,
  butterfly flight) than hand-coded alternatives — worth reaching for a Lottie
  asset earlier rather than iterating on a hand-built version.

## 6. Lottie Assets

`public/animations/sunflower.json` and `butterfly.json`, both sourced from
LottieFiles under free/commercial-safe licenses, integrated via the
`lottie-react` package. Both required CSS filter adjustments (`hue-rotate` +
`saturate` + `brightness`) to mute their native vivid/off-palette colors to
match V1's muted sunset palette — see Known Environment Quirks.

## 7. Patterns & Conventions

Hydration-safety pattern (established): any component whose values differ between
server render and client render (Math.random layouts, Date.now countdowns, etc.) uses
useSyncExternalStore with a static server snapshot (empty list / zeros) and a
client-side subscribe that updates post-hydration. See ambient/FloatingHearts.tsx and
countdown/Simple.tsx for reference implementations. Use this same pattern for any future
client-dynamic component (clocks, live counters, randomized layouts).

## 8. Known Environment Quirks

- **Supabase was unusable locally on this machine** — VPN/Windows Defender
  blocked Prisma's schema-engine binary with no found fix, which is why the
  project runs on Neon instead (see Database & Order Fulfillment).
- **Lottie animations ship with fixed native colors** that can't be edited via
  code — only masked with CSS filters. If a sourced Lottie's palette doesn't
  match a template's design system, plan on a `hue-rotate`/`saturate`/
  `brightness` filter pass to correct it, and check this *before* committing
  to a given Lottie asset, not after it's already integrated.

## 9. Next Steps

1. Integrate all 6 V1 sections into `AnniversaryV1.tsx` (currently still
   wired to the old rose/burgundy components) and do a full-page
   scroll-through review — including cross-section background-gradient
   transitions, since each section was built/reviewed standalone via its
   own `/preview/*` route and hasn't been checked back-to-back yet.
2. Apply the same V1 sunset palette treatment to the homepage template card
   thumbnail, if needed.
3. **Push to GitHub — not yet pushed this session, priority.**
4. Production Vercel deploy.
5. Cloudinary setup for real customer photo uploads.
6. Birthday category template.
