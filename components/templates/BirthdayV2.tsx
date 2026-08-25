import CountdownReveal from "@/components/birthdayShared/hero/CountdownReveal";
import ArcadeHub from "@/components/birthdayShared/interactive/ArcadeHub";
import type { SiteData } from "@/types/site";

interface BirthdayV2Props {
  data: SiteData;
}

// Birthday V2 — Phase 1 (entrance sequence) + Phase 2 (hub layout). Lives in
// components/birthdayShared/ alongside Birthday V1 (see
// hero/CountdownReveal.tsx's own doc comment for why this isn't a separate
// "V2" folder), never importing anything V1 renders. Data plumbing for this
// phase: people[0].name (the single honoree — Birthday V2 matches V1's
// single-honoree design, not Anniversary's people[] list; confirmed with the
// person after the original multi-honoree scoping was reverted — see
// app/admin/_shared/birthdayV2Order.ts's own doc comment on
// BirthdayV2OrderInput.name) and the new customData.birthdayV2Message (the
// entrance sequence's one customizable line of text). Every other SiteData
// field this order still has to carry (title, message, specialDate, photos)
// is unused by this phase — see app/admin/_shared/birthdayV2Order.ts's own
// doc comment for how those required-but-not-yet-rendered fields are
// handled in the admin form.
//
// interactive/ArcadeHub.tsx replaces Phase 1's plain "Main hub coming soon"
// placeholder — an "arcade floor" hub (centerpiece cake placeholder flanked
// by non-interactive mini-game cabinet tiles), genuinely distinct from
// Birthday V1's own asymmetric-scatter CelebrationHub, not a port of it.
// Still no 3D cake (Phase 3) or functional mini-games (Phase 4) — see that
// file's own top doc comment for the full scope note.
export default function BirthdayV2({ data }: BirthdayV2Props) {
  const birthdayV2Message = data.birthdayV2Message ?? "";
  const personName = data.people[0]?.name;

  return (
    <CountdownReveal personName={personName} message={birthdayV2Message}>
      <ArcadeHub personName={personName} />
    </CountdownReveal>
  );
}
