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
    <main className="flex min-h-screen items-center justify-center bg-[#fdf6ec] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#c9a68a]/40 bg-white p-8 text-center shadow-lg shadow-[#6b4332]/10">
        {slug ? (
          <>
            <h1 className="font-display text-2xl text-[#4a2f26]">Order created</h1>
            <p className="mt-2 text-sm text-[#6b4332]/70">The Birthday V1 site is live at:</p>
            <a
              href={`${SITE_URL}/site/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block break-all rounded-lg border border-[#c9a68a]/40 bg-[#fffbf2] px-4 py-3 font-medium text-[#c05e3d] hover:underline"
            >
              {SITE_URL}/site/{slug}
            </a>
          </>
        ) : (
          <p className="text-[#4a2f26]">No order slug was provided.</p>
        )}
        <Link
          href="/admin/new-order/birthday-v1"
          className="mt-6 inline-block rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#6b4332]/20"
        >
          Create another order
        </Link>
      </div>
    </main>
  );
}
