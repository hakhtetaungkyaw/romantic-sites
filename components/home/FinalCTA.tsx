import Reveal from "@/components/home/Reveal";

const CONTACT_URL = "https://t.me/vowxteam";

export default function FinalCTA() {
  return (
    <section
      id="contact"
      className="border-t border-white/5 px-6 py-24 text-center sm:px-10"
    >
      <Reveal className="mx-auto max-w-xl">
        <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
          Ready to create something beautiful?
        </h2>
        <p className="mt-4 text-[#a1a1aa]">
          Message us on Telegram with your photos and story — we&apos;ll take care
          of the rest.
        </p>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#6366f1] px-8 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#5457e5]"
        >
          Message Us on Telegram
        </a>
      </Reveal>
    </section>
  );
}
