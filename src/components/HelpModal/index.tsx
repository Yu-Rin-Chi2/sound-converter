/**
 * 使い方ガイドモーダル。
 * ESC キー・背景クリックで閉じる。
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const HelpModal = ({ isOpen, onClose }: Props) => {
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

  const steps = [
    { title: t('help.step1Title'), body: t('help.step1Body') },
    { title: t('help.step2Title'), body: t('help.step2Body') },
    { title: t('help.step3Title'), body: t('help.step3Body') },
    { title: t('help.step4Title'), body: t('help.step4Body') },
  ];

  const glossary = [
    { term: t('help.gloss_silence_term'), desc: t('help.gloss_silence_desc') },
    { term: t('help.gloss_peak_term'),    desc: t('help.gloss_peak_desc') },
    { term: t('help.gloss_rms_term'),     desc: t('help.gloss_rms_desc') },
    { term: t('help.gloss_limiter_term'), desc: t('help.gloss_limiter_desc') },
    { term: t('help.gloss_dbfs_term'),    desc: t('help.gloss_dbfs_desc') },
    { term: t('help.gloss_pitch_term'),   desc: t('help.gloss_pitch_desc') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-gray-800 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
          <h2 id="help-title" className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0" aria-hidden="true">?</span>
            {t('help.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label={t('help.ariaClose')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 本文 */}
        <div className="px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed">
          {/* 概要 */}
          <p className="text-gray-400 text-xs">{t('help.intro')}</p>

          {/* ステップ */}
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-100 mb-1">{step.title}</p>
                <p className="whitespace-pre-line">{step.body}</p>
              </div>
            </div>
          ))}

          {/* 用語集 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('help.glossaryTitle')}</p>
            <div className="space-y-2">
              {glossary.map((item) => (
                <div key={item.term} className="rounded-lg bg-gray-700/50 px-3 py-2">
                  <span className="text-xs font-mono font-semibold text-green-300">{item.term}</span>
                  <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ブラウザ完結の注記 */}
          <div className="flex items-start gap-2 rounded-lg bg-green-900/20 border border-green-800 px-4 py-3 text-xs text-green-300">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('help.note')}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:opacity-90 transition-opacity"
          >
            {t('help.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
