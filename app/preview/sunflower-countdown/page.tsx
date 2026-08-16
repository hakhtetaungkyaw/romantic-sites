import SunflowerCountdown from "@/components/shared/countdown/SunflowerCountdown";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only SunflowerCountdown in
// isolation so it can be reviewed before the rest of the V1 "Golden Hour"
// redesign is integrated into AnniversaryV1.tsx. Safe to delete once that
// lands.
export default function SunflowerCountdownPreviewPage() {
  const { specialDate } = dummySiteData;
  return <SunflowerCountdown specialDate={specialDate} />;
}
