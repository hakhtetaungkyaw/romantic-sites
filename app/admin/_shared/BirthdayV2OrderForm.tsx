"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { BirthdayV2OrderInput } from "./birthdayV2Order";
import { emptyBirthdayV2Photo } from "./birthdayV2Order";

// ---- Shared by both app/admin/new-order/birthday-v2/page.tsx (create) and
// app/admin/orders/[slug]/edit/page.tsx (edit) — same structural pattern as
// BirthdayV1OrderForm.tsx (field primitives, single-honoree `name` field —
// not Anniversary's dynamic people[] list, see birthdayV2Order.ts's own doc
// comment on BirthdayV2OrderInput.name for why — dynamic photo add/remove
// list, slug-availability check, dirty-tracking Cancel/Back confirm) — see
// birthdayV2Order.ts's own doc comment for exactly what's collected and
// why (Phase 1's entrance-sequence fields plus Phase 5a's photos field, no
// main-hub/mini-game fields yet). Styling: same dark-dashboard admin chrome as every other form here
// (internal tool, not the customer-facing "Spotlight Countdown" palette),
// with #4fbdc2 (hero/CountdownReveal.tsx's own teal spotlight accent)
// as this form's interactive color, so the picker entry and the form it
// opens read as the same template. ----

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Errors = Record<string, string>;

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
  "mt-1.5 w-full rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4fbdc2]";
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
        {label} {required && <span className="text-[#4fbdc2]">*</span>}
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
        {label} {required && <span className="text-[#4fbdc2]">*</span>}
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

export interface BirthdayV2OrderFormProps {
  mode: "create" | "edit";
  eyebrow: string;
  heading: string;
  initialValues: BirthdayV2OrderInput;
  /** Edit mode only — the order's own current slug, so keeping it unchanged
   *  never triggers an availability check against itself. */
  originalSlug?: string;
  submitLabel: string;
  pendingLabel: string;
  onCheckSlug: (slug: string) => Promise<{ available: boolean; reason?: string }>;
  onSubmit: (
    input: BirthdayV2OrderInput,
  ) => Promise<{ ok: true; slug: string } | { ok: false; error: string }>;
  onSuccess: (slug: string) => void;
  backHref?: string;
  onCancel?: () => void;
}

export default function BirthdayV2OrderForm({
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
}: BirthdayV2OrderFormProps) {
  const [values, setValues] = useState<BirthdayV2OrderInput>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof BirthdayV2OrderInput>(key: K, value: BirthdayV2OrderInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhoto(index: number, field: "src" | "caption", value: string) {
    setValues((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, [field]: value } : photo)),
    }));
  }

  function addPhoto() {
    setValues((prev) => ({ ...prev, photos: [...prev.photos, emptyBirthdayV2Photo()] }));
  }

  // Minimum of 1 — the Phase 5 gallery has nothing meaningful to show with
  // zero photos, and the server action's own re-validation enforces the
  // same floor authoritatively.
  function removePhoto(index: number) {
    setValues((prev) => {
      if (prev.photos.length <= 1) return prev;
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
    // Same re-keying reasoning every other template's own removePhoto uses:
    // shifting later indices down would leave stale errors under the wrong
    // (now-shifted) field, so clear every photo-* error and let the next
    // validate() pass recompute them against the new indices.
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("photo-")) delete next[key];
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

  // Same cheap whole-object-comparison dirty check every other admin form
  // here uses (single admin, one tab at a time).
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

    if (!values.name.trim()) next.name = "Required.";

    if (!values.title.trim()) next.title = "Required.";
    if (!values.specialDate || Number.isNaN(Date.parse(values.specialDate))) {
      next.specialDate = "Enter a valid date.";
    }
    if (!values.slug.trim()) {
      next.slug = "Required.";
    } else if (!SLUG_PATTERN.test(values.slug.trim())) {
      next.slug = "Lowercase letters, numbers, and single dashes only (e.g. maya-turns-25).";
    } else if (slugStatus === "taken") {
      next.slug = "That slug is already taken.";
    }
    if (!values.customerName.trim()) next.customerName = "Required.";
    if (values.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail.trim())) {
      next.customerEmail = "Enter a valid email, or leave blank.";
    }
    if (!values.message.trim()) next.message = "Required.";

    if (values.photos.length < 1) {
      next.photos = "At least 1 gallery photo is required.";
    }
    values.photos.forEach((photo, i) => {
      if (!photo.src.trim()) next[`photo-${i}`] = "URL required.";
      else if (!/^https?:\/\//i.test(photo.src.trim())) {
        next[`photo-${i}`] = "Enter a URL starting with http:// or https://.";
      }
    });

    if (values.galleryRepeatMultiplier.trim()) {
      const n = Number(values.galleryRepeatMultiplier);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        next.galleryRepeatMultiplier = "Enter a whole number between 1 and 5, or leave blank.";
      }
    }

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
        name: values.name.trim(),
        title: values.title.trim(),
        specialDate: values.specialDate,
        slug: values.slug.trim(),
        customerName: values.customerName.trim(),
        customerEmail: values.customerEmail.trim(),
        message: values.message.trim(),
        photos: values.photos,
        galleryRepeatMultiplier: values.galleryRepeatMultiplier.trim(),
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
              className="text-sm font-medium text-[#4fbdc2] hover:underline"
            >
              ← Back to {mode === "edit" ? "order" : "orders"}
            </Link>
          )}
          <p className={`${backHref ? "mt-2 " : ""}text-xs uppercase tracking-[0.3em] text-gray-500`}>{eyebrow}</p>
          <h1 className="font-display mt-1 text-3xl text-gray-100">{heading}</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Early build — the entrance sequence, hub, and 3D cake are live; mini-games are still placeholders. This
            form collects what those built pieces actually need.
          </p>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <Section title="Basic info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              id="name"
              label="Birthday person's name"
              value={values.name}
              onChange={(v) => update("name", v)}
              error={errors.name}
            />
            <TextInput
              id="specialDate"
              label="Birthdate"
              type="date"
              value={values.specialDate}
              onChange={(v) => update("specialDate", v)}
              error={errors.specialDate}
            />
          </div>
          <TextInput
            id="title"
            label="Main hub title (not shown yet — Phase 2)"
            value={values.title}
            onChange={(v) => update("title", v)}
            error={errors.title}
          />
          <div>
            <FieldLabel htmlFor="slug">
              Slug (URL name) <span className="text-[#4fbdc2]">*</span>
            </FieldLabel>
            <input
              id="slug"
              value={values.slug}
              onChange={(event) => {
                update("slug", event.target.value);
                setSlugStatus("idle");
              }}
              onBlur={handleSlugBlur}
              placeholder="maya-turns-25"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              id="customerName"
              label="Customer name"
              value={values.customerName}
              onChange={(v) => update("customerName", v)}
              error={errors.customerName}
            />
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
          title="Entrance sequence message"
          description="hero/CountdownReveal.tsx's own personal message — the only customizable text in the entrance sequence (the anticipation line and the Happy Birthday burst are fixed copy)."
        >
          <TextArea
            id="message"
            label="Personal message"
            value={values.message}
            onChange={(v) => update("message", v)}
            error={errors.message}
            rows={4}
          />
        </Section>

        <Section
          title="Photos"
          description="Phase 5 gallery — 6 or more photos shows the 3D sphere gallery, fewer falls back to a plain grid. Paste a hosted URL for each (no upload yet). Add or remove entries as needed; at least 1 is required."
        >
          <div className="flex flex-col gap-3">
            {values.photos.map((photo, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Gallery photo {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={values.photos.length <= 1}
                    className="text-xs font-medium text-[#4fbdc2] hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:no-underline"
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
            className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#4fbdc2] transition-colors hover:bg-[#4fbdc2]/10"
          >
            + Add photo
          </button>

          <div className="border-t border-white/10 pt-4">
            <TextInput
              id="galleryRepeatMultiplier"
              label="Gallery photo repeat"
              type="number"
              value={values.galleryRepeatMultiplier}
              onChange={(v) => update("galleryRepeatMultiplier", v)}
              error={errors.galleryRepeatMultiplier}
              required={false}
              placeholder="Auto"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Photos repeat this many times in the 3D sphere to make it feel fuller — lower this if you have many
              photos, raise it if you have few. Leave blank to auto-calculate from the photo count (1-5, whole
              numbers only).
            </p>
          </div>
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
            className="flex-1 rounded-full bg-gradient-to-b from-[#4fbdc2] to-[#2c7a80] py-3.5 text-base font-medium text-white shadow-lg shadow-black/40 transition-opacity disabled:opacity-60"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </main>
  );
}
