import SunsetSignature from "@/components/shared/closing/SunsetSignature";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only SunsetSignature in
// isolation so it can be reviewed before the rest of the V1 "Golden Hour"
// redesign is integrated into AnniversaryV1.tsx. Safe to delete once that
// lands.
export default function SunsetSignaturePreviewPage() {
  const { people, groupTitle, closingLine } = dummySiteData;
  return <SunsetSignature people={people} groupTitle={groupTitle} closingLine={closingLine} />;
}
