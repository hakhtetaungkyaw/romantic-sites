import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/home/icons";

// TODO: replace with the real Instagram/Facebook/TikTok profile links.
const INSTAGRAM_URL = "https://instagram.com/yourhandle";
const FACEBOOK_URL = "https://facebook.com/yourhandle";
const TIKTOK_URL = "https://tiktok.com/@VOWX_PLACEHOLDER";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10 text-center sm:px-10">
      <p className="text-base font-bold uppercase tracking-wider text-[#f4f4f5]">
        Vowx
      </p>
      <p className="mt-1 text-sm text-[#a1a1aa]">Your love story, beautifully told.</p>
      <div className="mt-5 flex items-center justify-center gap-4">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <InstagramIcon size={20} />
        </a>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <FacebookIcon size={20} />
        </a>
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          className="text-[#a1a1aa] transition-colors hover:text-[#6366f1]"
        >
          <TikTokIcon size={20} />
        </a>
      </div>
      <p className="mt-6 text-xs text-[#71717a]">
        © {new Date().getFullYear()} Vowx. All rights reserved.
      </p>
    </footer>
  );
}
