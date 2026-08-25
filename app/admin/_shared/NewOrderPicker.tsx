"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Data-driven so a future template just needs a config entry here (flip
// `comingSoon: false` and set the real `href` once its create form exists)
// — no structural changes to this component. Accent colors are each
// sourced from that template's own actual current palette (not invented):
// Birthday V1's terracotta is the same tone already used throughout this
// admin section's own accent; Anniversary V1's amber comes from
// hero/SunsetHero.tsx's golden-hour gradient; Anniversary V2's gold comes
// from ambient/NightSky.tsx's own starfield tone.
export interface NewOrderTemplateOption {
  key: string;
  name: string;
  description: string;
  href: string;
  accentColor: string;
  comingSoon: boolean;
  /** A visible, always-shown caveat badge distinct from `comingSoon` — for
   *  a template that IS active/clickable but is genuinely incomplete (e.g.
   *  Birthday V2 Phase 1: only the entrance sequence is built, everything
   *  past it is a placeholder). `comingSoon` disables the link entirely;
   *  this doesn't — it just makes sure whoever opens the picker sees the
   *  caveat in the UI itself, not only in a chat transcript or commit
   *  message somewhere. */
  earlyAccessLabel?: string;
}

export const NEW_ORDER_TEMPLATES: NewOrderTemplateOption[] = [
  {
    key: "birthday-v1",
    name: "Birthday V1",
    description: "Interactive celebration room experience",
    href: "/admin/new-order/birthday-v1",
    accentColor: "#d97a5f",
    comingSoon: false,
  },
  {
    key: "anniversary-v1",
    name: "Anniversary V1",
    description: "Golden Hour Sunflower",
    href: "/admin/new-order/anniversary-v1",
    accentColor: "#dd9a42",
    comingSoon: false,
  },
  {
    key: "anniversary-v2",
    name: "Anniversary V2",
    description: "Night Sky",
    href: "/admin/new-order/anniversary-v2",
    accentColor: "#d4af7a",
    comingSoon: false,
  },
  {
    key: "birthday-v2",
    name: "Birthday V2",
    description: "Spotlight Countdown",
    href: "/admin/new-order/birthday-v2",
    accentColor: "#4fbdc2",
    comingSoon: false,
    earlyAccessLabel: "Phase 1 preview",
  },
];

export default function NewOrderPicker() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30"
      >
        + New Order
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-white/10 bg-[#232326] p-2 shadow-lg shadow-black/40"
        >
          {NEW_ORDER_TEMPLATES.map((template) => {
            const row = (
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: template.accentColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        template.comingSoon ? "text-gray-500" : "text-gray-100"
                      }`}
                    >
                      {template.name}
                    </p>
                    {template.comingSoon && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        Coming soon
                      </span>
                    )}
                    {!template.comingSoon && template.earlyAccessLabel && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
                        {template.earlyAccessLabel}
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${template.comingSoon ? "text-gray-600" : "text-gray-400"}`}>
                    {template.description}
                  </p>
                </div>
              </div>
            );

            if (template.comingSoon) {
              return (
                <div key={template.key} role="menuitem" aria-disabled="true" className="cursor-not-allowed">
                  {row}
                </div>
              );
            }

            return (
              <Link
                key={template.key}
                href={template.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-xl transition-colors hover:bg-white/5"
              >
                {row}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
