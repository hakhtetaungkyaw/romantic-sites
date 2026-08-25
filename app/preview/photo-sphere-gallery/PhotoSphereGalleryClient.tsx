"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { dummyBirthdayV2Data } from "@/lib/dummyData";
import type { SitePhoto } from "@/types/site";

// ssr:false isn't allowed directly in a Server Component — this page's own
// page.tsx exports `metadata`, which forces it to stay one, so the dynamic
// import lives in this small Client Component instead, same pattern
// components/birthdayShared/interactive/ArcadeHub.tsx doesn't need (it's
// already "use client" throughout) but this standalone preview page does.
const PhotoSphereGallery = dynamic(
  () => import("@/components/birthdayShared/interactive/PhotoSphereGallery"),
  { ssr: false },
);

// Builds a photo array of the given length by cycling through the 8 real
// demo photos — doesn't need real distinct images for a density test, and
// the sphere component already cycles repeated photos itself once
// `repeatMultiplier` > 1, so reusing the same 8 URLs to reach a raw count
// like 15 is a fine stand-in for "many real photos."
function photosOfCount(n: number): SitePhoto[] {
  const base = dummyBirthdayV2Data.photos;
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

// Three scenarios from the task's own Step 4 ask, testing both extremes of
// the multiplier's actual purpose: a sparse gallery bulked up, a rich
// gallery left alone, and the multiplier's own upper clamp.
const SCENARIOS = [
  { label: "6 photos × 3 (18 nodes)", photoCount: 6, multiplier: 3 },
  { label: "15 photos × 1 (15 nodes)", photoCount: 15, multiplier: 1 },
  { label: "4 photos × 4 (16 nodes)", photoCount: 4, multiplier: 4 },
] as const;

export default function PhotoSphereGalleryClient() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const scenario = SCENARIOS[scenarioIndex];

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "radial-gradient(ellipse at center, #0f2b30 0%, #050b0f 75%)" }}
    >
      <div className="relative z-[100] flex flex-wrap justify-center gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setScenarioIndex(i);
              setOpen(true);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === scenarioIndex
                ? "bg-[#4fbdc2] text-[#0a1518]"
                : "border border-[#4fbdc2]/30 text-[#4fbdc2] hover:bg-[#4fbdc2]/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-gradient-to-b from-[#4fbdc2] to-[#2c7a80] px-6 py-3 text-sm font-medium text-white shadow-lg"
        >
          Open gallery
        </button>
      )}
      {open && (
        <PhotoSphereGallery
          key={scenario.label}
          photos={photosOfCount(scenario.photoCount)}
          repeatMultiplier={scenario.multiplier}
          onClose={() => setOpen(false)}
        />
      )}
    </main>
  );
}
