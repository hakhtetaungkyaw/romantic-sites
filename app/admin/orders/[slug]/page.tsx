import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma, withRetry } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { SitePerson, SitePhoto, SiteVideo, SiteSong, SiteData } from "@/types/site";

import { DeliveryStatusBadge, PaymentStatusBadge } from "../StatusBadge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#232326] p-6 shadow-sm shadow-black/20">
      <h2 className="font-display text-lg text-white">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-0.5 text-sm text-gray-200">{children}</div>
    </div>
  );
}

function Empty() {
  return <span className="text-gray-600">—</span>;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { slug } = await params;
  const { updated } = await searchParams;

  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { slug },
      include: { template: true },
    }),
  );

  if (!order) {
    notFound();
  }

  const people = (order.people as unknown as SitePerson[] | null) ?? [];
  const photos = (order.photos as unknown as SitePhoto[] | null) ?? [];
  const videos = (order.videos as unknown as SiteVideo[] | null) ?? [];
  const songs = (order.songs as unknown as SiteSong[] | null) ?? [];
  const milestones = (order.milestones as unknown as SiteData["milestones"]) ?? [];
  const places = (order.places as unknown as SiteData["places"]) ?? [];

  return (
    <main className="min-h-screen bg-[#1a1a1a] px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/orders" className="text-sm font-medium text-[#e8916f] hover:underline">
              ← Back to orders list
            </Link>
            <h1 className="font-display mt-2 text-3xl text-white">{order.slug}</h1>
          </div>
          <div className="flex items-center gap-2">
            {order.template.componentKey === "birthday-v1" && (
              <Link
                href={`/admin/orders/${encodeURIComponent(order.slug)}/edit`}
                className="rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30"
              >
                Edit
              </Link>
            )}
            <a
              href={`/site/${encodeURIComponent(order.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[#e8916f] transition-colors hover:bg-[#d97a5f]/10"
            >
              Open live site ↗
            </a>
          </div>
        </div>

        {updated === "1" && (
          <div className="rounded-xl border border-green-500/40 bg-green-950/40 px-4 py-3 text-sm text-green-300">
            Order updated successfully.
          </div>
        )}

        <Section title="Basic info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Template">
              {order.template.name} <span className="text-gray-500">({order.template.componentKey})</span>
            </Field>
            <Field label="Category">{order.template.category}</Field>
            <Field label="Customer name">{order.customerName}</Field>
            <Field label="Customer email">{order.customerEmail}</Field>
            <Field label="Title">{order.title}</Field>
            <Field label="Group title">{order.groupTitle || <Empty />}</Field>
            <Field label="Special date">{formatDateTime(order.specialDate)}</Field>
            <Field label="People">
              {people.length > 0 ? people.map((person) => person.name).join(", ") : <Empty />}
            </Field>
          </div>
        </Section>

        <Section title="Message">
          <Field label="Main message">
            <p className="whitespace-pre-wrap">{order.message}</p>
          </Field>
          <Field label="Secret message">
            {order.secretMessage ? <p className="whitespace-pre-wrap">{order.secretMessage}</p> : <Empty />}
          </Field>
        </Section>

        <Section title="Photos">
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt={photo.caption ?? `Photo ${i + 1}`} className="h-32 w-full object-cover" />
                  {photo.caption && <p className="px-2 py-1.5 text-xs text-gray-400">{photo.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        {videos.length > 0 && (
          <Section title="Videos">
            <div className="flex flex-col gap-2">
              {videos.map((video, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <a href={video.src} target="_blank" rel="noreferrer" className="text-[#e8916f] hover:underline">
                    {video.caption || video.src}
                  </a>
                  {video.role && <span className="ml-2 text-xs text-gray-500">({video.role})</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {songs.length > 0 && (
          <Section title="Songs">
            <div className="flex flex-col gap-2">
              {songs.map((song, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="font-medium text-gray-100">{song.title}</p>
                  <a href={song.url} target="_blank" rel="noreferrer" className="text-xs text-[#e8916f] hover:underline">
                    {song.url}
                  </a>
                </div>
              ))}
            </div>
          </Section>
        )}

        {milestones && milestones.length > 0 && (
          <Section title="Milestones">
            <div className="flex flex-col gap-2">
              {milestones.map((milestone, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="font-medium text-gray-100">
                    {milestone.title} <span className="font-normal text-gray-500">— {milestone.date}</span>
                  </p>
                  {milestone.description && <p className="mt-1 text-gray-300">{milestone.description}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {places && places.length > 0 && (
          <Section title="Places">
            <div className="flex flex-col gap-2">
              {places.map((place, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="font-medium text-gray-100">{place.name}</p>
                  <p className="text-gray-300">{place.caption}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Custom data">
          {order.customData ? (
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-100">
              {JSON.stringify(order.customData, null, 2)}
            </pre>
          ) : (
            <Empty />
          )}
        </Section>

        <Section title="Status">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Payment status">
              <PaymentStatusBadge status={order.paymentStatus} />
            </Field>
            <Field label="Delivery status">
              <DeliveryStatusBadge status={order.deliveryStatus} />
            </Field>
            <Field label="Payment proof">
              {order.paymentProofUrl ? (
                <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="text-[#e8916f] hover:underline">
                  View proof ↗
                </a>
              ) : (
                <Empty />
              )}
            </Field>
            <Field label="Access PIN">{order.accessPin || <Empty />}</Field>
            <Field label="Created">{formatDateTime(order.createdAt)}</Field>
            <Field label="Last updated">{formatDateTime(order.updatedAt)}</Field>
          </div>
        </Section>
      </div>
    </main>
  );
}
