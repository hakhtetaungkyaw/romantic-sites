"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { TelegramIcon, TikTokIcon } from "@/components/home/icons";

const NAV_LINKS = [
  { href: "#showcase", id: "showcase", label: "Templates" },
  { href: "#how-it-works", id: "how-it-works", label: "How It Works" },
  { href: "#contact", id: "contact", label: "Contact" },
];

const TIKTOK_URL = "https://www.tiktok.com/@vowxteam";
const TELEGRAM_URL = "https://t.me/vowxteam";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    // A thin horizontal band near vertical center of the viewport — whichever
    // section is passing through it "wins," instead of every section that's
    // merely partially visible lighting up at once near scroll boundaries.
    // Each callback only reports entries that crossed a threshold since the
    // last one, not every observed section — so state has to accumulate
    // across callbacks, otherwise a section's stale "still visible" ratio
    // from an earlier batch can outrank a section that just became visible.
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId) {
          setActiveSection(bestId);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#0a0a0b]/90 backdrop-blur-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <a
          href="#top"
          className="text-lg font-bold uppercase tracking-wider text-[#f4f4f5]"
        >
          Vowx
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                activeSection === link.id
                  ? "text-[#f4f4f5]"
                  : "text-[#a1a1aa] hover:text-[#f4f4f5]"
              }`}
            >
              {link.label}
              <span
                className={`mt-0.5 block h-px rounded-full transition-colors ${
                  activeSection === link.id ? "bg-[#6366f1]" : "bg-transparent"
                }`}
              />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
          >
            <TelegramIcon size={18} />
          </a>
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
          >
            <TikTokIcon size={18} />
          </a>
          <a
            href="#contact"
            className="rounded-full bg-[#6366f1] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5457e5]"
          >
            Order Now
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="text-[#f4f4f5] md:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0b] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm transition-colors ${
                  activeSection === link.id
                    ? "text-[#f4f4f5]"
                    : "text-[#a1a1aa] hover:text-[#f4f4f5]"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
            >
              <TelegramIcon size={16} />
              Telegram
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
            >
              <TikTokIcon size={16} />
              TikTok
            </a>
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-full bg-[#6366f1] px-5 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#5457e5]"
            >
              Order Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
