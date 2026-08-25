"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { AnniversaryV2OrderInput } from "./anniversaryV2Order";

// ---- Shared by both app/admin/new-order/anniversary-v2/page.tsx (create)
// and app/admin/orders/[slug]/edit/page.tsx (edit) — same structural
// pattern as AnniversaryV1OrderForm.tsx (field primitives, dynamic-list
// add/remove handling, slug-availability check, dirty-tracking Cancel/Back
// confirm), but for Anniversary V2's own genuinely different field set: a
// required hero video (no V1 equivalent), two dedicated reveal photos plus
// a dedicated reveal message (V1 has neither ConstellationGame nor
// ShootingStarWish), a places[] list (V1 has no map/route concept), and a
// typedPhrases[] list (V1 has no typewriter rotation).
//
// Styling: same dark-dashboard admin chrome as every other order form in
// this project (internal tool, not either template's own customer-facing
// palette) — accent tokens use V2's own #d4af7a/#b8935f-adjacent gold
// (sourced from ambient/NightSky.tsx's own starfield/heart-constellation
// tone — the same #d4af7a app/admin/_shared/NewOrderPicker.tsx already uses
// as this template's own swatch), distinct from both Birthday's
// #e8916f/#c05e3d and Anniversary V1's #dd9a42/#b8935f. ----

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface AnniversaryV2PersonEntry {
  name: string;
}

export interface AnniversaryV2PhotoEntry {
  src: string;
  caption: string;
}

export interface AnniversaryV2MilestoneEntry {
  date: string;
  title: string;
  description: string;
  photo: string;
}

export interface AnniversaryV2PlaceEntry {
  name: string;
  caption: string;
  x: string;
  y: string;
  photo: string;
}

export interface AnniversaryV2FormValues {
  people: AnniversaryV2PersonEntry[];
  groupTitle: string;
  title: string;
  specialDate: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  heroVideoUrl: string;
  songUrl: string;
  songTitle: string;
  message: string;
  photos: AnniversaryV2PhotoEntry[];
  constellationRevealPhoto: string;
  shootingStarWishPhoto: string;
  shootingStarWishMessage: string;
  milestones: AnniversaryV2MilestoneEntry[];
  places: AnniversaryV2PlaceEntry[];
  typedPhrases: string[];
  secretNote: string;
  closingLine: string;
  nightSkyCaption: string;
}

export function emptyAnniversaryV2Person(): AnniversaryV2PersonEntry {
  return { name: "" };
}

export function emptyAnniversaryV2Photo(): AnniversaryV2PhotoEntry {
  return { src: "", caption: "" };
}

export function emptyAnniversaryV2Milestone(): AnniversaryV2MilestoneEntry {
  return { date: "", title: "", description: "", photo: "" };
}

export function emptyAnniversaryV2Place(): AnniversaryV2PlaceEntry {
  return { name: "", caption: "", x: "", y: "", photo: "" };
}

/** Blank defaults for the create form. `photoCount` is a starting point
 *  only, not an enforced count — the gallery is a dynamic add/remove list.
 *  Seeds 2 people (the common case — a couple), also just a starting point. */
export function emptyAnniversaryV2FormValues(photoCount: number): AnniversaryV2FormValues {
  return {
    people: [emptyAnniversaryV2Person(), emptyAnniversaryV2Person()],
    groupTitle: "",
    title: "",
    specialDate: "",
    slug: "",
    customerName: "",
    customerEmail: "",
    heroVideoUrl: "",
    songUrl: "",
    songTitle: "",
    message: "",
    photos: Array.from({ length: photoCount }, emptyAnniversaryV2Photo),
    constellationRevealPhoto: "",
    shootingStarWishPhoto: "",
    shootingStarWishMessage: "",
    milestones: [],
    places: [],
    typedPhrases: [],
    secretNote: "",
    closingLine: "",
    nightSkyCaption: "",
  };
}

type Errors = Record<string, string>;

// ---- Small shared field primitives — identical structure to
// AnniversaryV1OrderForm.tsx's own, recolored to this template's accent. ----

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-100">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af7a]";
const inputErrorClass = "border-red-400 focus:ring-red-400";

function TextInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>
        {label} {required && <span className="text-[#d4af7a]">*</span>}
      </FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${inputClass} ${error ? inputErrorClass : ""}`}
      />
      <FieldError message={error} />
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  rows = 3,
  required = true,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>
        {label} {required && <span className="text-[#d4af7a]">*</span>}
      </FieldLabel>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputClass} resize-y ${error ? inputErrorClass : ""}`}
      />
      <FieldError message={error} />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#232326] p-6 shadow-sm shadow-black/20">
      <h2 className="font-display text-lg text-gray-100">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export interface AnniversaryV2OrderFormProps {
  mode: "create" | "edit";
  eyebrow: string;
  heading: string;
  initialValues: AnniversaryV2FormValues;
  /** Edit mode only — the order's own current slug, so keeping it unchanged
   *  never triggers an availability check against itself. */
  originalSlug?: string;
  submitLabel: string;
  pendingLabel: string;
  onCheckSlug: (slug: string) => Promise<{ available: boolean; reason?: string }>;
  onSubmit: (
    input: AnniversaryV2OrderInput,
  ) => Promise<{ ok: true; slug: string } | { ok: false; error: string }>;
  onSuccess: (slug: string) => void;
  backHref?: string;
  onCancel?: () => void;
}

export default function AnniversaryV2OrderForm({
  mode,
  eyebrow,
  heading,
  initialValues,
  originalSlug,
  submitLabel,
  pendingLabel,
  onCheckSlug,
  onSubmit,
  onSuccess,
  backHref,
  onCancel,
}: AnniversaryV2OrderFormProps) {
  const [values, setValues] = useState<AnniversaryV2FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof AnniversaryV2FormValues>(key: K, value: AnniversaryV2FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updatePerson(index: number, value: string) {
    setValues((prev) => ({
      ...prev,
      people: prev.people.map((person, i) => (i === index ? { name: value } : person)),
    }));
  }

  function addPerson() {
    setValues((prev) => ({ ...prev, people: [...prev.people, emptyAnniversaryV2Person()] }));
  }

  function removePerson(index: number) {
    setValues((prev) => {
      if (prev.people.length <= 1) return prev;
      return { ...prev, people: prev.people.filter((_, i) => i !== index) };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.people;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("person-")) delete next[key];
      });
      return next;
    });
  }

  function updatePhoto(index: number, field: keyof AnniversaryV2PhotoEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, [field]: value } : photo)),
    }));
  }

  function addPhoto() {
    setValues((prev) => ({ ...prev, photos: [...prev.photos, emptyAnniversaryV2Photo()] }));
  }

  function removePhoto(index: number) {
    setValues((prev) => {
      if (prev.photos.length <= 1) return prev;
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("photo-")) delete next[key];
      });
      return next;
    });
  }

  function updateMilestone(index: number, field: keyof AnniversaryV2MilestoneEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  }

  function addMilestone() {
    setValues((prev) => ({ ...prev, milestones: [...prev.milestones, emptyAnniversaryV2Milestone()] }));
  }

  function removeMilestone(index: number) {
    setValues((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("milestone-")) delete next[key];
      });
      return next;
    });
  }

  function updatePlace(index: number, field: keyof AnniversaryV2PlaceEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      places: prev.places.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  }

  function addPlace() {
    setValues((prev) => ({ ...prev, places: [...prev.places, emptyAnniversaryV2Place()] }));
  }

  function removePlace(index: number) {
    setValues((prev) => ({ ...prev, places: prev.places.filter((_, i) => i !== index) }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("place-")) delete next[key];
      });
      return next;
    });
  }

  function updatePhrase(index: number, value: string) {
    setValues((prev) => ({
      ...prev,
      typedPhrases: prev.typedPhrases.map((p, i) => (i === index ? value : p)),
    }));
  }

  function addPhrase() {
    setValues((prev) => ({ ...prev, typedPhrases: [...prev.typedPhrases, ""] }));
  }

  function removePhrase(index: number) {
    setValues((prev) => ({ ...prev, typedPhrases: prev.typedPhrases.filter((_, i) => i !== index) }));
  }

  async function handleSlugBlur() {
    const slug = values.slug.trim();
    if (!slug) return;
    if (mode === "edit" && slug === originalSlug) {
      setSlugStatus("available");
      return;
    }
    if (!SLUG_PATTERN.test(slug)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const result = await onCheckSlug(slug);
    setSlugStatus(result.available ? "available" : "taken");
  }

  function hasUnsavedChanges(): boolean {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }

  function confirmDiscardIfDirty(): boolean {
    if (!hasUnsavedChanges()) return true;
    return window.confirm("Discard unsaved changes?");
  }

  function handleCancelClick() {
    if (confirmDiscardIfDirty()) onCancel?.();
  }

  function handleBackLinkClick(event: React.MouseEvent) {
    if (!confirmDiscardIfDirty()) event.preventDefault();
  }

  function validate(): Errors {
    const next: Errors = {};

    values.people.forEach((person, i) => {
      if (!person.name.trim()) next[`person-${i}`] = "Required.";
    });
    if (values.people.length < 1) next.people = "At least 1 person is required.";

    if (!values.specialDate || Number.isNaN(Date.parse(values.specialDate))) {
      next.specialDate = "Enter a valid date.";
    }
    if (!values.slug.trim()) {
      next.slug = "Required.";
    } else if (!SLUG_PATTERN.test(values.slug.trim())) {
      next.slug = "Lowercase letters, numbers, and single dashes only (e.g. maya-and-alex-3-years).";
    } else if (slugStatus === "taken") {
      next.slug = "That slug is already taken.";
    }
    if (!values.title.trim()) next.title = "Required.";
    if (!values.customerName.trim()) next.customerName = "Required.";
    if (values.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail.trim())) {
      next.customerEmail = "Enter a valid email, or leave blank.";
    }
    if (!values.heroVideoUrl.trim()) {
      next.heroVideoUrl = "Required.";
    } else if (!isUrl(values.heroVideoUrl)) {
      next.heroVideoUrl = "Enter a URL starting with http:// or https://.";
    }
    if (values.songUrl.trim() && !isUrl(values.songUrl)) {
      next.songUrl = "Enter a URL starting with http:// or https://.";
    }

    if (!values.message.trim()) next.message = "Required.";

    if (values.photos.length < 1) {
      next.photos = "At least 1 photo is required.";
    }
    values.photos.forEach((photo, i) => {
      if (!photo.src.trim()) next[`photo-${i}`] = "URL required.";
      else if (!isUrl(photo.src)) next[`photo-${i}`] = "Enter a URL starting with http:// or https://.";
    });

    if (values.constellationRevealPhoto.trim() && !isUrl(values.constellationRevealPhoto)) {
      next.constellationRevealPhoto = "Enter a URL starting with http:// or https://.";
    }
    if (values.shootingStarWishPhoto.trim() && !isUrl(values.shootingStarWishPhoto)) {
      next.shootingStarWishPhoto = "Enter a URL starting with http:// or https://.";
    }

    values.milestones.forEach((milestone, i) => {
      if (!milestone.date.trim()) next[`milestone-date-${i}`] = "Required.";
      if (!milestone.title.trim()) next[`milestone-title-${i}`] = "Required.";
      if (milestone.photo.trim() && !isUrl(milestone.photo)) {
        next[`milestone-photo-${i}`] = "Enter a URL starting with http:// or https://.";
      }
    });

    values.places.forEach((place, i) => {
      if (!place.name.trim()) next[`place-name-${i}`] = "Required.";
      if (!place.caption.trim()) next[`place-caption-${i}`] = "Required.";
      const x = Number(place.x);
      const y = Number(place.y);
      if (place.x.trim() === "" || Number.isNaN(x) || x < 0 || x > 100) {
        next[`place-x-${i}`] = "0-100.";
      }
      if (place.y.trim() === "" || Number.isNaN(y) || y < 0 || y > 100) {
        next[`place-y-${i}`] = "0-100.";
      }
      if (place.photo.trim() && !isUrl(place.photo)) {
        next[`place-photo-${i}`] = "Enter a URL starting with http:// or https://.";
      }
    });

    return next;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorId = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        people: values.people.map((p) => ({ name: p.name.trim() })),
        groupTitle: values.groupTitle.trim(),
        title: values.title.trim(),
        specialDate: values.specialDate,
        slug: values.slug.trim(),
        customerName: values.customerName.trim(),
        customerEmail: values.customerEmail.trim(),
        heroVideoUrl: values.heroVideoUrl.trim(),
        songUrl: values.songUrl.trim(),
        songTitle: values.songTitle.trim(),
        message: values.message.trim(),
        photos: values.photos,
        constellationRevealPhoto: values.constellationRevealPhoto.trim(),
        shootingStarWishPhoto: values.shootingStarWishPhoto.trim(),
        shootingStarWishMessage: values.shootingStarWishMessage.trim(),
        milestones: values.milestones,
        places: values.places,
        typedPhrases: values.typedPhrases,
        secretNote: values.secretNote.trim(),
        closingLine: values.closingLine.trim(),
        nightSkyCaption: values.nightSkyCaption.trim(),
      });

      if (result.ok) {
        onSuccess(result.slug);
      } else {
        setSubmitError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] px-6 py-12">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          {backHref && (
            <Link
              href={backHref}
              onClick={handleBackLinkClick}
              className="text-sm font-medium text-[#d4af7a] hover:underline"
            >
              ← Back to {mode === "edit" ? "order" : "orders"}
            </Link>
          )}
          <p className={`${backHref ? "mt-2 " : ""}text-xs uppercase tracking-[0.3em] text-gray-500`}>{eyebrow}</p>
          <h1 className="font-display mt-1 text-3xl text-gray-100">{heading}</h1>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <Section
          title="People"
          description={
            'lib/people.ts formats these automatically — 1 person reads "For X", 2 read "X & Y", 3+ read "X, Y & Z". Set Group title below to override that entirely.'
          }
        >
          <div className="flex flex-col gap-3">
            {values.people.map((person, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <TextInput
                    id={`person-${i}`}
                    label={`Person ${i + 1}`}
                    value={person.name}
                    onChange={(v) => updatePerson(i, v)}
                    error={errors[`person-${i}`]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePerson(i)}
                  disabled={values.people.length <= 1}
                  className="mb-1.5 text-xs font-medium text-[#d4af7a] hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:no-underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <FieldError message={errors.people} />
          <button
            type="button"
            onClick={addPerson}
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#d4af7a] transition-colors hover:bg-[#d4af7a]/10"
          >
            + Add person
          </button>

          <TextInput
            id="groupTitle"
            label="Group title (optional override)"
            value={values.groupTitle}
            onChange={(v) => update("groupTitle", v)}
            required={false}
            placeholder='e.g. "The Smith Family" — leave blank to use the names above'
          />
        </Section>

        <Section title="Basic info">
          <TextInput
            id="title"
            label="Title (tagline under the animated name)"
            value={values.title}
            onChange={(v) => update("title", v)}
            error={errors.title}
            placeholder="e.g. Every Chapter With You"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              id="specialDate"
              label="Special date"
              type="date"
              value={values.specialDate}
              onChange={(v) => update("specialDate", v)}
              error={errors.specialDate}
            />
            <div>
              <FieldLabel htmlFor="slug">
                Slug (URL name) <span className="text-[#d4af7a]">*</span>
              </FieldLabel>
              <input
                id="slug"
                value={values.slug}
                onChange={(event) => {
                  update("slug", event.target.value);
                  setSlugStatus("idle");
                }}
                onBlur={handleSlugBlur}
                placeholder="maya-and-alex-3-years"
                className={`${inputClass} ${errors.slug ? inputErrorClass : ""}`}
              />
              <FieldError message={errors.slug} />
              {!errors.slug && slugStatus === "checking" && (
                <p className="mt-1 text-xs text-gray-500">Checking availability…</p>
              )}
              {!errors.slug && slugStatus === "available" && (
                <p className="mt-1 text-xs text-green-400">Available.</p>
              )}
              {!errors.slug && slugStatus === "taken" && (
                <p className="mt-1 text-xs text-red-400">Already taken.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput id="customerName" label="Customer name" value={values.customerName} onChange={(v) => update("customerName", v)} error={errors.customerName} />
            <TextInput
              id="customerEmail"
              label="Customer email"
              type="email"
              value={values.customerEmail}
              onChange={(v) => update("customerEmail", v)}
              error={errors.customerEmail}
              required={false}
            />
          </div>
        </Section>

        <Section
          title="Hero video"
          description="hero/CinematicVideo.tsx only renders at all once this is set — with no hero video, the opening section is entirely absent and the page starts at the countdown instead. Required."
        >
          <TextInput
            id="heroVideoUrl"
            label="Hero video URL"
            value={values.heroVideoUrl}
            onChange={(v) => update("heroVideoUrl", v)}
            error={errors.heroVideoUrl}
            placeholder="https://res.cloudinary.com/…/video.mp4"
          />
        </Section>

        <Section
          title="Song"
          description="Optional — matches interactive/SongPlayer.tsx's own graceful degradation: leave both blank to skip the song player, or fill the URL to enable it."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              id="songUrl"
              label="Song URL"
              value={values.songUrl}
              onChange={(v) => update("songUrl", v)}
              error={errors.songUrl}
              required={false}
              placeholder="https://res.cloudinary.com/…/song.mp3"
            />
            <TextInput
              id="songTitle"
              label="Song title"
              value={values.songTitle}
              onChange={(v) => update("songTitle", v)}
              required={false}
              placeholder="Our Song"
            />
          </div>
        </Section>

        <Section title="Letter message" description="message/LetterCard.tsx's own letter text.">
          <TextArea id="message" label="Message" value={values.message} onChange={(v) => update("message", v)} rows={4} error={errors.message} />
        </Section>

        <Section
          title="Photos"
          description="Shown in the full gallery (gallery/Magazine.tsx). Photo 1 is also used as hero/CinematicVideo.tsx's own poster frame — a deliberate, documented reuse (unlike Anniversary V1's earlier goldenSkyPhoto bug), not something to work around. Paste a hosted URL for each; at least 1 is required."
        >
          <div className="flex flex-col gap-3">
            {values.photos.map((photo, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Photo {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={values.photos.length <= 1}
                    className="text-xs font-medium text-[#d4af7a] hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:no-underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
                  <TextInput
                    id={`photo-${i}`}
                    label="URL"
                    value={photo.src}
                    onChange={(v) => updatePhoto(i, "src", v)}
                    error={errors[`photo-${i}`]}
                    placeholder="https://…"
                  />
                  <TextInput
                    id={`photo-caption-${i}`}
                    label="Caption"
                    value={photo.caption}
                    onChange={(v) => updatePhoto(i, "caption", v)}
                    required={false}
                  />
                </div>
              </div>
            ))}
          </div>

          <FieldError message={errors.photos} />

          <button
            type="button"
            onClick={addPhoto}
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#d4af7a] transition-colors hover:bg-[#d4af7a]/10"
          >
            + Add photo
          </button>
        </Section>

        <Section
          title="Reveal photos & message"
          description="Dedicated reveals, independent of the Photos gallery above — interactive/ConstellationGame.tsx's own photo, and interactive/ShootingStarWish.tsx's own photo + text (that message was a real prop nothing ever fed a value through before; leave blank to keep its own default line). All optional."
        >
          <TextInput
            id="constellationRevealPhoto"
            label="Constellation reveal photo URL"
            value={values.constellationRevealPhoto}
            onChange={(v) => update("constellationRevealPhoto", v)}
            error={errors.constellationRevealPhoto}
            required={false}
            placeholder="https://… (optional)"
          />
          <TextInput
            id="shootingStarWishPhoto"
            label="Shooting-star wish photo URL"
            value={values.shootingStarWishPhoto}
            onChange={(v) => update("shootingStarWishPhoto", v)}
            error={errors.shootingStarWishPhoto}
            required={false}
            placeholder="https://… (optional)"
          />
          <TextArea
            id="shootingStarWishMessage"
            label="Shooting-star wish message"
            value={values.shootingStarWishMessage}
            onChange={(v) => update("shootingStarWishMessage", v)}
            required={false}
            rows={2}
            placeholder="Somewhere among these stars, a wish for you just came true."
          />
        </Section>

        <Section
          title="Milestones"
          description="Optional — timeline/VerticalLine.tsx. Leave empty to skip that section entirely."
        >
          <div className="flex flex-col gap-3">
            {values.milestones.map((milestone, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Milestone {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-xs font-medium text-[#d4af7a] hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextInput
                    id={`milestone-date-${i}`}
                    label="Date"
                    value={milestone.date}
                    onChange={(v) => updateMilestone(i, "date", v)}
                    error={errors[`milestone-date-${i}`]}
                    placeholder="e.g. March 2021"
                  />
                  <TextInput
                    id={`milestone-title-${i}`}
                    label="Title"
                    value={milestone.title}
                    onChange={(v) => updateMilestone(i, "title", v)}
                    error={errors[`milestone-title-${i}`]}
                    placeholder="e.g. The day we met"
                  />
                </div>
                <div className="mt-3">
                  <TextArea
                    id={`milestone-description-${i}`}
                    label="Description"
                    value={milestone.description}
                    onChange={(v) => updateMilestone(i, "description", v)}
                    required={false}
                    rows={2}
                  />
                </div>
                <div className="mt-3">
                  <TextInput
                    id={`milestone-photo-${i}`}
                    label="Photo URL"
                    value={milestone.photo}
                    onChange={(v) => updateMilestone(i, "photo", v)}
                    error={errors[`milestone-photo-${i}`]}
                    required={false}
                    placeholder="https://… (optional)"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMilestone}
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#d4af7a] transition-colors hover:bg-[#d4af7a]/10"
          >
            + Add milestone
          </button>
        </Section>

        <Section
          title="Places"
          description="Optional — places/PlacesWeveBeen.tsx's own route-line map. X/Y are plain 0-100 percentage positions on that component's own abstract spline canvas (not a real map image) — there's no visual preview here, so place them by feel (0,0 is top-left; 100,100 is bottom-right). Caption is required per entry; photo is optional."
        >
          <div className="flex flex-col gap-3">
            {values.places.map((place, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Place {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removePlace(i)}
                    className="text-xs font-medium text-[#d4af7a] hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextInput
                    id={`place-name-${i}`}
                    label="Name"
                    value={place.name}
                    onChange={(v) => updatePlace(i, "name", v)}
                    error={errors[`place-name-${i}`]}
                    placeholder="e.g. Paris"
                  />
                  <TextInput
                    id={`place-caption-${i}`}
                    label="Caption"
                    value={place.caption}
                    onChange={(v) => updatePlace(i, "caption", v)}
                    error={errors[`place-caption-${i}`]}
                    placeholder="e.g. Where we got lost on purpose"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <TextInput
                    id={`place-x-${i}`}
                    label="X (0-100)"
                    type="number"
                    value={place.x}
                    onChange={(v) => updatePlace(i, "x", v)}
                    error={errors[`place-x-${i}`]}
                    placeholder="50"
                  />
                  <TextInput
                    id={`place-y-${i}`}
                    label="Y (0-100)"
                    type="number"
                    value={place.y}
                    onChange={(v) => updatePlace(i, "y", v)}
                    error={errors[`place-y-${i}`]}
                    placeholder="50"
                  />
                </div>
                <div className="mt-3">
                  <TextInput
                    id={`place-photo-${i}`}
                    label="Photo URL"
                    value={place.photo}
                    onChange={(v) => updatePlace(i, "photo", v)}
                    error={errors[`place-photo-${i}`]}
                    required={false}
                    placeholder="https://… (optional)"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPlace}
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#d4af7a] transition-colors hover:bg-[#d4af7a]/10"
          >
            + Add place
          </button>
        </Section>

        <Section
          title="Typed phrases"
          description="Optional — message/TypedPhrases.tsx's own rotating typewriter list. Leave empty to skip that section entirely."
        >
          <div className="flex flex-col gap-2">
            {values.typedPhrases.map((phrase, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    id={`phrase-${i}`}
                    value={phrase}
                    onChange={(event) => updatePhrase(i, event.target.value)}
                    placeholder="e.g. Still my favorite person"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePhrase(i)}
                  className="text-xs font-medium text-[#d4af7a] hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPhrase}
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#d4af7a] transition-colors hover:bg-[#d4af7a]/10"
          >
            + Add phrase
          </button>
        </Section>

        <Section
          title="Secret note"
          description="Optional — feeds BOTH interactive/LoveNote.tsx (hides itself entirely if this is blank) AND interactive/ConstellationGame.tsx's own reveal message (falls back to its own default line if blank)."
        >
          <TextArea
            id="secretNote"
            label="Secret note"
            value={values.secretNote}
            onChange={(v) => update("secretNote", v)}
            required={false}
            rows={3}
          />
        </Section>

        <Section
          title="Closing line"
          description="Optional — closing/Signature.tsx's own italic line above the closing names. Only rendered when set."
        >
          <TextArea
            id="closingLine"
            label="Closing line"
            value={values.closingLine}
            onChange={(v) => update("closingLine", v)}
            required={false}
            rows={2}
          />
        </Section>

        <Section
          title="Night sky caption"
          description="Optional — ambient/NightSky.tsx's own italic caption line. Leave blank to use that component's own default line."
        >
          <TextArea
            id="nightSkyCaption"
            label="Caption"
            value={values.nightSkyCaption}
            onChange={(v) => update("nightSkyCaption", v)}
            required={false}
            rows={2}
            placeholder="The sky looked like this, the night it all began."
          />
        </Section>

        <div className="mt-2 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isPending}
              className="flex-1 rounded-full border border-white/15 py-3.5 text-base font-medium text-gray-200 transition-colors hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-full bg-gradient-to-b from-[#d4af7a] to-[#b8935f] py-3.5 text-base font-medium text-white shadow-lg shadow-black/40 transition-opacity disabled:opacity-60"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </main>
  );
}
