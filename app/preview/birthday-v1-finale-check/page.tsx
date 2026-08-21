import GrandFinale from "@/components/birthdayShared/closing/GrandFinale";
import { dummyBirthdayData } from "@/lib/dummyData";

export default function GrandFinaleCheckPage() {
  return (
    <GrandFinale
      personName={dummyBirthdayData.people[0]?.name}
      message={dummyBirthdayData.message}
      unlocked
    />
  );
}
