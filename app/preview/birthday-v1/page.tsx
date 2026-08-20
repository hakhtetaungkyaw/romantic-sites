import BirthdayV1 from "@/components/templates/BirthdayV1";
import { dummyBirthdayData } from "@/lib/dummyData";

export default function BirthdayV1PreviewPage() {
  return <BirthdayV1 data={dummyBirthdayData} />;
}
