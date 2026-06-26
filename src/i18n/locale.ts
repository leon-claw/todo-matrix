export const DEFAULT_LANGUAGE = 'zh-CN' as const;
export const LANGUAGE_STORAGE_KEY = 'todo-matrix:language';
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(value: string | null | undefined): AppLanguage | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === 'zh-cn' || normalized === 'zh' || normalized.startsWith('zh-hans')) {
    return 'zh-CN';
  }

  if (normalized === 'en-us' || normalized === 'en' || normalized.startsWith('en-')) {
    return 'en-US';
  }

  return null;
}

export function readStoredLanguage(storage: Pick<Storage, 'getItem'> | null | undefined): AppLanguage {
  return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY)) ?? DEFAULT_LANGUAGE;
}

export function storeLanguage(language: AppLanguage, storage: Pick<Storage, 'setItem'> | null | undefined) {
  storage?.setItem(LANGUAGE_STORAGE_KEY, language);
}
