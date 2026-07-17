"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { dict, type Locale, type Dict } from "@/lib/dict";

type Ctx = {
  locale: Locale;
  t: Dict;
  toggle: () => void;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("uk");
  const toggle = useCallback(() => setLocale((l) => (l === "uk" ? "en" : "uk")), []);
  const value: Ctx = { locale, t: dict[locale], toggle, setLocale };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
