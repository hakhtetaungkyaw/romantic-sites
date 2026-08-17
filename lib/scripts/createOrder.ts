/**
 * Interactive Telegram-intake CLI for manually creating an Order. Run with:
 *
 *   npx tsx lib/scripts/createOrder.ts
 *
 * We take orders over a Telegram DM conversation. This walks through the
 * same fields in the same order as that conversation, so nothing gets
 * missed and data entry stays consistent between orders. It shows a summary
 * and asks for confirmation before writing anything to the database.
 *
 * Photos: the operator can paste either an already-hosted URL, a single
 * local image file path, or a local folder path (every image file inside
 * gets offered individually) — see promptSinglePhoto/promptPhotoBatch
 * below. Local files are uploaded to Cloudinary under `vowx/{order-slug}`
 * so each order's photos stay grouped; only the resulting secure_url is
 * ever stored.
 */
import fs from "node:fs";
import path from "node:path";

import "dotenv/config";

import { confirm, input, select } from "@inquirer/prompts";

import { uploadPhotoToCloudinary } from "@/lib/cloudinary";
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

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function listImageFilesInFolder(folderPath: string): string[] {
  return fs
    .readdirSync(folderPath)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => path.join(folderPath, name));
}

// Uploads one local file, letting the operator retry (network blip, wrong
// path resolved to a non-image, etc.) or skip it rather than crashing the
// whole session over one bad photo. Returns null if skipped.
async function uploadWithRetry(localPath: string, folder: string): Promise<string | null> {
  for (;;) {
    try {
      console.log(`  Uploading ${path.basename(localPath)}...`);
      const url = await uploadPhotoToCloudinary(localPath, folder);
      console.log(`  Uploaded: ${url}`);
      return url;
    } catch (error) {
      console.error(
        `  Failed to upload ${localPath}:`,
        error instanceof Error ? error.message : error,
      );
      const action = await select({
        message: "What would you like to do?",
        choices: [
          { name: "Retry this upload", value: "retry" as const },
          { name: "Skip this photo", value: "skip" as const },
        ],
      });
      if (action === "skip") return null;
    }
  }
}

async function uploadLocalPhotoWithCaption(
  filePath: string,
  folder: string,
): Promise<SitePhoto | null> {
  const url = await uploadWithRetry(filePath, folder);
  if (!url) return null;
  const caption = await input({
    message: `  Caption for ${path.basename(filePath)} (optional):`,
  });
  return { src: url, caption: caption.trim() || undefined };
}

// Hero photo is exactly one image — a URL, or a single local file (not a
// folder; that ambiguity belongs to the gallery prompt below, where
// multiple results are already expected).
async function promptSinglePhoto(message: string, folder: string): Promise<SitePhoto> {
  for (;;) {
    const raw = await input({ message, validate: isNonEmpty });
    const trimmed = raw.trim();

    if (isHttpUrl(trimmed)) {
      const caption = await input({ message: "  Caption (optional):" });
      return { src: trimmed, caption: caption.trim() || undefined };
    }

    const resolvedPath = path.resolve(trimmed);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`  Path not found: ${resolvedPath}`);
      continue;
    }
    if (fs.statSync(resolvedPath).isDirectory()) {
      console.error("  That's a folder — enter a single image file for the hero photo, or a URL.");
      continue;
    }

    const photo = await uploadLocalPhotoWithCaption(resolvedPath, folder);
    if (!photo) {
      console.log("  Upload skipped — enter a different photo for the hero image.");
      continue;
    }
    return photo;
  }
}

// Gallery entries can resolve to more than one photo at once — pasting a
// folder path offers every image file inside it, uploaded and captioned one
// by one, so the operator doesn't have to re-paste the same folder path
// per photo.
async function promptPhotoBatch(message: string, folder: string): Promise<SitePhoto[]> {
  for (;;) {
    const raw = await input({ message, validate: isNonEmpty });
    const trimmed = raw.trim();

    if (isHttpUrl(trimmed)) {
      const caption = await input({ message: "  Caption (optional):" });
      return [{ src: trimmed, caption: caption.trim() || undefined }];
    }

    const resolvedPath = path.resolve(trimmed);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`  Path not found: ${resolvedPath}`);
      continue;
    }

    const stats = fs.statSync(resolvedPath);
    const localFiles = stats.isDirectory()
      ? listImageFilesInFolder(resolvedPath)
      : [resolvedPath];

    if (localFiles.length === 0) {
      console.error(
        `  No image files found in ${resolvedPath} (looked for ${[...IMAGE_EXTENSIONS].join(", ")}).`,
      );
      continue;
    }
    if (stats.isDirectory()) {
      console.log(`  Found ${localFiles.length} image${localFiles.length === 1 ? "" : "s"} in that folder.`);
    }

    const results: SitePhoto[] = [];
    for (const filePath of localFiles) {
      const photo = await uploadLocalPhotoWithCaption(filePath, folder);
      if (photo) results.push(photo);
    }

    if (results.length === 0) {
      console.log("  Every photo from that path was skipped — try again.");
      continue;
    }

    return results;
  }
}

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

async function collectGalleryPhotos(folder: string): Promise<SitePhoto[]> {
  const photos: SitePhoto[] = [];
  let addMore = true;

  while (addMore) {
    const entries = await promptPhotoBatch(
      photos.length === 0
        ? "Gallery photo — local file path, local folder path, or URL:"
        : "Next gallery photo — local file path, local folder path, or URL:",
      folder,
    );
    photos.push(...entries);
    addMore = await confirm({ message: "Add another gallery photo (or folder)?", default: true });
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

  // Generated up front (not just before the final `prisma.order.create`,
  // like before) — the Cloudinary folder path for this order's photos
  // (`vowx/{slug}`) needs a stable identifier before any photo prompts run,
  // and reusing the same slug later keeps the order's actual DB row and its
  // uploaded photos' folder in sync.
  const slug = generateSlug();
  const cloudinaryFolder = `vowx/${slug}`;

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

  // 8. Hero photo — local file path or an already-hosted URL
  console.log(
    "\nHero photo: paste a local image file path, or an already-hosted URL.",
  );
  const heroPhoto = await promptSinglePhoto("Hero photo (path or URL):", cloudinaryFolder);

  // 9. Gallery photos — hero photo goes first, gallery photos follow in the
  // order they're entered, matching display order.
  console.log(
    "\nGallery photos: paste a local image file path, a local folder path (every image inside gets offered), or a URL.",
  );
  const galleryPhotos = await collectGalleryPhotos(cloudinaryFolder);
  const photos: SitePhoto[] = [heroPhoto, ...galleryPhotos];

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
    const label = photo.caption ? `${photo.src} — "${photo.caption}"` : photo.src;
    console.log(`  ${index + 1}.${index === 0 ? " (hero)" : ""}`, label);
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
    console.log("Cancelled — nothing was written. (Any photos already uploaded to Cloudinary remain there under", `${cloudinaryFolder}.)`);
    return;
  }

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
