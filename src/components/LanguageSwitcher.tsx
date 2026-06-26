import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type AppLanguage, storeLanguage } from '../i18n/locale';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language) as AppLanguage;

  function handleLanguageChange(_: unknown, nextLanguage: AppLanguage | null) {
    if (!nextLanguage || nextLanguage === language) {
      return;
    }

    storeLanguage(nextLanguage, typeof window === 'undefined' ? null : window.localStorage);
    void i18n.changeLanguage(nextLanguage);
  }

  return (
    <ToggleButtonGroup
      exclusive
      aria-label={t('language.label')}
      onChange={handleLanguageChange}
      size="small"
      value={language}
    >
      <ToggleButton sx={{ cursor: 'pointer', minWidth: 36, px: 0 }} value="zh-CN">
        {t('language.chinese')}
      </ToggleButton>
      <ToggleButton sx={{ cursor: 'pointer', minWidth: 36, px: 0 }} value="en-US">
        {t('language.english')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
