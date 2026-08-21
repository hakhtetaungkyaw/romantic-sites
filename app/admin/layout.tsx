import type { Metadata } from "next";

// A single layout-level metadata export covers every route nested under
// app/admin/ (login, new-order/birthday-v1, new-order/birthday-v1/success,
// and anything added later) — same `robots: { index: false, follow: false }`
// shape app/site/[slug]/page.tsx already uses for customer sites, applied
// once here rather than per-page since app/admin/new-order/birthday-v1/
// page.tsx is itself a Client Component ("use client") and can't export
// `metadata` directly (Next.js requires that export from a Server
// Component). Paired with app/robots.ts's own `disallow: "/admin/"` rule —
// the meta tag stops indexing of pages a crawler already fetched, the
// robots.txt rule asks well-behaved crawlers not to fetch them at all;
// this project already uses both together for /site/, so /admin/ gets the
// same double coverage.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Dark-dashboard base — every admin page sets its own matching `bg-[#1a1a1a]`
// on its own <main>, but this wrapper is the one place the whole tree's dark
// theme is anchored, so a page that forgets its own background still reads
// as dark rather than flashing the light/cream customer-facing palette.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#1a1a1a] text-gray-200">{children}</div>;
}
