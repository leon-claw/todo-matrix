import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../i18n/content';
import { type SiteLanguage, storeLanguage } from '../i18n/locale';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const content = useSiteContent();
  const language = (i18n.resolvedLanguage || i18n.language) as SiteLanguage;

  function changeLanguage(nextLanguage: SiteLanguage) {
    if (nextLanguage === language) {
      return;
    }

    storeLanguage(nextLanguage, typeof window === 'undefined' ? null : window.localStorage);
    void i18n.changeLanguage(nextLanguage);
  }

  return (
    <div
      aria-label={content.ui.language.label}
      className="inline-flex items-center rounded-md border border-brand-border/60 bg-white/80 p-0.5 text-[11px] font-bold shadow-xs"
      role="group"
    >
      <button
        aria-pressed={language === 'zh-CN'}
        className={`w-8 cursor-pointer rounded px-0 py-1 text-center transition ${
          language === 'zh-CN' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'
        }`}
        onClick={() => changeLanguage('zh-CN')}
        type="button"
      >
        {content.ui.language.chinese}
      </button>
      <button
        aria-pressed={language === 'en-US'}
        className={`w-8 cursor-pointer rounded px-0 py-1 text-center transition ${
          language === 'en-US' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'
        }`}
        onClick={() => changeLanguage('en-US')}
        type="button"
      >
        {content.ui.language.english}
      </button>
    </div>
  );
}
