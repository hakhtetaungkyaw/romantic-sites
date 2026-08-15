import SunsetHero from "@/components/shared/hero/SunsetHero";
import { dummySiteData } from "@/lib/dummyData";

// Temporary, phase-scoped preview — renders only SunsetHero in isolation so
// it can be reviewed before the rest of the V1 "Golden Hour" redesign
// (Sections 2-6) is built. Safe to delete once those land and this folds
// into a real updated V1 template.
export default function SunsetHeroPreviewPage() {
  const { people, groupTitle, title } = dummySiteData;
  return <SunsetHero people={people} groupTitle={groupTitle} title={title} />;
}
