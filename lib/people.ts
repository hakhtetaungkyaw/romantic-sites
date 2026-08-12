import type { SitePerson } from "@/types/site";

export function formatPeopleHeading(
  people: SitePerson[],
  groupTitle?: string,
): string {
  if (groupTitle) return groupTitle;
  if (people.length === 0) return "";
  if (people.length === 1) return `For ${people[0].name}`;
  if (people.length === 2) return `${people[0].name} & ${people[1].name}`;

  const names = people.map((person) => person.name);
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}
