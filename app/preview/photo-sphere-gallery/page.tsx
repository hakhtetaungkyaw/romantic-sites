import type { Metadata } from "next";

import PhotoSphereGalleryClient from "./PhotoSphereGalleryClient";

// Preview route for Phase 5b's own component, same convention as every
// other app/preview/* page (e.g. app/preview/birthday-v2/page.tsx) — a
// permanent dev-convenience route, not a throwaway. Uses
// lib/dummyData.ts's dummyBirthdayV2Data.photos (8 photos, above the
// Phase 5 sphere-gallery threshold) so this exercises the sphere directly
// without needing Phase 5c's own tile/banner wiring to exist yet.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PhotoSphereGalleryPreviewPage() {
  return <PhotoSphereGalleryClient />;
}
