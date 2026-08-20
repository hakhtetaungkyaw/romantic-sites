interface RoomProgressProps {
  discoveredCount: number;
  total: number;
}

// Small, subtle progress cue tracking how many of the Celebration Room's
// objects have been discovered — same "one dot per unit, filled solid as
// reached" convention every other Birthday interactive object's own
// progress dots already use (interactive/BalloonReveal.tsx's 7-dot row,
// interactive/GiftUnwrap.tsx's 3-dot layer row), reimplemented locally here
// rather than imported, per this project's standing convention that
// feature-level interactive/ components stay independent of each other's
// implementation details. Deliberately small/quiet (tiny label, 6px dots,
// generous vertical breathing room, no card/border/background of its own)
// — a status readout between sections, not a competing focal element.
export default function RoomProgress({ discoveredCount, total }: RoomProgressProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b4332]/40">
        {discoveredCount} of {total} discovered
      </p>
      <div aria-hidden="true" className="flex justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < discoveredCount;
          return (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: filled ? "#d97a5f" : "rgba(107,67,50,0.25)",
                boxShadow: filled ? "0 0 5px 1px rgba(217,122,95,0.6)" : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
