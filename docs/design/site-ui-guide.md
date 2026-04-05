# Yu-Rin-Chi サービス共通UI 再利用ガイド

このドキュメントは、Easy Image Converter のヘッダー・フッター・ナビゲーション等の共通UIを、
他のプロジェクトでそのまま再現するためのコピペガイドです。

---

## 目次

1. [前提条件・技術スタック](#1-前提条件技術スタック)
2. [プロジェクトセットアップ](#2-プロジェクトセットアップ)
3. [CSSテーマ設定](#3-cssテーマ設定)
4. [i18n システム](#4-i18n-システム)
5. [エントリーポイント（main.jsx）](#5-エントリーポイントmainjsx)
6. [SiteNavBar コンポーネント](#6-sitenavbar-コンポーネント)
7. [アプリ Header](#7-アプリ-header)
8. [TabBar コンポーネント](#8-tabbar-コンポーネント)
9. [Footer](#9-footer)
10. [TermsModal コンポーネント](#10-termsmodal-コンポーネント)
11. [App.jsx 全体スケルトン](#11-appjsx-全体スケルトン)
12. [翻訳キー一覧（共通UI部分）](#12-翻訳キー一覧共通ui部分)

---

## 1. 前提条件・技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 |
| ビルドツール | Vite 6 |
| スタイリング | Tailwind CSS 3（UIライブラリなし） |
| 多言語対応 | カスタム実装（i18nextなどのライブラリ不要） |
| ダークモード | OS設定に自動追従（`@media prefers-color-scheme`） |
| フォント | システムフォント（外部フォント読み込みなし） |

---

## 2. プロジェクトセットアップ

### 2.1 必要なパッケージ

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.2 ファイル構成（共通UI部分）

```
src/
├── App.jsx                  ← ルートコンポーネント（header/footer含む）
├── main.jsx                 ← エントリーポイント
├── index.css                ← Tailwind + CSS変数
├── components/
│   ├── SiteNavBar.jsx       ← サービス横断ナビゲーション
│   ├── TabBar.jsx           ← タブナビゲーション（任意）
│   └── TermsModal.jsx       ← 利用規約モーダル
└── i18n/
    ├── LangContext.jsx      ← 言語管理 Context
    └── translations.js     ← 翻訳データ
```

### 2.3 vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig({
  plugins: [react()],
  base: '/',                        // Cloudflare Pages 用。pywebview exe化時は './'
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),  // フッターのバージョン表示に使用
  },
})
```

### 2.4 tailwind.config.js

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'media',    // OS設定に基づく自動ダークモード
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 3. CSSテーマ設定

**ファイル: `src/index.css`**

カスタムCSSプロパティでテーマカラーを一元管理する。
Tailwindクラスでは `bg-[var(--color-primary)]` のように参照する。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ライトモード */
    --color-bg: #f8fafc;              /* ページ背景 */
    --color-surface: #ffffff;          /* カード・パネル背景 */
    --color-border: #e2e8f0;           /* ボーダー */
    --color-text: #1e293b;             /* 本文テキスト */
    --color-text-muted: #64748b;       /* 補助テキスト */
    --color-primary: #6366f1;          /* アクセントカラー（インディゴ） */
    --color-primary-hover: #4f46e5;    /* ホバー時のアクセントカラー */
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* ダークモード */
      --color-bg: #0f172a;
      --color-surface: #1e293b;
      --color-border: #334155;
      --color-text: #f1f5f9;
      --color-text-muted: #94a3b8;
      --color-primary: #818cf8;        /* ダークでは少し明るめに */
      --color-primary-hover: #6366f1;
    }
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: ui-sans-serif, system-ui, sans-serif;  /* システムフォント */
  }

  /* フォーカスリングを全要素に統一 */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

**カラーパレット早見表**

| 変数名 | ライト | ダーク | 用途 |
|--------|--------|--------|------|
| `--color-bg` | `#f8fafc` | `#0f172a` | ページ背景 |
| `--color-surface` | `#ffffff` | `#1e293b` | カード・パネル |
| `--color-border` | `#e2e8f0` | `#334155` | ボーダー |
| `--color-text` | `#1e293b` | `#f1f5f9` | 本文 |
| `--color-text-muted` | `#64748b` | `#94a3b8` | 補助テキスト |
| `--color-primary` | `#6366f1` | `#818cf8` | ボタン・アクセント |
| `--color-primary-hover` | `#4f46e5` | `#6366f1` | ボタンホバー |

---

## 4. i18n システム

日英切り替えに対応したカスタム実装。外部ライブラリ不要。

### 4.1 LangContext.jsx

**ファイル: `src/i18n/LangContext.jsx`**

```jsx
/**
 * LangContext
 * 日英バイリンガル対応のための React Context + useT フック
 */
import { createContext, useCallback, useContext, useState } from 'react';
import translations from './translations.js';

/** @typedef {'ja'|'en'} Lang */

/**
 * ブラウザ言語設定または localStorage から初期言語を検出する
 * @returns {Lang}
 */
function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved === 'ja' || saved === 'en') return saved;
  return navigator.language?.startsWith('ja') ? 'ja' : 'en';
}

/** @type {React.Context<{lang: Lang, setLang: (lang: Lang) => void, t: (key: string, vars?: Record<string, string|number>) => string}>} */
const LangContext = createContext(null);

/**
 * LangProvider
 * アプリ全体に言語コンテキストを提供するプロバイダー
 * @param {{ children: React.ReactNode }} props
 */
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  /** 言語を変更し localStorage に保存する */
  const setLang = useCallback((newLang) => {
    localStorage.setItem('lang', newLang);
    setLangState(newLang);
  }, []);

  /**
   * 翻訳関数
   * ドット区切りキーでネストオブジェクトを辿り、{変数} を置換して返す
   * 例: t('app.copyright')  →  '© Yu-Rin-Chi Game Studio 2026'
   * 例: t('download.single', { ext: 'PNG' })  →  'PNG をダウンロード'
   */
  const t = useCallback((key, vars = {}) => {
    const keys = key.split('.');

    // 指定言語で探す → フォールバック: 日本語 → キー名
    let text = keys.reduce((obj, k) => obj?.[k], translations[lang]);
    if (text === undefined) {
      text = keys.reduce((obj, k) => obj?.[k], translations['ja']);
    }
    if (typeof text !== 'string') return key;

    // {変数名} を置換
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      text,
    );
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

/**
 * useT フック
 * コンポーネントで翻訳関数と言語状態を使用するためのフック
 * @returns {{ lang: Lang, setLang: (lang: Lang) => void, t: (key: string, vars?: Record<string, string|number>) => string }}
 */
export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within a LangProvider');
  return ctx;
}
```

### 4.2 translations.js（共通UI部分のテンプレート）

**ファイル: `src/i18n/translations.js`**

以下は共通UIに必要な最小構成。ツール固有のキーは別途追加する。

```js
/**
 * 翻訳データ
 * キー構造: {言語}.{セクション}.{識別子}
 * 変数プレースホルダー: {varName}
 */
const translations = {
  ja: {
    // ========== SiteNavBar のナビリンクラベル ==========
    nav: {
      groupTools:   '便利なアセット制作ツール',   // グループ名（使用しない場合は削除可）
      groupUnity:   'Unityアセット',
      uiAssets:     '著作権フリーのUI素材',
      gameImage:    'ゲーム制作用画像変換ツール',
      gameSound:    'ゲーム制作用サウンド変換ツール',
      unityAssets:  '開発効率Unityアセット',
      unityRanking: 'ランキング実装',
    },

    // ========== TabBar のタブラベル ==========
    // タブを使用する場合のみ必要
    tabs: {
      tab1:      'タブ1',    // id と labelKey は自由に変更
      tab2:      'タブ2',
      ariaLabel: 'ツール選択',
    },

    // ========== TermsModal の本文 ==========
    terms: {
      title:     '利用規約',
      close:     '閉じる',
      ariaClose: '閉じる',
      sec1Title: '1. 本ツールについて',
      sec1Body:  'ここにサービスの説明を記載します。',
      sec2Title: '2. 免責事項',
      sec2Body:  '本ツールは現状有姿で提供されます。変換・処理結果の正確性、完全性、特定目的への適合性について、いかなる保証も行いません。本ツールの使用により生じた損害について、開発者は一切の責任を負いません。',
      sec3Title: '3. 著作権・ライセンス',
      sec3Body:  '本ツールのソースコードおよびデザインの著作権は Yu-Rin-Chi Game Studio に帰属します。本ツールは React、Tailwind CSS などのオープンソースライブラリを使用しており、各ライブラリのライセンスに従い使用しています。',
      sec4Title: '4. 規約の変更',
      sec4Body:  '本規約は予告なく変更される場合があります。変更後も本ツールを使用し続けることで、変更後の規約に同意したものとみなします。',
    },

    // ========== フッター / App全体 ==========
    app: {
      copyright:   '© Yu-Rin-Chi Game Studio 2026',   // ← 年度・スタジオ名を変更
      contact:     '問い合わせ先(作者X)',
      ariaContact: 'X（Twitter）で問い合わせ',
      ariaGithub:  'GitHub リポジトリ',
      share:       'シェア',
      shareX:      'X でシェア',
      copyUrl:     'URL をコピー',
      copied:      'コピーしました',
      terms:       '利用規約',
      ariaFooter:  'フッターリンク',
      shareText:   'ここにシェア用のテキストを記載',  // ← サービスに合わせて変更
    },
  },

  en: {
    nav: {
      groupTools:   'Asset Creation Tools',
      groupUnity:   'Unity Assets',
      uiAssets:     'Free UI Assets',
      gameImage:    'Image Converter',
      gameSound:    'Sound Editor',
      unityAssets:  'Unity Assets',
      unityRanking: 'Ranking Feature',
    },
    tabs: {
      tab1:      'Tab 1',
      tab2:      'Tab 2',
      ariaLabel: 'Select tool',
    },
    terms: {
      title:     'Terms of Use',
      close:     'Close',
      ariaClose: 'Close',
      sec1Title: '1. About This Tool',
      sec1Body:  'Describe your service here.',
      sec2Title: '2. Disclaimer',
      sec2Body:  'This tool is provided "as is" without any warranty. The developer makes no guarantees regarding the accuracy, completeness, or fitness for a particular purpose of the conversion results. The developer is not liable for any damages arising from the use of this tool.',
      sec3Title: '3. Copyright & License',
      sec3Body:  'The source code and design of this tool are the property of Yu-Rin-Chi Game Studio. This tool uses open-source libraries including React and Tailwind CSS, each used in accordance with their respective licenses.',
      sec4Title: '4. Changes to Terms',
      sec4Body:  'These terms may be updated without prior notice. Continued use of this tool after any changes constitutes acceptance of the revised terms.',
    },
    app: {
      copyright:   '© Yu-Rin-Chi Game Studio 2026',
      contact:     'Contact (Author X)',
      ariaContact: 'Contact on X (Twitter)',
      ariaGithub:  'GitHub repository',
      share:       'Share',
      shareX:      'Share on X',
      copyUrl:     'Copy URL',
      copied:      'Copied!',
      terms:       'Terms of Use',
      ariaFooter:  'Footer links',
      shareText:   'Your share text here',
    },
  },
};

export default translations;
```

---

## 5. エントリーポイント（main.jsx）

**ファイル: `src/main.jsx`**

`LangProvider` でアプリ全体をラップする。

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LangProvider } from './i18n/LangContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
```

---

## 6. SiteNavBar コンポーネント

ページ最上部に固定表示されるサービス横断ナビゲーションバー。
絵文字アイコン + テキスト（テキストはモバイルで非表示）、右端に言語切り替えとスタジオロゴ。

**ファイル: `src/components/SiteNavBar.jsx`**

```jsx
/**
 * SiteNavBar コンポーネント
 * 関連サービスへのリンクをページ最上部に表示するナビゲーションバー
 * 右端に JA / EN 言語切り替えボタンを配置する
 */
import { useT } from '../i18n/LangContext.jsx';

const logo = '/studio-logo.png';   // public/ に配置するスタジオロゴ画像

/**
 * カスタマイズポイント:
 * - groupKey: 翻訳キー（translations.js の nav セクション）
 * - labelKey: 翻訳キー（リンクのテキスト）
 * - emoji: リンクの絵文字アイコン
 * - url: リンク先URL
 *
 * グループは視覚的なまとまり（現在はグループ間区切りなし、フラット表示）
 */
/** @type {{ groupKey: string, links: { labelKey: string, emoji: string, url: string }[] }[]} */
const SITE_LINK_GROUPS = [
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

export default function SiteNavBar() {
  const { t, lang, setLang } = useT();

  return (
    <div className='sticky top-0 z-20 bg-slate-800 dark:bg-slate-950'>
      <div className='px-4 sm:px-6 h-8 flex items-center gap-1'>

        {/* ナビリンク群 */}
        <nav className='flex items-center gap-2'>
          {SITE_LINK_GROUPS.map((group) => (
            <div key={group.groupKey} className='flex items-center gap-1 shrink-0'>
              {group.links.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t(link.labelKey)}
                  className='flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-150'
                >
                  {/* 絵文字: 常に表示 */}
                  <span className='text-sm leading-none'>{link.emoji}</span>
                  {/* テキスト: sm (640px) 以上で表示 */}
                  <span className='hidden sm:inline text-xs text-slate-300 whitespace-nowrap'>{t(link.labelKey)}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* 言語切り替え + スタジオロゴ（右寄せ） */}
        <div className='ml-auto flex items-center gap-0.5 shrink-0'>
          {/* JA ボタン */}
          <button
            type='button'
            onClick={() => setLang('ja')}
            aria-pressed={lang === 'ja'}
            className={[
              'text-xs px-1.5 py-0.5 rounded transition-colors duration-150 select-none',
              lang === 'ja'
                ? 'bg-white text-slate-900 font-bold'        // アクティブ
                : 'text-slate-400 hover:text-white',          // 非アクティブ
            ].join(' ')}
          >
            JA
          </button>
          <span className='text-slate-600 text-xs select-none'>|</span>
          {/* EN ボタン */}
          <button
            type='button'
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={[
              'text-xs px-1.5 py-0.5 rounded transition-colors duration-150 select-none',
              lang === 'en'
                ? 'bg-white text-slate-900 font-bold'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            EN
          </button>
          {/* スタジオロゴ: public/studio-logo.png を配置すること */}
          <a href='https://yurinchi2525.com/' target='_blank' rel='noopener noreferrer' aria-label='Yu-Rin-Chi Game Studio'>
            <img
              src={logo}
              alt='Yu-Rin-Chi Game Studio'
              className='ml-2 h-6 w-6 rounded-full shrink-0 object-cover opacity-80 hover:opacity-100 transition-opacity duration-150'
            />
          </a>
        </div>
      </div>
    </div>
  );
}
```

**必要な素材**

| ファイル | 配置場所 | 内容 |
|----------|----------|------|
| `studio-logo.png` | `public/studio-logo.png` | スタジオロゴ（正方形推奨、48px以上） |

---

## 7. アプリ Header

`App.jsx` 内に直接記述するヘッダー。`SiteNavBar` の直下に配置し、`sticky top-8` で SiteNavBar（高さ `h-8`）の下に固定される。

**抜粋: `src/App.jsx` の header 部分**

```jsx
{/* ヘッダー: SiteNavBar(h-8)の下に sticky 固定 */}
<header className='border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-8 z-10'>
  <div className='max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center'>
    <div className='flex items-center gap-2.5'>
      {/* ロゴアイコン: サービスに合わせて SVG を変更 */}
      <span aria-hidden='true' className='text-[var(--color-primary)]'>
        <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M4 16l4-4 4 4 4-8 4 8' />
          <rect x='3' y='3' width='18' height='18' rx='2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </span>
      {/* サービス名: ここを変更 */}
      <h1 className='text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
        Easy Image Converter
      </h1>
    </div>
  </div>
</header>
```

**スタイルの補足**

| クラス | 意味 |
|--------|------|
| `sticky top-8` | SiteNavBar の高さ（`h-8` = 2rem）の下に固定 |
| `z-10` | SiteNavBar（`z-20`）より下のレイヤー |
| `bg-white/80 backdrop-blur-sm` | スクロール時に後ろのコンテンツが透けて見えるすりガラス効果 |
| `max-w-5xl mx-auto` | コンテンツ最大幅 80rem、中央寄せ |

---

## 8. TabBar コンポーネント

ピル型のタブナビゲーション。アクティブタブにプライマリカラー、非アクティブは背景なし。

**ファイル: `src/components/TabBar.jsx`**

```jsx
/**
 * TabBar コンポーネント
 * ピル型タブナビゲーション
 */
import { useT } from '../i18n/LangContext.jsx';

/**
 * カスタマイズポイント:
 * - id: タブの識別子（activeTab の値と一致させる）
 * - labelKey: 翻訳キー（translations.js の tabs セクション）
 */
const TABS = [
  { id: 'tab1', labelKey: 'tabs.tab1' },
  { id: 'tab2', labelKey: 'tabs.tab2' },
  // 必要に応じてタブを追加
];

/**
 * @param {Object} props
 * @param {string} props.activeTab - 現在アクティブなタブ ID
 * @param {(id: string) => void} props.onChange - タブ変更コールバック
 */
const TabBar = ({ activeTab, onChange }) => {
  const { t } = useT();

  return (
    <div
      role='tablist'
      aria-label={t('tabs.ariaLabel')}
      className='flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800'
    >
      {TABS.map(({ id, labelKey }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            role='tab'
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            type='button'
            onClick={() => onChange(id)}
            className={[
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1',
              isActive
                ? 'bg-[var(--color-primary)] text-white shadow-sm'   // アクティブ
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',  // 非アクティブ
            ].join(' ')}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
```

**App.jsx での使用例**

```jsx
const [activeTab, setActiveTab] = useState('tab1');

// タブパネルはアンマウント切り替え（各ツールの状態をリセットする）
{activeTab === 'tab1' && <Tool1 />}
{activeTab === 'tab2' && <Tool2 />}
```

---

## 9. Footer

`App.jsx` 内に直接記述するフッター。著作権表示・X/GitHubリンク・シェア機能・利用規約ボタンを含む。

**前提: App.jsx で必要な state / ref**

```jsx
import { useState, useEffect, useRef } from 'react';

const [termsOpen, setTermsOpen] = useState(false);
const [shareOpen, setShareOpen] = useState(false);
const [copied, setCopied] = useState(false);
const shareRef = useRef(null);
const { t } = useT();

// シェアポップアップの外クリックで閉じる
useEffect(() => {
  if (!shareOpen) return;
  const handleClick = (e) => {
    if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
  };
  document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, [shareOpen]);

// URL をクリップボードにコピーする
const handleCopyUrl = async () => {
  await navigator.clipboard.writeText(window.location.href);
  setCopied(true);
  setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);  // 1.5秒後に閉じる
};
```

**抜粋: `src/App.jsx` の footer 部分**

```jsx
{/* フッター */}
<footer className='border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto'>
  <div className='max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400'>

    {/* 左: 著作権 + バージョン */}
    <span className='flex items-center gap-2'>
      <span>{t('app.copyright')}</span>
      <span className='text-slate-300 dark:text-slate-600' aria-hidden='true'>·</span>
      <span>v{__APP_VERSION__}</span>   {/* vite.config.js の define で注入 */}
    </span>

    {/* 右: リンク群 */}
    <nav className='flex items-center gap-4' aria-label={t('app.ariaFooter')}>

      {/* X（Twitter）リンク ← URLを変更 */}
      <a
        href='https://x.com/mitakamikata'
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
        aria-label={t('app.ariaContact')}
      >
        {/* X ロゴ SVG */}
        <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
          <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
        </svg>
        {t('app.contact')}
      </a>

      {/* GitHub リンク ← URLを変更 */}
      <a
        href='https://github.com/Yu-Rin-Chi2/image-converter'
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
        aria-label={t('app.ariaGithub')}
      >
        {/* GitHub ロゴ SVG */}
        <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
          <path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
        </svg>
        GitHub
      </a>

      {/* シェアボタン（ドロップダウン） */}
      <div className='relative' ref={shareRef}>
        <button
          onClick={() => setShareOpen((v) => !v)}
          className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
          aria-haspopup='true'
          aria-expanded={shareOpen}
        >
          {/* シェアアイコン SVG */}
          <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
          </svg>
          {t('app.share')}
        </button>

        {/* シェアポップアップ */}
        {shareOpen && (
          <div className='absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden'>
            {/* X でシェア */}
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t('app.shareText'))}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              onClick={() => setShareOpen(false)}
            >
              <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
              </svg>
              {t('app.shareX')}
            </a>
            {/* URL コピー */}
            <button
              onClick={handleCopyUrl}
              className='w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
            >
              {copied ? (
                <>
                  <svg className='w-3.5 h-3.5 shrink-0 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                  </svg>
                  {t('app.copied')}
                </>
              ) : (
                <>
                  <svg className='w-3.5 h-3.5 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                  </svg>
                  {t('app.copyUrl')}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 利用規約ボタン */}
      <button
        onClick={() => setTermsOpen(true)}
        className='hover:underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
      >
        {t('app.terms')}
      </button>
    </nav>
  </div>
</footer>

{/* 利用規約モーダル */}
<TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
```

---

## 10. TermsModal コンポーネント

**ファイル: `src/components/TermsModal.jsx`**

```jsx
/**
 * TermsModal コンポーネント
 * 利用規約をモーダルダイアログで表示する
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
import { useEffect } from 'react';
import { useT } from '../i18n/LangContext.jsx';

const TermsModal = ({ isOpen, onClose }) => {
  const { t } = useT();

  /** ESC キーで閉じる */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* 背景オーバーレイ: クリックで閉じる */
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='terms-title'
      onClick={onClose}
    >
      {/* モーダル本体: クリックが背景に伝播しないよう stopPropagation */}
      <div
        className='relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700'
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（スクロール時も固定） */}
        <div className='sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'>
          <h2 id='terms-title' className='text-base font-bold text-slate-800 dark:text-slate-100'>
            {t('terms.title')}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors'
            aria-label={t('terms.ariaClose')}
          >
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* 本文（4セクション）: translations.js の terms セクションを編集 */}
        <div className='px-6 py-5 space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed'>
          <section>
            <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-1'>{t('terms.sec1Title')}</h3>
            <p>{t('terms.sec1Body')}</p>
          </section>
          <section>
            <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-1'>{t('terms.sec2Title')}</h3>
            <p>{t('terms.sec2Body')}</p>
          </section>
          <section>
            <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-1'>{t('terms.sec3Title')}</h3>
            <p>{t('terms.sec3Body')}</p>
          </section>
          <section>
            <h3 className='font-semibold text-slate-800 dark:text-slate-100 mb-1'>{t('terms.sec4Title')}</h3>
            <p>{t('terms.sec4Body')}</p>
          </section>
        </div>

        {/* フッター（閉じるボタン） */}
        <div className='px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity'
          >
            {t('terms.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
```

---

## 11. App.jsx 全体スケルトン

共通UIを組み合わせたコピペ用の骨格。`<YourTool />` 部分を実際のコンテンツに差し替えて使う。

**ファイル: `src/App.jsx`**

```jsx
/**
 * App コンポーネント
 * ルートコンポーネント。共通UI（SiteNavBar / Header / Footer）を組み合わせる
 */
import { useState, useEffect, useRef } from 'react';
import SiteNavBar from './components/SiteNavBar.jsx';
import TabBar from './components/TabBar.jsx';       // タブが不要なら削除
import TermsModal from './components/TermsModal.jsx';
import { useT } from './i18n/LangContext.jsx';

const App = () => {
  const [activeTab, setActiveTab] = useState('tab1');  // タブが不要なら削除
  const [termsOpen, setTermsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef(null);
  const { t } = useT();

  // ドロップゾーン外へのファイルドロップを防ぐ（ファイルドロップ機能がある場合）
  useEffect(() => {
    const prevent = (e) => { e.preventDefault(); };
    document.addEventListener('dragover', prevent);
    document.addEventListener('drop', prevent);
    return () => {
      document.removeEventListener('dragover', prevent);
      document.removeEventListener('drop', prevent);
    };
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareOpen]);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
  };

  return (
    <div className='min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]'>

      {/* ① サイトナビバー（最上部固定） */}
      <SiteNavBar />

      {/* ② アプリヘッダー（SiteNavBarの下に固定） */}
      <header className='border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-8 z-10'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center'>
          <div className='flex items-center gap-2.5'>
            <span aria-hidden='true' className='text-[var(--color-primary)]'>
              {/* ← アイコン SVG をサービスに合わせて変更 */}
              <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 16l4-4 4 4 4-8 4 8' />
                <rect x='3' y='3' width='18' height='18' rx='2' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </span>
            <h1 className='text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
              {/* ← サービス名を変更 */}
              My Service Name
            </h1>
          </div>
        </div>
      </header>

      {/* ③ メインコンテンツ */}
      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
        {/* タブナビゲーション（不要なら削除） */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* コンテンツ: タブごとにアンマウント切り替えで状態をリセット */}
        {activeTab === 'tab1' && <div>Tab 1 content</div>}
        {activeTab === 'tab2' && <div>Tab 2 content</div>}
      </main>

      {/* ④ フッター */}
      <footer className='border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400'>
          <span className='flex items-center gap-2'>
            <span>{t('app.copyright')}</span>
            <span className='text-slate-300 dark:text-slate-600' aria-hidden='true'>·</span>
            <span>v{__APP_VERSION__}</span>
          </span>
          <nav className='flex items-center gap-4' aria-label={t('app.ariaFooter')}>
            <a href='https://x.com/YOUR_ACCOUNT' target='_blank' rel='noopener noreferrer'
               className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
               aria-label={t('app.ariaContact')}>
              <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
              </svg>
              {t('app.contact')}
            </a>
            <a href='https://github.com/YOUR_REPO' target='_blank' rel='noopener noreferrer'
               className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
               aria-label={t('app.ariaGithub')}>
              <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                <path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
              </svg>
              GitHub
            </a>
            <div className='relative' ref={shareRef}>
              <button onClick={() => setShareOpen((v) => !v)}
                      className='flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
                      aria-haspopup='true' aria-expanded={shareOpen}>
                <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                </svg>
                {t('app.share')}
              </button>
              {shareOpen && (
                <div className='absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden'>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t('app.shareText'))}`}
                     target='_blank' rel='noopener noreferrer'
                     className='flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                     onClick={() => setShareOpen(false)}>
                    <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                    </svg>
                    {t('app.shareX')}
                  </a>
                  <button onClick={handleCopyUrl}
                          className='w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
                    {copied ? (
                      <><svg className='w-3.5 h-3.5 shrink-0 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>{t('app.copied')}</>
                    ) : (
                      <><svg className='w-3.5 h-3.5 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' /></svg>{t('app.copyUrl')}</>
                    )}
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setTermsOpen(true)}
                    className='hover:underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors'>
              {t('app.terms')}
            </button>
          </nav>
        </div>
      </footer>

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
};

export default App;
```

---

## 12. 翻訳キー一覧（共通UI部分）

新しいプロジェクトの `translations.js` に最低限必要なキー。

| セクション | キー | 用途 |
|-----------|------|------|
| `nav.*` | `uiAssets`, `gameImage`, ... | SiteNavBar のリンクテキスト |
| `tabs.ariaLabel` | - | TabBar の aria-label |
| `tabs.{id}` | - | TabBar の各タブラベル |
| `terms.title` | - | TermsModal タイトル |
| `terms.close` | - | 閉じるボタン |
| `terms.ariaClose` | - | 閉じるボタンの aria-label |
| `terms.sec{1-4}Title` | - | 利用規約のセクション見出し（4つ） |
| `terms.sec{1-4}Body` | - | 利用規約のセクション本文（4つ） |
| `app.copyright` | - | フッター著作権表示 |
| `app.contact` | - | X リンクのテキスト |
| `app.ariaContact` | - | X リンクの aria-label |
| `app.ariaGithub` | - | GitHub リンクの aria-label |
| `app.share` | - | シェアボタンのテキスト |
| `app.shareX` | - | X でシェアのメニューテキスト |
| `app.copyUrl` | - | URL コピーのメニューテキスト |
| `app.copied` | - | コピー完了フィードバック |
| `app.terms` | - | 利用規約ボタンのテキスト |
| `app.ariaFooter` | - | フッター nav の aria-label |
| `app.shareText` | - | X シェア時のデフォルトテキスト |

---

## カスタマイズチェックリスト

新しいプロジェクトで再利用する際に変更が必要な箇所：

- [ ] `SiteNavBar.jsx` の `SITE_LINK_GROUPS` — URL・絵文字・ラベルキー
- [ ] `public/studio-logo.png` — スタジオロゴ画像の差し替え
- [ ] `App.jsx` header の `<svg>` ロゴアイコンとサービス名 `<h1>`
- [ ] `App.jsx` footer の X リンク URL (`https://x.com/YOUR_ACCOUNT`)
- [ ] `App.jsx` footer の GitHub リンク URL
- [ ] `translations.js` の `app.copyright` — 年度・スタジオ名
- [ ] `translations.js` の `app.shareText` — シェア時のテキスト
- [ ] `translations.js` の `terms.sec1Body` — サービス概要の説明文
- [ ] `translations.js` の `nav.*` — ナビリンクラベル（リンクを変えた場合）
- [ ] `vite.config.js` の `base` — Cloudflare Pages は `/`、pywebview exe化は `./`
- [ ] `index.html` の `<title>` と `<meta name="description">`
