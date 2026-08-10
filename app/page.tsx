import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#1a0a12] px-6 text-center text-[#faf5f0]">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl">Romantic Sites</h1>
        <p className="text-sm text-[#faf5f0]/60">
          Template previews, built from shared demo data.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/preview/anniversary-v1"
          className="rounded-full border border-[#d4af7a]/40 px-6 py-3 text-sm transition-colors hover:border-[#d4af7a] hover:bg-[#d4af7a]/10"
        >
          Anniversary V1
        </Link>
        <Link
          href="/preview/anniversary-v2"
          className="rounded-full border border-[#d4af7a]/40 px-6 py-3 text-sm transition-colors hover:border-[#d4af7a] hover:bg-[#d4af7a]/10"
        >
          Anniversary V2
        </Link>
      </div>
    </div>
  );
}
