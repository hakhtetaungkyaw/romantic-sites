import { Music } from "lucide-react";

import FloatingHearts from "@/components/shared/ambient/FloatingHeartsV1";
import CountdownTimer from "@/components/shared/countdown/Simple";
import UniformGrid from "@/components/shared/gallery/UniformGrid";
import StaticFade from "@/components/shared/hero/StaticFade";
import SimpleCentered from "@/components/shared/message/SimpleCentered";
import type { SiteData } from "@/types/site";

interface AnniversaryV1Props {
  data: SiteData;
}

export default function AnniversaryV1({ data }: AnniversaryV1Props) {
  const { people, groupTitle, title, message, specialDate, photos, songs } = data;
  const song = songs?.[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6f0] to-[#f0e8dc]">
      <FloatingHearts />

      <div className="relative z-10">
        <StaticFade people={people} groupTitle={groupTitle} title={title} />

        <CountdownTimer specialDate={specialDate} />

        <UniformGrid photos={photos} />

        <SimpleCentered message={message} />

        {song && (
          <div className="flex items-center justify-center gap-2 pb-16 text-sm text-[#c9a0a0]">
            <Music size={16} />
            <span>{song.title}</span>
          </div>
        )}
      </div>
    </main>
  );
}
