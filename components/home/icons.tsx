interface IconProps {
  size?: number;
  className?: string;
}

/**
 * lucide-react has no Telegram mark either — hand-drawn paper-plane outline
 * (nose, wingtip, tail, and a fold crease) in the same stroke style as the
 * icons above, standing in for the brand's send icon rather than copying it.
 */
export function TelegramIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 4 3 11.5l6.5 2.2" />
      <path d="M21 4 14.5 20l-3-6.3" />
      <path d="M9.5 13.7 21 4" />
    </svg>
  );
}

/**
 * TikTok has no lucide-react equivalent — hand-drawn silhouette (note stem +
 * head, with the curved "ear" standing in for the brand's sound-wave flourish)
 * in the same stroke style as the icons above, not a copy of the official mark.
 */
export function TikTokIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 3v10.5a3.5 3.5 0 1 1-2.5-3.36" />
      <path d="M16 3a5 5 0 0 0 5 5" />
    </svg>
  );
}

/**
 * Bootstrap Icons' "envelope" glyph (rounded rect + inner V flap) redrawn in
 * the same stroke style as the icons above, for the email contact link.
 */
export function EmailIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
