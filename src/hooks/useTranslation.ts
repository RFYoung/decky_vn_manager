import { useState, useCallback } from "react";
import { translations, Language } from "../locales";

export const useTranslation = (initialLanguage: Language = 'en') => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [currentLanguage]);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
  }, []);

  return {
    t,
    currentLanguage,
    setLanguage,
    availableLanguages: Object.keys(translations) as Language[]
  };
};