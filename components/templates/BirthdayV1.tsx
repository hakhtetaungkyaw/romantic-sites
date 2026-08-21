"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

import GrandFinale from "@/components/birthdayShared/closing/GrandFinale";
import BirthdayGate from "@/components/birthdayShared/hero/BirthdayGate";
import BalloonReveal from "@/components/birthdayShared/interactive/BalloonReveal";
import BirthdaySongPlayer, {
  type BirthdaySongPlayerHandle,
} from "@/components/birthdayShared/interactive/BirthdaySongPlayer";
import CakeCustomizer, {
  type FrostingId,
  type ToppingId,
} from "@/components/birthdayShared/interactive/CakeCustomizer";
import CelebrationHub from "@/components/birthdayShared/interactive/CelebrationHub";
import GiftUnwrap from "@/components/birthdayShared/interactive/GiftUnwrap";
import MemoryFrames from "@/components/birthdayShared/interactive/MemoryFrames";
import RoomProgress from "@/components/birthdayShared/interactive/RoomProgress";
import WishLetter from "@/components/birthdayShared/interactive/WishLetter";
import type { BirthdayCustomData, SiteData } from "@/types/site";

interface BirthdayV1Props {
  data: SiteData;
}

const ROOM_OBJECT_COUNT = 5;

type ActiveView = "hub" | "balloons" | "gift" | "photos" | "cake" | "wishes" | "finale";

// Every view swap uses this same fade — matches the fade every other
// text/content transition in this project's Birthday files uses via
// AnimatePresence mode="wait", just applied here to a whole screen instead
// of a caption.
const VIEW_TRANSITION = { duration: 0.35 };

// Low-opacity offset dot grid over a cream->champagne gradient — the same
// party-atmosphere background-image recipe
// interactive/MemoryFrames.tsx's own GalleryView and
// interactive/CelebrationHub.tsx's own bunting/lantern atmosphere both use,
// reimplemented locally here (not imported, per this project's standing
// isolation convention) rather than reinvented. Painted here, on the
// SHARED "hub" view wrapper, rather than inside CelebrationHub.tsx's own
// root section — the hub screen's full content is
// interactive/CelebrationHub PLUS interactive/RoomProgress below it (a
// sibling, not a child), so a background scoped to CelebrationHub's own
// section alone would end exactly where that component's content ends,
// leaving a visible seam above RoomProgress. `background-attachment`'s
// default value ("scroll") ties the background to this wrapper's own box
// rather than to its scrolling content, so it stays fully visible behind
// everything at any scroll position regardless of total content height —
// verified with zero visible cutoff at both 375x560 and 375x600.
const HUB_PATTERN_BACKGROUND: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, rgba(217,122,95,0.16) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(212,145,154,0.14) 1.5px, transparent 1.5px), linear-gradient(to bottom, #fdf6ec 0%, #f0dfc0 100%)",
  backgroundSize: "28px 28px, 28px 28px, 100% 100%",
  backgroundPosition: "0 0, 14px 14px, 0 0",
};

function BackChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
    </svg>
  );
}

// The finale's own Back-to-hub affordance, rendered here at the template
// level rather than inside closing/GrandFinale.tsx — that file's own
// props/content contract (personName/message/unlocked, confetti + heading +
// message) stays untouched per this task's own instruction, so this button
// is a template-level overlay instead. Reimplemented locally with the same
// convention every object's own BackButton in this Birthday tree already
// uses (interactive/BalloonReveal.tsx, interactive/GiftUnwrap.tsx).
function FinaleBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to celebration room"
      className="fixed left-3 top-3 z-30 flex h-11 items-center gap-1.5 rounded-full bg-[#fdf6ec]/80 py-2 pl-2.5 pr-4 text-sm text-[#6b4332] shadow-md shadow-[#6b4332]/20 transition-colors hover:bg-[#fdf6ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97a5f]"
    >
      <BackChevronIcon />
      Back
    </button>
  );
}

// BirthdayV1 "Celebration Room" — the first template in VOWX's new Birthday
// product line. Deliberately separate from every Anniversary template:
// every section component below lives under components/birthdayShared/
// (never components/shared/, and never importing from it), the exact same
// file-isolation principle Anniversary V1/V2 already use between each
// other.
//
// Navigation: hub-and-spoke, not a vertical scroll-stack. `activeView`
// drives a single AnimatePresence mode="wait" swap between 7 full-screen
// panels (each `absolute inset-0` inside one `h-dvh` `main`, own
// `overflow-y-auto` + `hide-scrollbar`):
//   - "hub"      — interactive/CelebrationHub, the room's own directory: 5
//                  tiles (Balloons/Gift/Photos/Cake/Wishes) plus
//                  interactive/RoomProgress as a complementary aggregate
//                  readout beneath them. This view wrapper carries its own
//                  HUB_PATTERN_BACKGROUND (below) rather than
//                  CelebrationHub.tsx painting it on its own root — the
//                  hub's dot-pattern atmosphere needs to cover RoomProgress
//                  too, which lives outside that component, so it's painted
//                  once here where both are guaranteed to be covered with
//                  no seam between them.
//   - "balloons" — interactive/BalloonReveal, entered/exited via its own
//                  onBack-driven BackButton.
//   - "gift"     — interactive/GiftUnwrap, same Back convention.
//   - "photos"   — interactive/MemoryFrames with autoOpen set (skips its own
//                  idle stack, jumps straight to the gallery), whose
//                  existing "Close gallery" button is repurposed via onBack
//                  to return to the hub instead of just closing in place.
//   - "cake"     — interactive/CakeCustomizer, same Back convention; its own
//                  "discovered" signal fires on mount, not tied to the Save
//                  button.
//   - "wishes"   — interactive/WishLetter, same Back convention; its own
//                  "discovered" signal fires the first time a wish is sent,
//                  not on open (unlike Cake/Photos, it has a genuine idle
//                  starfield state to sit in before that happens).
//   - "finale"   — closing/GrandFinale, reached only via the hub's own CTA
//                  tile (shown once all 5 objects are discovered) rather
//                  than an automatic transition, with FinaleBackButton above
//                  providing a way back to the hub.
//
// State lifting: most objects' own progress is lifted here so it survives
// the genuine unmount/remount a hub round-trip causes (poppedBalloons /
// giftLandedItem / galleryDiscovered / cakeFrosting+cakeToppings), seeded
// back down via each object's own initialPopped / initialLandedItem /
// autoOpen / initialFrosting+initialToppings props and kept in sync via
// onPoppedChange / onWheelSpin / onGalleryOpen / onSelectionChange — see
// each object's own props doc comment for the full "seed-on-mount,
// report-via-callback" reasoning. interactive/WishLetter is the one
// exception: by design it has nothing to seed back (each wish is written
// and released, never kept), so only its one-shot onWishSent discovered
// signal is lifted, the same as every other object's own discovered flag.
// This template still owns no per-object interaction logic of its own,
// same as before this restructure — it only listens and re-seeds.
//
// Data plumbing: same as before — people[0].name (birthday person),
// specialDate (birthdate, not yet used by any built section), title (now
// shown on the hub screen), message (grand-finale message), photos (Memory
// Frame gallery), with customData.birthday (BirthdayCustomData) holding the
// Birthday-specific extras every object below actually needs.
export default function BirthdayV1({ data }: BirthdayV1Props) {
  const birthday = data.customData?.birthday as BirthdayCustomData | undefined;
  const personName = data.people[0]?.name;
  const song = data.songs?.[0];

  const songPlayerRef = useRef<BirthdaySongPlayerHandle>(null);

  const [activeView, setActiveView] = useState<ActiveView>("hub");
  const goToHub = () => setActiveView("hub");

  // Lifted per-object progress — see this component's own doc comment above
  // for why (a hub round-trip genuinely unmounts/remounts the active
  // object, so its own internal state alone can't survive that).
  const [poppedBalloons, setPoppedBalloons] = useState<number[]>([]);
  const [balloonsDiscovered, setBalloonsDiscovered] = useState(false);
  const [giftLandedItem, setGiftLandedItem] = useState("");
  const [galleryDiscovered, setGalleryDiscovered] = useState(false);
  const [cakeFrosting, setCakeFrosting] = useState<FrostingId | null>(null);
  const [cakeToppings, setCakeToppings] = useState<ToppingId[]>([]);
  const [cakeDiscovered, setCakeDiscovered] = useState(false);
  const [wishesDiscovered, setWishesDiscovered] = useState(false);

  const giftDiscovered = Boolean(giftLandedItem);
  const discoveredCount = [
    balloonsDiscovered,
    giftDiscovered,
    galleryDiscovered,
    cakeDiscovered,
    wishesDiscovered,
  ].filter(Boolean).length;
  const allDiscovered = discoveredCount === ROOM_OBJECT_COUNT;
  const balloonsTotal = birthday?.balloonMessages.length ?? 0;

  return (
    <>
      {/* Mounted before the gate opens (hidden behind its own z-50 overlay)
          so the <audio> element already exists when BirthdayGate's own
          onOpen fires — play() needs to run synchronously within the tap
          that extinguishes the candles, not later once this would
          otherwise first mount. Same pattern templates/AnniversaryV2.tsx
          uses for its own SongPlayer + UnlockGate pairing. */}
      <BirthdaySongPlayer ref={songPlayerRef} songTitle={song?.title} songUrl={song?.url} />

      <BirthdayGate age={birthday?.age} personName={personName} onOpen={() => songPlayerRef.current?.play()}>
        <main className="relative h-dvh min-h-[560px] overflow-hidden bg-[#fdf6ec]">
          <AnimatePresence mode="wait">
            {activeView === "hub" && (
              <motion.div
                key="view-hub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
                style={HUB_PATTERN_BACKGROUND}
              >
                <CelebrationHub
                  title={data.title}
                  personName={personName}
                  balloonsPopped={poppedBalloons.length}
                  balloonsTotal={balloonsTotal}
                  balloonsDiscovered={balloonsDiscovered}
                  giftDiscovered={giftDiscovered}
                  galleryDiscovered={galleryDiscovered}
                  cakeDiscovered={cakeDiscovered}
                  wishesDiscovered={wishesDiscovered}
                  onSelectBalloons={() => setActiveView("balloons")}
                  onSelectGift={() => setActiveView("gift")}
                  onSelectPhotos={() => setActiveView("photos")}
                  onSelectCake={() => setActiveView("cake")}
                  onSelectWishes={() => setActiveView("wishes")}
                  onProceedToFinale={() => setActiveView("finale")}
                />
                <RoomProgress discoveredCount={discoveredCount} total={ROOM_OBJECT_COUNT} />
              </motion.div>
            )}

            {activeView === "balloons" && (
              <motion.div
                key="view-balloons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <BalloonReveal
                  messages={birthday?.balloonMessages ?? []}
                  completionMessage={birthday?.balloonCompletionMessage ?? ""}
                  photoUrl={birthday?.balloonCompletionPhoto}
                  onAllPopped={() => setBalloonsDiscovered(true)}
                  initialPopped={poppedBalloons}
                  onPoppedChange={setPoppedBalloons}
                  onBack={goToHub}
                />
              </motion.div>
            )}

            {activeView === "gift" && (
              <motion.div
                key="view-gift"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <GiftUnwrap
                  giftMessage={birthday?.giftMessage ?? ""}
                  giftLayerOneKeyword={birthday?.giftLayerOneKeyword ?? ""}
                  giftLayerTwoPhrase={birthday?.giftLayerTwoPhrase ?? ""}
                  giftWheelItems={birthday?.giftWheelItems ?? []}
                  initialLandedItem={giftLandedItem}
                  onWheelSpin={setGiftLandedItem}
                  onBack={goToHub}
                />
              </motion.div>
            )}

            {activeView === "photos" && (
              <motion.div
                key="view-photos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <MemoryFrames
                  photos={data.photos}
                  onGalleryOpen={() => setGalleryDiscovered(true)}
                  autoOpen
                  onBack={goToHub}
                />
              </motion.div>
            )}

            {activeView === "cake" && (
              <motion.div
                key="view-cake"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <CakeCustomizer
                  initialFrosting={cakeFrosting}
                  initialToppings={cakeToppings}
                  onSelectionChange={(frosting, toppings) => {
                    setCakeFrosting(frosting);
                    setCakeToppings(toppings);
                  }}
                  onCakeCustomized={() => setCakeDiscovered(true)}
                  onBack={goToHub}
                />
              </motion.div>
            )}

            {activeView === "wishes" && (
              <motion.div
                key="view-wishes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <WishLetter onWishSent={() => setWishesDiscovered(true)} onBack={goToHub} />
              </motion.div>
            )}

            {activeView === "finale" && (
              <motion.div
                key="view-finale"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={VIEW_TRANSITION}
                className="hide-scrollbar absolute inset-0 overflow-y-auto"
              >
                <FinaleBackButton onClick={goToHub} />
                <GrandFinale personName={personName} message={data.message} unlocked={allDiscovered} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </BirthdayGate>
    </>
  );
}
