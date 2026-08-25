"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { AnniversaryV1OrderInput } from "./anniversaryV1Order";

// ---- Shared by both app/admin/new-order/anniversary-v1/page.tsx (create)
// and app/admin/orders/[slug]/edit/page.tsx (edit) — same structural
// pattern as BirthdayV1OrderForm.tsx (this file's own conventions are
// copied deliberately: field primitives, dynamic-list add/remove handling,
// slug-availability check, dirty-tracking Cancel/Back confirm), but for
// Anniversary V1's own genuinely different field set — no
// age/cake/balloon/gift custom-data block (there is no
// AnniversaryV1CustomData type; V1 needs nothing beyond SiteData's own
// generic fields plus one flat closingLine key), a dynamic `people[]` list
// instead of a single name (Anniversary supports couples/groups via
// lib/people.ts#formatPeopleHeading), and an optional milestones list.
//
// Styling: same dark-dashboard admin chrome as BirthdayV1OrderForm.tsx
// (that file's own doc comment: this is an internal tool, not the
// customer-facing template, so it deliberately does NOT use either
// template's own warm palette wholesale) — but the interactive accent swaps
// from Birthday's #e8916f/#c05e3d/#d97a5f family to Anniversary V1's own
// #dd9a42/#b8935f (amber -> muted gold, sourced from
// ambient/GoldenSkySection.tsx's petal color and hero/SunsetHero.tsx's
// golden-hour gradient — the same #dd9a42 app/admin/_shared/NewOrderPicker.tsx
// already uses as this template's own swatch), so the picker menu item and
// the form it opens read as the same template consistently. ----

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export interface AnniversaryV1PersonEntry {
  name: string;
}

export interface AnniversaryV1PhotoEntry {
  src: string;
  caption: string;
}

export interface AnniversaryV1MilestoneEntry {
  date: string;
  title: string;
  description: string;
  photo: string;
}

export interface AnniversaryV1FormValues {
  people: AnniversaryV1PersonEntry[];
  groupTitle: string;
  title: string;
  specialDate: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  songUrl: string;
  songTitle: string;
  message: string;
  photos: AnniversaryV1PhotoEntry[];
  milestones: AnniversaryV1MilestoneEntry[];
  revealMessage: string;
  closingLine: string;
  goldenSkyCaption: string;
  goldenSkyLoveNote: string;
  goldenSkyPhoto: string;
}

export function emptyAnniversaryV1Person(): AnniversaryV1PersonEntry {
  return { name: "" };
}

export function emptyAnniversaryV1Photo(): AnniversaryV1PhotoEntry {
  return { src: "", caption: "" };
}

export function emptyAnniversaryV1Milestone(): AnniversaryV1MilestoneEntry {
  return { date: "", title: "", description: "", photo: "" };
}

/** Blank defaults for the create form. `photoCount` is a starting point
 *  only, not an enforced count — the gallery is a dynamic add/remove list.
 *  Seeds 2 people (the common case — a couple), also just a starting point. */
export function emptyAnniversaryV1FormValues(photoCount: number): AnniversaryV1FormValues {
  return {
    people: [emptyAnniversaryV1Person(), emptyAnniversaryV1Person()],
    groupTitle: "",
    title: "",
    specialDate: "",
    slug: "",
    customerName: "",
    customerEmail: "",
    songUrl: "",
    songTitle: "",
    message: "",
    photos: Array.from({ length: photoCount }, emptyAnniversaryV1Photo),
    milestones: [],
    revealMessage: "",
    closingLine: "",
    goldenSkyCaption: "",
    goldenSkyLoveNote: "",
    goldenSkyPhoto: "",
  };
}

type Errors = Record<string, string>;

// ---- Small shared field primitives — identical structure to
// BirthdayV1OrderForm.tsx's own, recolored to this template's accent. ----

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
  "mt-1.5 w-full rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#dd9a42]";
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
        {label} {required && <span className="text-[#dd9a42]">*</span>}
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
        {label} {required && <span className="text-[#dd9a42]">*</span>}
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

export interface AnniversaryV1OrderFormProps {
  mode: "create" | "edit";
  eyebrow: string;
  heading: string;
  initialValues: AnniversaryV1FormValues;
  /** Edit mode only — the order's own current slug, so keeping it unchanged
   *  never triggers an availability check against itself. */
  originalSlug?: string;
  submitLabel: string;
  pendingLabel: string;
  onCheckSlug: (slug: string) => Promise<{ available: boolean; reason?: string }>;
  onSubmit: (
    input: AnniversaryV1OrderInput,
  ) => Promise<{ ok: true; slug: string } | { ok: false; error: string }>;
  onSuccess: (slug: string) => void;
  backHref?: string;
  onCancel?: () => void;
}

export default function AnniversaryV1OrderForm({
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
}: AnniversaryV1OrderFormProps) {
  const [values, setValues] = useState<AnniversaryV1FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof AnniversaryV1FormValues>(key: K, value: AnniversaryV1FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updatePerson(index: number, value: string) {
    setValues((prev) => ({
      ...prev,
      people: prev.people.map((person, i) => (i === index ? { name: value } : person)),
    }));
  }

  function addPerson() {
    setValues((prev) => ({ ...prev, people: [...prev.people, emptyAnniversaryV1Person()] }));
  }

  // Minimum of 1 — lib/people.ts#formatPeopleHeading has nothing meaningful
  // to format with zero people, and the server action's own re-validation
  // enforces the same floor authoritatively.
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

  function updatePhoto(index: number, field: keyof AnniversaryV1PhotoEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, [field]: value } : photo)),
    }));
  }

  function addPhoto() {
    setValues((prev) => ({ ...prev, photos: [...prev.photos, emptyAnniversaryV1Photo()] }));
  }

  // Minimum of 1 — gallery/SunlitPolaroids.tsx has nothing meaningful to
  // show with zero photos, and ambient/GoldenSkySection.tsx's own accent
  // photo (photos[0]) needs at least one entry to have anything to show.
  function removePhoto(index: number) {
    setValues((prev) => {
      if (prev.photos.length <= 1) return prev;
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
    // Same re-keying rationale as BirthdayV1OrderForm.tsx's own removePhoto
    // — removing a middle entry shifts every later index down by one, so
    // every photo-* error is cleared and recomputed fresh on the next
    // validate() pass rather than re-keyed in place.
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("photo-")) delete next[key];
      });
      return next;
    });
  }

  function updateMilestone(index: number, field: keyof AnniversaryV1MilestoneEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  }

  function addMilestone() {
    setValues((prev) => ({ ...prev, milestones: [...prev.milestones, emptyAnniversaryV1Milestone()] }));
  }

  // No floor here — unlike people/photos, milestones are genuinely optional
  // (timeline/SunsetTimeline.tsx simply doesn't render with an empty list),
  // so removing the last one is allowed.
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

  // Same cheap whole-object-comparison dirty check BirthdayV1OrderForm.tsx
  // uses, for the same reasoning (single admin, one tab at a time — a full
  // dirty-tracking solution is more machinery than this internal tool needs).
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
    if (values.songUrl.trim() && !isUrl(values.songUrl)) {
      next.songUrl = "Enter a URL starting with http:// or https://.";
    }
    if (values.goldenSkyPhoto.trim() && !isUrl(values.goldenSkyPhoto)) {
      next.goldenSkyPhoto = "Enter a URL starting with http:// or https://.";
    }

    if (!values.message.trim()) next.message = "Required.";

    if (values.photos.length < 1) {
      next.photos = "At least 1 photo is required.";
    }
    values.photos.forEach((photo, i) => {
      if (!photo.src.trim()) next[`photo-${i}`] = "URL required.";
      else if (!isUrl(photo.src)) next[`photo-${i}`] = "Enter a URL starting with http:// or https://.";
    });

    values.milestones.forEach((milestone, i) => {
      if (!milestone.date.trim()) next[`milestone-date-${i}`] = "Required.";
      if (!milestone.title.trim()) next[`milestone-title-${i}`] = "Required.";
      if (milestone.photo.trim() && !isUrl(milestone.photo)) {
        next[`milestone-photo-${i}`] = "Enter a URL starting with http:// or https://.";
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
        songUrl: values.songUrl.trim(),
        songTitle: values.songTitle.trim(),
        message: values.message.trim(),
        photos: values.photos,
        milestones: values.milestones,
        revealMessage: values.revealMessage.trim(),
        closingLine: values.closingLine.trim(),
        goldenSkyCaption: values.goldenSkyCaption.trim(),
        goldenSkyLoveNote: values.goldenSkyLoveNote.trim(),
        goldenSkyPhoto: values.goldenSkyPhoto.trim(),
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
              className="text-sm font-medium text-[#dd9a42] hover:underline"
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
            'lib/people.ts formats these automatically — 1 person reads "For X", 2 read "X & Y", 3+ read "X, Y & Z". Set Group title below to override that entirely (e.g. "The Smith Family").'
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
                  className="mb-1.5 text-xs font-medium text-[#dd9a42] hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:no-underline"
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
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#dd9a42] transition-colors hover:bg-[#dd9a42]/10"
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
            label="Title (subtitle under the names)"
            value={values.title}
            onChange={(v) => update("title", v)}
            error={errors.title}
            placeholder="e.g. 3 Years of Us"
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
                Slug (URL name) <span className="text-[#dd9a42]">*</span>
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
          title="Opening section text"
          description="ambient/GoldenSkySection.tsx's own caption (below the names), love-note (beside the sunflower), and accent photo — all optional. Caption/love-note each fall back to that component's own default line if left blank; the accent photo simply doesn't render if left blank (it's independent from the Photos gallery below, not tied to any entry there)."
        >
          <TextArea
            id="goldenSkyCaption"
            label="Caption"
            value={values.goldenSkyCaption}
            onChange={(v) => update("goldenSkyCaption", v)}
            required={false}
            rows={2}
            placeholder="The sky held its breath, and so did we."
          />
          <TextArea
            id="goldenSkyLoveNote"
            label="Love note"
            value={values.goldenSkyLoveNote}
            onChange={(v) => update("goldenSkyLoveNote", v)}
            required={false}
            rows={2}
            placeholder="A sunflower turns for the sun, a butterfly finds its bloom — I was always going to find my way to you."
          />
          <TextInput
            id="goldenSkyPhoto"
            label="Accent photo URL"
            value={values.goldenSkyPhoto}
            onChange={(v) => update("goldenSkyPhoto", v)}
            error={errors.goldenSkyPhoto}
            required={false}
            placeholder="https://… (optional)"
          />
        </Section>

        <Section
          title="Song"
          description="Optional — matches audio/V1SongPlayer.tsx's own graceful degradation: leave both blank to skip the song player, or fill the URL to enable it."
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

        <Section title="Letter message" description="message/SealedLetter.tsx's own letter text, inside the wax-seal envelope.">
          <TextArea id="message" label="Message" value={values.message} onChange={(v) => update("message", v)} rows={4} error={errors.message} />
        </Section>

        <Section
          title="Photos"
          description="Shown in the full gallery (gallery/SunlitPolaroids.tsx). Paste a hosted URL for each (no upload yet). Add or remove entries as needed; at least 1 is required."
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
                    className="text-xs font-medium text-[#dd9a42] hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:no-underline"
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
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#dd9a42] transition-colors hover:bg-[#dd9a42]/10"
          >
            + Add photo
          </button>
        </Section>

        <Section
          title="Milestones"
          description="Optional — timeline/SunsetTimeline.tsx. Leave empty to skip that section entirely."
        >
          <div className="flex flex-col gap-3">
            {values.milestones.map((milestone, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Milestone {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-xs font-medium text-[#dd9a42] hover:underline"
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
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#dd9a42] transition-colors hover:bg-[#dd9a42]/10"
          >
            + Add milestone
          </button>
        </Section>

        <Section
          title="Petal Oracle reveal message"
          description="Optional — interactive/PetalOracle.tsx's reveal-card text, shown once all 7 petals are plucked. Leave blank to use that component's own default line."
        >
          <TextArea
            id="revealMessage"
            label="Reveal message"
            value={values.revealMessage}
            onChange={(v) => update("revealMessage", v)}
            required={false}
            rows={2}
          />
        </Section>

        <Section
          title="Closing line"
          description="Optional — closing/SunsetSignature.tsx's own italic line above the closing names. Only rendered when set."
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
            className="flex-1 rounded-full bg-gradient-to-b from-[#dd9a42] to-[#b8935f] py-3.5 text-base font-medium text-white shadow-lg shadow-black/40 transition-opacity disabled:opacity-60"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </main>
  );
}
