import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { readStoredLanguage } from './locale';

export function LanguageBootstrap() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storedLanguage = readStoredLanguage(typeof window === 'undefined' ? null : window.localStorage);
    if (i18n.language !== storedLanguage) {
      void i18n.changeLanguage(storedLanguage);
    }
  }, [i18n]);

  return null;
}
