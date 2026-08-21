export interface SitePhoto {
  src: string;
  caption?: string;
}

export interface SitePerson {
  name: string;
}

export interface SiteVideo {
  src: string;
  caption?: string;
  role?: string;
}

export interface SiteSong {
  url: string;
  title: string;
}

export interface SiteData {
  /** Minimum 1 entry. */
  people: SitePerson[];
  groupTitle?: string;
  title: string;
  message: string;
  specialDate: string;
  /** The full photo gallery — `gallery/Magazine.tsx` (V2), `gallery/
   *  SunlitPolaroids.tsx` (V1), and Birthday's own `interactive/
   *  MemoryFrames.tsx` all display this ENTIRE array. No other component
   *  may pick a single photo out of it by index (`photos[0]`,
   *  `photos[length-1]`, etc.) for its own separate reveal/moment — every
   *  entry here is guaranteed customer-facing gallery content, so any index
   *  chosen would always duplicate something the customer already sees in
   *  the gallery. A component needing its own distinct photo gets its own
   *  dedicated field instead — see `constellationRevealPhoto` and
   *  `shootingStarWishPhoto` below (V2), or `BirthdayCustomData`'s own
   *  `balloonCompletionPhoto`/`giftPhoto` further down this file (Birthday).
   *  The one accepted exception is `hero/CinematicVideo.tsx`'s own
   *  `poster={photos[0]?.src}` (V2) — an always-visible hero poster frame,
   *  not a hidden reveal, where reusing a representative photo is
   *  intentional. */
  photos: SitePhoto[];
  /** `interactive/ConstellationGame.tsx`'s (V2) own reveal-card photo,
   *  shown once all 6 stars are connected in order — a dedicated photo,
   *  independent of `photos[]` (see that field's own doc comment above for
   *  why). Previously sourced from `photos[photos.length - 1]`, which
   *  always duplicated that gallery's own last photo. */
  constellationRevealPhoto?: string;
  /** `interactive/ShootingStarWish.tsx`'s (V2) own reveal-card photo, shown
   *  once the shooting star is caught — same "dedicated, independent of
   *  photos[]" reasoning as `constellationRevealPhoto` above. Previously
   *  sourced from `photos[1]` (only shown when 3+ photos existed); now
   *  optional here instead, with the same graceful "no photo" degradation
   *  when unset. Threaded through `ambient/NightSky.tsx`'s own
   *  `wishPhotoUrl` prop, which wraps this component. */
  shootingStarWishPhoto?: string;
  videos?: SiteVideo[];
  songs?: SiteSong[];
  milestones?: {
    date: string;
    title: string;
    description?: string;
    photo?: string;
  }[];
  closingLine?: string;
  secretNote?: string;
  places?: {
    name: string;
    caption: string;
    x: number;
    y: number;
    photo?: string;
  }[];
  typedPhrases?: string[];
  /**
   * Escape hatch for genuinely new, template-specific data that doesn't fit
   * an existing field yet. Not a dumping ground — if a field turns out to be
   * used by every template, promote it to a real field instead.
   */
  customData?: Record<string, unknown>;
}

/**
 * Birthday templates' (BirthdayV1 "Celebration Room" onward) shape for
 * `SiteData.customData.birthday` — intentionally NOT a change to
 * `customData`'s own `Record<string, unknown>` type (that stays generic and
 * backward-compatible for every template family); this is just the shape a
 * Birthday template should expect to find AT that key, and cast to when
 * reading it.
 *
 * Most of what a Birthday site needs is already covered by SiteData's
 * existing generic fields, reused rather than duplicated here:
 *   - `people[0].name`  -> the birthday person's name (people has a minimum
 *                          of 1 entry; Birthday only ever uses the first)
 *   - `specialDate`     -> the birthdate
 *   - `title`           -> the Celebration Room's own heading
 *   - `message`         -> the grand-finale main message
 *   - `photos[]`        -> EXCLUSIVELY the Memory Frame gallery's photos
 *                          (interactive/MemoryFrames.tsx shows the entire
 *                          array) — no other Birthday object may source a
 *                          photo from this array by index, since every
 *                          entry in it is guaranteed customer-facing
 *                          gallery content; a one-off "accent" photo picked
 *                          from `photos[0]`/`photos[length-1]` would always
 *                          duplicate something the customer already sees in
 *                          the gallery. Any object needing its own distinct
 *                          photo gets its own dedicated field below instead
 *                          (`balloonCompletionPhoto`, `giftPhoto`).
 *   - `songs[0]`        -> interactive/BirthdaySongPlayer.tsx's track, same
 *                          `songs?.[0]` sourcing templates/AnniversaryV2.tsx
 *                          already uses for its own SongPlayer
 * `customData.birthday` holds only what's genuinely new and has no existing
 * SiteData field to reuse.
 */
export interface BirthdayCustomData {
  age?: number;
  cakeWishMessage: string;
  balloonMessages: string[];
  /** Shown in the reveal card once every balloon in balloonMessages has been popped — deliberately separate from SiteData.message, which is reserved for the Grand Finale's own payoff later in the template. */
  balloonCompletionMessage: string;
  /** interactive/BalloonReveal.tsx's own completion-reveal photo — a dedicated photo distinct from SiteData.photos[] (see that field's own doc comment above for why: the gallery shows the whole array, so any index reused here would always duplicate something the customer already sees there), same "own dedicated field, not an index into the shared array" reasoning giftPhoto below already established. */
  balloonCompletionPhoto: string;
  /** Shown inline in interactive/GiftUnwrap.tsx after its first unwrap layer (the ribbon) comes off — a single word/short phrase, the opening beat of its 3-layer sequence. Previously hardcoded as a literal "Joy" with no field/prop backing it at all (not a wire-up gap — the prop genuinely didn't exist); now sourced the same way giftLayerTwoPhrase already is. */
  giftLayerOneKeyword: string;
  /** Shown inline in interactive/GiftUnwrap.tsx after its second unwrap layer (the wrapping paper) comes off — the middle beat of its 3-layer sequence, before the final reveal modal. */
  giftLayerTwoPhrase: string;
  /** The 7 short labels shown on interactive/GiftUnwrap.tsx's spin wheel (layer 3, after the box opens) — one segment each. Kept short since each has to fit inside a wheel segment. */
  giftWheelItems: string[];
  /** Shown in interactive/GiftUnwrap.tsx's final reveal modal once the wheel lands — its own field so it doesn't duplicate SiteData.message (Grand Finale) or balloonCompletionMessage (BalloonReveal's own completion). Now supporting text alongside the landed wheel item, not the modal's sole content. */
  giftMessage: string;
  /** interactive/GiftUnwrap.tsx's own photo slot — deliberately separate from SiteData.photos[], so it never collides with an index another Birthday object already reuses. */
  giftPhoto?: string;
}
