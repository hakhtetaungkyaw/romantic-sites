import HeroShuffleGrid from "@/components/home/HeroShuffleGrid";
import Reveal from "@/components/home/Reveal";

export default function Hero() {
  return (
    <section id="top" className="px-6 pt-28 pb-16 sm:px-10 sm:pt-32 sm:pb-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8">
        <Reveal className="text-center md:text-left">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-[#6366f1]">
            Vowx
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#f4f4f5] sm:text-5xl md:text-6xl">
            Custom love story websites, crafted for you
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-[#a1a1aa] sm:text-lg md:mx-0">
            We turn photos and memories into a private, personalized website —
            built around your story, delivered in days.
          </p>
          <div className="mt-10 flex justify-center md:justify-start">
            <a
              href="#showcase"
              className="inline-flex items-center justify-center rounded-full bg-[#6366f1] px-8 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#5457e5]"
            >
              Browse Templates
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <HeroShuffleGrid />
        </Reveal>
      </div>
    </section>
  );
}
