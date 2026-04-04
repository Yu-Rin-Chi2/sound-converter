/**
 * 利用規約モーダル。
 * ESC キー・背景クリックで閉じる。フォーカストラップは実装範囲外（シンプルな閉じるボタンで対応）。
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const TermsModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation();

  // ESC キーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    { title: t('terms.sec1Title'), body: t('terms.sec1Body') },
    { title: t('terms.sec2Title'), body: t('terms.sec2Body') },
    { title: t('terms.sec3Title'), body: t('terms.sec3Body') },
    { title: t('terms.sec4Title'), body: t('terms.sec4Body') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-gray-800 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
          <h2 id="terms-title" className="text-base font-bold text-gray-100">
            {t('terms.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label={t('terms.ariaClose')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 本文 */}
        <div className="px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-gray-100 mb-1">{section.title}</p>
              <p>{section.body}</p>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:opacity-90 transition-opacity"
          >
            {t('terms.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
