export const DEFAULT_LANGUAGE = 'zh-CN' as const;
export const LANGUAGE_STORAGE_KEY = 'todo-matrix:site-language';
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;

export type SiteLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(value: string | null | undefined): SiteLanguage | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'zh' || normalizedValue.startsWith('zh-')) {
    return 'zh-CN';
  }

  if (normalizedValue === 'en' || normalizedValue.startsWith('en-')) {
    return 'en-US';
  }

  return null;
}

export function readStoredLanguage(storage: Pick<Storage, 'getItem'> | null | undefined): SiteLanguage {
  return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY)) ?? DEFAULT_LANGUAGE;
}

export function storeLanguage(language: SiteLanguage, storage: Pick<Storage, 'setItem'> | null | undefined) {
  storage?.setItem(LANGUAGE_STORAGE_KEY, language);
}
