/**
 * サイト共通ナビゲーションバー。
 * 他ツールへのリンクをフラットに並べ、右端に言語切替ボタンとスタジオロゴを配置する。
 * sticky top-0 でアプリヘッダーの上に常に固定表示される。
 */
import { useTranslation } from 'react-i18next';

type SiteLink = {
  labelKey: string;
  emoji: string;
  url: string;
};

type SiteLinkGroup = {
  groupKey: string;
  links: SiteLink[];
};

const SITE_LINK_GROUPS: SiteLinkGroup[] = [
  {
    groupKey: 'nav.groupTools',
    links: [
      { labelKey: 'nav.uiAssets',  emoji: '🎨', url: 'https://free-ui-assets.yurinchi2525.com/' },
      { labelKey: 'nav.gameImage', emoji: '🖼️', url: 'https://image-converter.yurinchi2525.com/' },
      { labelKey: 'nav.gameSound', emoji: '🔊', url: 'https://easy-sound-converter.yurinchi2525.com/' },
    ],
  },
  {
    groupKey: 'nav.groupUnity',
    links: [
      { labelKey: 'nav.unityAssets',  emoji: '🎮', url: 'https://assetstore.unity.com/ja-JP/publishers/101643' },
      { labelKey: 'nav.unityRanking', emoji: '🏆', url: 'https://yurinchi2525.com/playfabrankingtools/' },
    ],
  },
];

export const SiteNavBar = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="sticky top-0 z-20 bg-slate-800 dark:bg-slate-950">
      <div className="px-4 sm:px-6 h-8 flex items-center gap-1">
        <nav className="flex items-center gap-2">
          {SITE_LINK_GROUPS.map((group) => (
            <div key={group.groupKey} className="flex items-center gap-1 shrink-0">
              {group.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(link.labelKey)}
                  className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-150"
                >
                  <span className="text-sm leading-none">{link.emoji}</span>
                  <span className="hidden sm:inline text-xs text-slate-300 whitespace-nowrap">{t(link.labelKey)}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* 右: 言語切替ボタン + スタジオロゴ */}
        <div className="ml-auto flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleLanguageChange('ja')}
            aria-pressed={i18n.language === 'ja'}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-150 select-none ${
              i18n.language === 'ja' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            JA
          </button>
          <span className="text-slate-600 text-xs select-none">|</span>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            aria-pressed={i18n.language === 'en'}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-150 select-none ${
              i18n.language === 'en' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
          <a href="https://yurinchi2525.com/" target="_blank" rel="noopener noreferrer" aria-label="Yu-Rin-Chi Game Studio">
            <img src="/studio-logo.png" alt="Yu-Rin-Chi Game Studio" className="ml-2 h-6 w-6 rounded-full shrink-0 object-cover opacity-80 hover:opacity-100 transition-opacity duration-150" />
          </a>
        </div>
      </div>
    </div>
  );
};
