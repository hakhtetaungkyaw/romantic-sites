import Link from "next/link";

// Same SITE_URL env-with-fallback pattern lib/scripts/createOrder.ts's own
// CLI tool already uses for its own "here's the link" printout.
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default async function BirthdayV1OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1a1a] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#232326] p-8 text-center shadow-lg shadow-black/30">
        {slug ? (
          <>
            <h1 className="font-display text-2xl text-white">Order created</h1>
            <p className="mt-2 text-sm text-gray-400">The Birthday V1 site is live at:</p>
            <a
              href={`${SITE_URL}/site/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block break-all rounded-lg border border-white/15 bg-[#1e1e21] px-4 py-3 font-medium text-[#e8916f] hover:underline"
            >
              {SITE_URL}/site/{slug}
            </a>
          </>
        ) : (
          <p className="text-gray-100">No order slug was provided.</p>
        )}
        <Link
          href="/admin/new-order/birthday-v1"
          className="mt-6 inline-block rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-black/30"
        >
          Create another order
        </Link>
      </div>
    </main>
  );
}
