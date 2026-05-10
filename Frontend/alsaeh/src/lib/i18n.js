"use client";

import { useEffect, useState } from "react";

export const LANGUAGE_KEY = "site_lang";
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGES = ["en", "ar"];

export function isArabic(lang) {
  return lang === "ar";
}

export function getDirection(lang) {
  return isArabic(lang) ? "rtl" : "ltr";
}

export function normalizeLanguage(value) {
  return LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}

export function applyLanguage(lang) {
  if (typeof document === "undefined") return;

  const nextLang = normalizeLanguage(lang);
  document.documentElement.lang = nextLang;
  document.documentElement.dir = getDirection(nextLang);
}

export function setAppLanguage(lang) {
  const nextLang = normalizeLanguage(lang);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LANGUAGE_KEY, nextLang);
  }

  applyLanguage(nextLang);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("alsaeh-language-change", { detail: nextLang })
    );
  }

  return nextLang;
}

export function getSavedLanguage() {
  if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE;
  return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
}

export function useLanguage() {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE);
  const dir = getDirection(lang);

  useEffect(() => {
    const savedLang = getSavedLanguage();
    applyLanguage(savedLang);
    queueMicrotask(() => setLangState(savedLang));

    function handleLanguageChange(event) {
      const nextLang = normalizeLanguage(event.detail || getSavedLanguage());
      setLangState(nextLang);
      applyLanguage(nextLang);
    }

    function handleStorage(event) {
      if (event.key === LANGUAGE_KEY) {
        handleLanguageChange({ detail: event.newValue });
      }
    }

    window.addEventListener("alsaeh-language-change", handleLanguageChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("alsaeh-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function setLang(nextLang) {
    setLangState(setAppLanguage(nextLang));
  }

  function toggleLang() {
    setLang(isArabic(lang) ? "en" : "ar");
  }

  return { lang, dir, isAr: isArabic(lang), setLang, toggleLang };
}
