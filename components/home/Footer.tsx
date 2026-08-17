"use client";

import { EmailIcon, TelegramIcon, TikTokIcon } from "@/components/home/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// This business only runs TikTok + Telegram — Facebook/Instagram icons and
// links were removed. Same handle/URL as Nav.tsx and FinalCTA.tsx.
const TIKTOK_URL = "https://www.tiktok.com/@vowxteam";
const TELEGRAM_URL = "https://t.me/vowxteam";
const EMAIL_ADDRESS = "vowxteam@gmail.com";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/5 px-6 py-10 text-center sm:px-10">
      <p className="text-base font-bold uppercase tracking-wider text-[#f4f4f5]">
        Vowx
      </p>
      <p className="mt-1 text-sm text-[#a1a1aa]">{t.footer.tagline}</p>
      <div className="mt-5 flex items-center justify-center gap-4">
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.nav.telegramLabel}
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <TelegramIcon size={20} />
        </a>
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.nav.tiktokLabel}
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <TikTokIcon size={20} />
        </a>
        <a
          href={`mailto:${EMAIL_ADDRESS}`}
          aria-label={`${t.footer.emailLabel}: ${EMAIL_ADDRESS}`}
          title={EMAIL_ADDRESS}
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <EmailIcon size={20} />
        </a>
      </div>
      <p className="mt-6 text-xs text-[#71717a]">
        {t.footer.copyright(new Date().getFullYear())}
      </p>
    </footer>
  );
}
