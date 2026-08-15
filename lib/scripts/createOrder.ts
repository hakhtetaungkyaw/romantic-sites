/**
 * Interactive Telegram-intake CLI for manually creating an Order. Run with:
 *
 *   npx tsx lib/scripts/createOrder.ts
 *
 * We take orders over a Telegram DM conversation. This walks through the
 * same fields in the same order as that conversation, so nothing gets
 * missed and data entry stays consistent between orders. It shows a summary
 * and asks for confirmation before writing anything to the database.
 */
import "dotenv/config";

import { confirm, input } from "@inquirer/prompts";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { siteDataToOrderFields } from "@/lib/orderMapper";
import { generateSlug } from "@/lib/slug";
import type { SiteData, SitePhoto, SiteVideo } from "@/types/site";

// TODO: replace with the real production domain once it's chosen.
const SITE_URL = process.env.SITE_URL ?? "https://vowx.example";

const isNonEmpty = (value: string) =>
  value.trim().length > 0 || "This field can't be empty.";

const isUrl = (value: string) =>
  /^https?:\/\//i.test(value.trim()) || "Enter a URL starting with http:// or https://";

const isValidDate = (value: string) =>
  !Number.isNaN(Date.parse(value.trim())) ||
  "Enter a date that can be parsed, e.g. 2026-06-14.";

async function pickTemplate() {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (templates.length === 0) {
    throw new Error("No active templates found — add one via prisma/seed.ts first.");
  }

  console.log("\nWhich template?");
  templates.forEach((template, index) => {
    console.log(
      `  ${index + 1}. ${template.name} (${template.componentKey}) — ${formatPrice(template.price)}`,
    );
  });

  const answer = await input({
    message: `Enter a number (1-${templates.length}):`,
    validate: (value) => {
      const choice = Number(value.trim());
      return (
        (Number.isInteger(choice) && choice >= 1 && choice <= templates.length) ||
        `Enter a number between 1 and ${templates.length}.`
      );
    },
  });

  return templates[Number(answer.trim()) - 1];
}

async function collectGalleryPhotos(): Promise<SitePhoto[]> {
  const photos: SitePhoto[] = [];
  let addMore = true;

  while (addMore) {
    const src = await input({
      message: photos.length === 0 ? "Gallery photo URL:" : "Next gallery photo URL:",
      validate: isUrl,
    });
    photos.push({ src: src.trim() });
    addMore = await confirm({ message: "Add another gallery photo?", default: true });
  }

  return photos;
}

async function collectVideos(): Promise<SiteVideo[] | undefined> {
  const wantsVideos = await confirm({ message: "Add any videos?", default: false });
  if (!wantsVideos) return undefined;

  const videos: SiteVideo[] = [];
  let addMore = true;

  while (addMore) {
    const src = await input({
      message: videos.length === 0 ? "Video URL:" : "Next video URL:",
      validate: isUrl,
    });
    const role = await input({
      message: 'Video role — "hero", "moment", or leave blank:',
    });
    const caption = await input({ message: "Video caption (optional):" });
    videos.push({
      src: src.trim(),
      role: role.trim() || undefined,
      caption: caption.trim() || undefined,
    });
    addMore = await confirm({ message: "Add another video?", default: false });
  }

  return videos;
}

async function collectMilestones(): Promise<SiteData["milestones"]> {
  const wantsMilestones = await confirm({
    message: "Add a milestone timeline?",
    default: false,
  });
  if (!wantsMilestones) return undefined;

  const milestones: NonNullable<SiteData["milestones"]> = [];
  let addMore = true;

  while (addMore) {
    const date = await input({
      message: "Milestone date (e.g. March 2021):",
      validate: isNonEmpty,
    });
    const title = await input({ message: "Milestone title:", validate: isNonEmpty });
    const description = await input({ message: "Milestone description (optional):" });
    milestones.push({
      date: date.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
    });
    addMore = await confirm({ message: "Add another milestone?", default: false });
  }

  return milestones;
}

async function main() {
  console.log("\n--- New VOWX order ---\n");

  // 1. Template choice
  const template = await pickTemplate();

  // 2. Customer's Telegram username/contact — internal record only, never
  // rendered on the public site.
  const telegramContact = await input({
    message: "Customer's Telegram username/contact (internal use only):",
    validate: isNonEmpty,
  });

  // 3-4. Partner names (Partner B optional — supports solo sites)
  const partnerAName = await input({ message: "Partner A name:", validate: isNonEmpty });
  const partnerBNameRaw = await input({
    message: "Partner B name (leave blank for a single-person site):",
  });
  const partnerBName = partnerBNameRaw.trim();

  // 5. Special date
  const specialDateRaw = await input({
    message: "Special date (e.g. 2026-06-14):",
    validate: isValidDate,
  });
  const specialDate = new Date(specialDateRaw.trim()).toISOString();

  // 6. Title
  const title = await input({
    message: 'Title (e.g. "3 Years of Us"):',
    validate: isNonEmpty,
  });

  // 7. Message / love letter text
  const message = await input({
    message: "Message / love letter text:",
    validate: isNonEmpty,
  });

  // 8. Hero photo URL
  const heroPhotoUrl = await input({ message: "Hero photo URL:", validate: isUrl });

  // 9. Gallery photo URLs — hero photo goes first, gallery photos follow in
  // the order they're entered, matching display order.
  const galleryPhotos = await collectGalleryPhotos();
  const photos: SitePhoto[] = [{ src: heroPhotoUrl.trim() }, ...galleryPhotos];

  // 10. Optional videos (hero / moment)
  const videos = await collectVideos();

  // 11. Optional milestones
  const milestones = await collectMilestones();

  // 12. Optional secret message
  const wantsSecretMessage = await confirm({
    message: "Add a secret message?",
    default: false,
  });
  const secretNote = wantsSecretMessage
    ? await input({ message: "Secret message:", validate: isNonEmpty })
    : undefined;

  // 13. Optional song
  const wantsSong = await confirm({ message: "Add a song?", default: false });
  let songs: SiteData["songs"];
  if (wantsSong) {
    const songUrl = await input({ message: "Song URL:", validate: isUrl });
    const songTitle = await input({ message: "Song title:", validate: isNonEmpty });
    songs = [{ url: songUrl.trim(), title: songTitle.trim() }];
  }

  const people = [
    { name: partnerAName.trim() },
    ...(partnerBName ? [{ name: partnerBName }] : []),
  ];

  const data: SiteData = {
    people,
    title: title.trim(),
    message: message.trim(),
    specialDate,
    photos,
    videos,
    milestones,
    secretNote,
    songs,
  };

  console.log("\n--- Order summary ---\n");
  console.log("Template:         ", `${template.name} (${template.componentKey})`);
  console.log("Telegram contact: ", telegramContact.trim());
  console.log("People:           ", people.map((p) => p.name).join(" & "));
  console.log("Special date:     ", specialDate);
  console.log("Title:            ", data.title);
  console.log("Message:          ", data.message);
  console.log("Photos (in order):");
  photos.forEach((photo, index) => {
    console.log(`  ${index + 1}.${index === 0 ? " (hero)" : ""}`, photo.src);
  });
  if (videos && videos.length > 0) {
    console.log("Videos:");
    videos.forEach((v, index) =>
      console.log(`  ${index + 1}.${v.role ? ` (${v.role})` : ""}`, v.src),
    );
  } else {
    console.log("Videos:           ", "(none)");
  }
  if (milestones && milestones.length > 0) {
    console.log("Milestones:");
    milestones.forEach((m, index) => console.log(`  ${index + 1}. ${m.date} — ${m.title}`));
  } else {
    console.log("Milestones:       ", "(none)");
  }
  console.log("Secret message:   ", secretNote ?? "(none)");
  console.log("Song:             ", songs ? `${songs[0].title} — ${songs[0].url}` : "(none)");
  console.log();

  // Confirm before writing anything.
  const confirmed = await confirm({
    message: "Write this order to the database?",
    default: true,
  });
  if (!confirmed) {
    console.log("Cancelled — nothing was written.");
    return;
  }

  const slug = generateSlug();
  const order = await prisma.order.create({
    data: {
      ...siteDataToOrderFields(data),
      slug,
      customerName: people.map((p) => p.name).join(" & "),
      // No email is collected for Telegram-based orders — the Telegram
      // contact is the closest match to this required, internal-only column.
      customerEmail: telegramContact.trim(),
      template: { connect: { id: template.id } },
    },
  });

  console.log("\nOrder created:", order.slug);
  console.log("Send this link to the customer on Telegram:");
  console.log(`${SITE_URL}/site/${order.slug}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    if (error instanceof Error && error.name === "ExitPromptError") {
      console.log("\nCancelled.");
    } else {
      console.error(error);
    }
    await prisma.$disconnect();
    process.exit(1);
  });
