import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { readStoredLanguage } from './locale';

export function LanguageBootstrap() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storedLanguage = readStoredLanguage(typeof window === 'undefined' ? null : window.localStorage);
    document.documentElement.lang = storedLanguage;

    if (i18n.resolvedLanguage !== storedLanguage) {
      void i18n.changeLanguage(storedLanguage);
    }
  }, [i18n]);

  useEffect(() => {
    function handleLanguageChanged(language: string) {
      document.documentElement.lang = language;
    }

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return null;
}
