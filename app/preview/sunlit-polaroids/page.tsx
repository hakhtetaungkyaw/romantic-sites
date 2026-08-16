import SunlitPolaroids from "@/components/shared/gallery/SunlitPolaroids";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only SunlitPolaroids in
// isolation so it can be reviewed before the rest of the V1 "Golden Hour"
// redesign is integrated into AnniversaryV1.tsx. Safe to delete once that
// lands.
export default function SunlitPolaroidsPreviewPage() {
  const { photos } = dummySiteData;
  return <SunlitPolaroids photos={photos} />;
}
