import en, { TranslationKeys as EnKeys } from "./en";
import ar, { TranslationKeys as ArKeys } from "./ar";

export const translations = {
  en,
  ar,
} as const;

export type LanguageCode = keyof typeof translations;
export type TranslationKeys = EnKeys & ArKeys; // Intersection of both keys

// Helper function to get translation by language
export const getTranslation = (lang: LanguageCode) => translations[lang];
