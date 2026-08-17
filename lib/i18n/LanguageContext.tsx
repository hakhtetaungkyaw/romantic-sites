"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { HOMEPAGE_DICTIONARIES, type HomepageDictionary, type Lang } from "@/lib/i18n/homepage";

const STORAGE_KEY = "vowx-homepage-lang";

// localStorage is the source of truth; a small listener set lets
// useSyncExternalStore re-render every subscribed component the instant the
// toggle writes a new value, without duplicating the value into React state.
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "my";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "my";
}

// The server (and first client paint, before hydration finishes) always
// sees "my" so markup matches and there's no hydration mismatch — the real
// localStorage value is only read once useSyncExternalStore re-checks after
// mount. Same pattern as FloatingHearts.tsx / countdown/Simple.tsx.
function getServerSnapshot(): Lang {
  return "my";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeStoredLang(lang: Lang) {
  window.localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((callback) => callback());
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: HomepageDictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readStoredLang, getServerSnapshot);

  const setLang = useCallback((next: Lang) => writeStoredLang(next), []);
  const toggleLang = useCallback(() => writeStoredLang(lang === "my" ? "en" : "my"), [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t: HOMEPAGE_DICTIONARIES[lang] }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
