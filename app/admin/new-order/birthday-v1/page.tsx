"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { checkSlugAvailable, createBirthdayV1Order } from "./actions";

// Starting point only, not an enforced count — the gallery is now a
// dynamic add/remove list (see addPhoto/removePhoto below), matching
// interactive/MemoryFrames.tsx's own already-dynamic handling of
// `photos.length` (checked directly: its progress dots, "X / Y" counter,
// and arrow/swipe navigation all read `photos.length` live, with a
// documented MAX_DOTS=12 fallback for the dot row specifically — nothing
// there assumes exactly 6).
const DEFAULT_PHOTO_COUNT = 2;
const BALLOON_MESSAGE_COUNT = 7;
const GIFT_WHEEL_ITEM_COUNT = 7;

interface PhotoEntry {
  src: string;
  caption: string;
}

interface FormValues {
  name: string;
  age: string;
  birthdate: string;
  slug: string;
  title: string;
  customerName: string;
  customerEmail: string;
  songUrl: string;
  songTitle: string;
  message: string;
  photos: PhotoEntry[];
  balloonCompletionPhoto: string;
  cakeWishMessage: string;
  balloonMessages: string[];
  balloonCompletionMessage: string;
  giftLayerOneKeyword: string;
  giftLayerTwoPhrase: string;
  giftMessage: string;
  giftWheelItems: string[];
  giftPhoto: string;
}

function emptyPhoto(): PhotoEntry {
  return { src: "", caption: "" };
}

const initialValues: FormValues = {
  name: "",
  age: "",
  birthdate: "",
  slug: "",
  title: "",
  customerName: "",
  customerEmail: "",
  songUrl: "",
  songTitle: "",
  message: "",
  photos: Array.from({ length: DEFAULT_PHOTO_COUNT }, emptyPhoto),
  balloonCompletionPhoto: "",
  cakeWishMessage: "",
  balloonMessages: Array.from({ length: BALLOON_MESSAGE_COUNT }, () => ""),
  balloonCompletionMessage: "",
  giftLayerOneKeyword: "",
  giftLayerTwoPhrase: "",
  giftMessage: "",
  giftWheelItems: Array.from({ length: GIFT_WHEEL_ITEM_COUNT }, () => ""),
  giftPhoto: "",
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

type Errors = Record<string, string>;

// ---- Small shared field primitives — clean/functional admin styling using
// this project's own established warm palette tokens (terracotta #d97a5f,
// rose-gold #c9a68a, cream #fdf6ec/#fffbf2, deep brown #4a2f26), not a
// birthday-themed illustration pass — this is an internal tool, not a
// customer-facing template, per this task's own instruction. ----

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#4a2f26]">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#c9a68a]/50 bg-[#fffbf2] px-3 py-2 text-sm text-[#4a2f26] placeholder:text-[#6b4332]/35 focus:outline-none focus:ring-2 focus:ring-[#d97a5f]";
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
        {label} {required && <span className="text-[#c05e3d]">*</span>}
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>
        {label} {required && <span className="text-[#c05e3d]">*</span>}
      </FieldLabel>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
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
    <section className="rounded-2xl border border-[#c9a68a]/35 bg-white p-6 shadow-sm shadow-[#6b4332]/5">
      <h2 className="font-display text-lg text-[#4a2f26]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#6b4332]/70">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function NewBirthdayV1OrderPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [titleTouched, setTitleTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(next: string) {
    update("name", next);
    // Smart default per this task's own spec — auto-fills the room title
    // from the name until the admin manually edits the title field, at
    // which point it stops overwriting their own edit.
    if (!titleTouched) {
      update("title", next ? `${next}'s Celebration Room` : "");
    }
  }

  function updatePhoto(index: number, field: keyof PhotoEntry, value: string) {
    setValues((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, [field]: value } : photo)),
    }));
  }

  function addPhoto() {
    setValues((prev) => ({ ...prev, photos: [...prev.photos, emptyPhoto()] }));
  }

  // Minimum of 1 — interactive/MemoryFrames.tsx's own gallery has nothing
  // meaningful to show with zero photos, and the server action's own
  // re-validation (app/admin/new-order/birthday-v1/actions.ts) enforces
  // the same floor authoritatively.
  function removePhoto(index: number) {
    setValues((prev) => {
      if (prev.photos.length <= 1) return prev;
      return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
    });
    // Removing a middle entry shifts every later index down by one, which
    // would leave a stale error keyed to the OLD `photo-${index}` sitting
    // under the wrong (now-shifted) field, or under an index that no
    // longer exists at all — clearing every photo-* error and letting the
    // next validate() pass (on blur of a still-invalid field, or on
    // submit) recompute them against the new indices is simpler and safer
    // than trying to re-key the existing error map in place.
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photos;
      Object.keys(next).forEach((key) => {
        if (key.startsWith("photo-")) delete next[key];
      });
      return next;
    });
  }

  function updateListItem(key: "balloonMessages" | "giftWheelItems", index: number, value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? value : item)),
    }));
  }

  async function handleSlugBlur() {
    const slug = values.slug.trim();
    if (!slug) return;
    if (!SLUG_PATTERN.test(slug)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const result = await checkSlugAvailable(slug);
    setSlugStatus(result.available ? "available" : "taken");
  }

  function validate(): Errors {
    const next: Errors = {};

    if (!values.name.trim()) next.name = "Required.";
    if (values.age.trim() && (Number.isNaN(Number(values.age)) || Number(values.age) < 0)) {
      next.age = "Enter a whole number, or leave blank.";
    }
    if (!values.birthdate || Number.isNaN(Date.parse(values.birthdate))) {
      next.birthdate = "Enter a valid date.";
    }
    if (!values.slug.trim()) {
      next.slug = "Required.";
    } else if (!SLUG_PATTERN.test(values.slug.trim())) {
      next.slug = "Lowercase letters, numbers, and single dashes only (e.g. maya-turns-25).";
    } else if (slugStatus === "taken") {
      next.slug = "That slug is already taken.";
    }
    if (!values.title.trim()) next.title = "Required.";
    if (!values.customerName.trim()) next.customerName = "Required.";
    if (values.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail.trim())) {
      next.customerEmail = "Enter a valid email, or leave blank.";
    }
    // Both song fields are optional (matching
    // interactive/BirthdaySongPlayer.tsx's own established
    // graceful-degradation: no songTitle at all means it renders nothing,
    // no songUrl means it renders disabled) — only checked at all if a URL
    // was actually entered, and even then only for plausible URL shape,
    // same "not obviously malformed" bar every other URL field on this
    // form uses (photos, balloonCompletionPhoto, giftPhoto).
    if (values.songUrl.trim() && !isUrl(values.songUrl)) {
      next.songUrl = "Enter a URL starting with http:// or https://.";
    }

    if (!values.message.trim()) next.message = "Required.";

    if (values.photos.length < 1) {
      next.photos = "At least 1 gallery photo is required.";
    }
    values.photos.forEach((photo, i) => {
      if (!photo.src.trim()) next[`photo-${i}`] = "URL required.";
      else if (!isUrl(photo.src)) next[`photo-${i}`] = "Enter a URL starting with http:// or https://.";
    });

    if (!values.balloonCompletionPhoto.trim()) {
      next.balloonCompletionPhoto = "URL required.";
    } else if (!isUrl(values.balloonCompletionPhoto)) {
      next.balloonCompletionPhoto = "Enter a URL starting with http:// or https://.";
    }

    if (!values.cakeWishMessage.trim()) next.cakeWishMessage = "Required.";

    values.balloonMessages.forEach((message, i) => {
      if (!message.trim()) next[`balloon-${i}`] = "Required.";
    });
    if (!values.balloonCompletionMessage.trim()) next.balloonCompletionMessage = "Required.";

    if (!values.giftLayerOneKeyword.trim()) next.giftLayerOneKeyword = "Required.";
    if (!values.giftLayerTwoPhrase.trim()) next.giftLayerTwoPhrase = "Required.";
    if (!values.giftMessage.trim()) next.giftMessage = "Required.";
    values.giftWheelItems.forEach((item, i) => {
      if (!item.trim()) next[`wheel-${i}`] = "Required.";
    });
    if (values.giftPhoto.trim() && !isUrl(values.giftPhoto)) {
      next.giftPhoto = "Enter a URL starting with http:// or https://.";
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
      const result = await createBirthdayV1Order({
        name: values.name.trim(),
        age: values.age.trim() ? Number(values.age) : null,
        birthdate: values.birthdate,
        slug: values.slug.trim(),
        title: values.title.trim(),
        customerName: values.customerName.trim(),
        customerEmail: values.customerEmail.trim(),
        songUrl: values.songUrl.trim(),
        songTitle: values.songTitle.trim(),
        message: values.message.trim(),
        photos: values.photos,
        balloonCompletionPhoto: values.balloonCompletionPhoto.trim(),
        cakeWishMessage: values.cakeWishMessage.trim(),
        balloonMessages: values.balloonMessages,
        balloonCompletionMessage: values.balloonCompletionMessage.trim(),
        giftLayerOneKeyword: values.giftLayerOneKeyword.trim(),
        giftLayerTwoPhrase: values.giftLayerTwoPhrase.trim(),
        giftMessage: values.giftMessage.trim(),
        giftWheelItems: values.giftWheelItems,
        giftPhoto: values.giftPhoto.trim(),
      });

      if (result.ok) {
        router.push(`/admin/new-order/birthday-v1/success?slug=${encodeURIComponent(result.slug)}`);
      } else {
        setSubmitError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#fdf6ec] px-6 py-12">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#6b4332]/50">Admin · New order</p>
          <h1 className="font-display mt-1 text-3xl text-[#4a2f26]">Birthday V1 order intake</h1>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <Section title="Basic info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput id="name" label="Birthday person's name" value={values.name} onChange={handleNameChange} error={errors.name} />
            <TextInput id="age" label="Age" value={values.age} onChange={(v) => update("age", v)} error={errors.age} required={false} placeholder="e.g. 25" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput id="birthdate" label="Birthdate" type="date" value={values.birthdate} onChange={(v) => update("birthdate", v)} error={errors.birthdate} />
            <div>
              <FieldLabel htmlFor="slug">
                Slug (URL name) <span className="text-[#c05e3d]">*</span>
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
                <p className="mt-1 text-xs text-[#6b4332]/60">Checking availability…</p>
              )}
              {!errors.slug && slugStatus === "available" && (
                <p className="mt-1 text-xs text-green-700">Available.</p>
              )}
              {!errors.slug && slugStatus === "taken" && (
                <p className="mt-1 text-xs text-red-600">Already taken.</p>
              )}
            </div>
          </div>
          <TextInput
            id="title"
            label="Room title"
            value={values.title}
            onChange={(v) => {
              setTitleTouched(true);
              update("title", v);
            }}
            error={errors.title}
          />
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
          title="Song"
          description="Optional — matches interactive/BirthdaySongPlayer.tsx's own graceful degradation: leave both blank to skip the song player, or fill the URL to enable it."
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
              placeholder="Happy Birthday"
            />
          </div>
        </Section>

        <Section title="Grand Finale message">
          <TextArea id="message" label="Main message" value={values.message} onChange={(v) => update("message", v)} rows={4} error={errors.message} />
        </Section>

        <Section
          title="Photos"
          description="Photos for the Memory gallery — every one of these is shown in the Photos gallery. Paste a hosted URL for each (no upload yet). Add or remove entries as needed; at least 1 is required."
        >
          <div className="flex flex-col gap-3">
            {values.photos.map((photo, i) => (
              <div key={i} className="rounded-xl border border-[#c9a68a]/30 bg-[#fffbf2]/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b4332]/60">Gallery photo {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={values.photos.length <= 1}
                    className="text-xs font-medium text-[#c05e3d] hover:underline disabled:cursor-not-allowed disabled:text-[#6b4332]/30 disabled:hover:no-underline"
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
            className="self-start rounded-full border border-[#c9a68a]/50 px-4 py-2 text-sm font-medium text-[#c05e3d] transition-colors hover:bg-[#d97a5f]/10"
          >
            + Add photo
          </button>
        </Section>

        <Section title="Cake">
          <TextArea id="cakeWishMessage" label="Cake wish message" value={values.cakeWishMessage} onChange={(v) => update("cakeWishMessage", v)} error={errors.cakeWishMessage} />
        </Section>

        <Section title="Balloons" description="Exactly 7 messages, one per balloon.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {values.balloonMessages.map((message, i) => (
              <TextInput
                key={i}
                id={`balloon-${i}`}
                label={`Balloon ${i + 1}`}
                value={message}
                onChange={(v) => updateListItem("balloonMessages", i, v)}
                error={errors[`balloon-${i}`]}
              />
            ))}
          </div>
          {/* Deliberately styled/labeled distinctly from the gallery
              entries above (its own colored border + an explicit
              "separate from the gallery" note) so it doesn't read as just
              another gallery photo — it's interactive/BalloonReveal.tsx's
              own dedicated completion photo, never shown in the Photos
              gallery. See types/site.ts's own doc comment on
              BirthdayCustomData.balloonCompletionPhoto for the full
              reasoning. */}
          <div className="rounded-xl border-2 border-[#d97a5f]/60 bg-[#fdf0ea] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#c05e3d]">
              Balloon completion photo — separate from the gallery above, never shown in Photos
            </p>
            <div className="mt-2">
              <TextInput
                id="balloonCompletionPhoto"
                label="URL"
                value={values.balloonCompletionPhoto}
                onChange={(v) => update("balloonCompletionPhoto", v)}
                error={errors.balloonCompletionPhoto}
                placeholder="https://…"
              />
            </div>
          </div>
          <TextArea
            id="balloonCompletionMessage"
            label="Balloon completion message"
            value={values.balloonCompletionMessage}
            onChange={(v) => update("balloonCompletionMessage", v)}
            error={errors.balloonCompletionMessage}
          />
        </Section>

        <Section title="Gift">
          <TextInput id="giftLayerOneKeyword" label="Layer-one keyword" value={values.giftLayerOneKeyword} onChange={(v) => update("giftLayerOneKeyword", v)} error={errors.giftLayerOneKeyword} placeholder="e.g. Joy" />
          <TextInput id="giftLayerTwoPhrase" label="Layer-two phrase" value={values.giftLayerTwoPhrase} onChange={(v) => update("giftLayerTwoPhrase", v)} error={errors.giftLayerTwoPhrase} />
          <TextArea id="giftMessage" label="Gift message" value={values.giftMessage} onChange={(v) => update("giftMessage", v)} error={errors.giftMessage} />
          <div>
            <p className="text-sm font-medium text-[#4a2f26]">
              Wheel items (exactly 7) <span className="text-[#c05e3d]">*</span>
            </p>
            <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {values.giftWheelItems.map((item, i) => (
                <TextInput
                  key={i}
                  id={`wheel-${i}`}
                  label={`Item ${i + 1}`}
                  value={item}
                  onChange={(v) => updateListItem("giftWheelItems", i, v)}
                  error={errors[`wheel-${i}`]}
                />
              ))}
            </div>
          </div>
          {/* Not currently consumed by interactive/GiftUnwrap.tsx — its own
              reveal modal had its photo prop removed in an earlier pass
              (see this route's actions.ts for the same note). Still
              collected here for future-proofing since it's a real field on
              BirthdayCustomData. */}
          <TextInput
            id="giftPhoto"
            label="Gift photo URL (not currently shown anywhere — future-proofing only)"
            value={values.giftPhoto}
            onChange={(v) => update("giftPhoto", v)}
            error={errors.giftPhoto}
            required={false}
            placeholder="https://… (optional)"
          />
        </Section>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] py-3.5 text-base font-medium text-white shadow-lg shadow-[#6b4332]/25 transition-opacity disabled:opacity-60"
        >
          {isPending ? "Creating order…" : "Create order"}
        </button>
      </form>
    </main>
  );
}
