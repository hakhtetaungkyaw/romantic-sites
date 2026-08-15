import GoldenSkySection from "@/components/shared/ambient/GoldenSkySection";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only GoldenSkySection in
// isolation so it can be reviewed before the rest of the V1 "Golden Hour"
// redesign (Sections 3-6) is built. Safe to delete once those land and this
// folds into a real updated V1 template.
export default function GoldenSkySectionPreviewPage() {
  const { specialDate } = dummySiteData;
  return <GoldenSkySection specialDate={specialDate} />;
}
