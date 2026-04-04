import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ja', label: 'JA' },
  { code: 'en', label: 'EN' },
] as const;

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('ja') ? 'ja' : 'en';

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-0.5" role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          className={`
            px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-gray-900
            ${currentLang === code
              ? 'bg-gray-600 text-white'
              : 'text-gray-400 hover:text-gray-200'}
          `}
          aria-pressed={currentLang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
