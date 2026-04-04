import { useTranslation } from 'react-i18next';
import type { SpeedOptions } from '../../types/audio';

type Props = {
  options: SpeedOptions;
  onChange: (options: SpeedOptions) => void;
};

/**
 * 再生速度・ピッチ設定コントロールパネル。
 * FFmpeg.wasm が必要な機能のため、有効化した際に注意文を表示する。
 */
export const SpeedControls = ({ options, onChange }: Props) => {
  const { t } = useTranslation();

  const handleToggle = () => {
    onChange({ ...options, enabled: !options.enabled });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, rate: Number(e.target.value) });
  };

  const handlePreservePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, preservePitch: e.target.checked });
  };

  const ratePercent = Math.round(options.rate * 100);

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${options.enabled ? 'border-purple-700 bg-purple-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-200 text-sm font-semibold">
            {t('speed.title')}
            {options.enabled && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded border border-yellow-700">
                {t('speed.ffmpegBadge')}
              </span>
            )}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">{t('speed.description')}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={options.enabled}
          aria-label={t('speed.ariaLabel')}
          onClick={handleToggle}
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
            ${options.enabled ? 'bg-purple-600' : 'bg-gray-600'}
          `}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
              transition-transform duration-200
              ${options.enabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {options.enabled && (
        <div className="space-y-4">
          {/* 速度スライダー */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="speed-rate" className="text-xs text-gray-400">
                {t('speed.rateLabel')}
              </label>
              <span className="text-xs text-purple-400 font-mono">
                {t('speed.rateDisplay', { rate: options.rate.toFixed(2), percent: ratePercent })}
              </span>
            </div>
            <input
              id="speed-rate"
              type="range"
              min={0.5}
              max={4.0}
              step={0.05}
              value={options.rate}
              onChange={handleRateChange}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
              aria-valuemin={0.5}
              aria-valuemax={4.0}
              aria-valuenow={options.rate}
              aria-valuetext={t('speed.ariaValueText', { rate: options.rate })}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{t('speed.sliderMinLabel')}</span>
              <span>{t('speed.sliderMaxLabel')}</span>
            </div>
          </div>

          {/* ピッチ維持チェックボックス */}
          <div className="flex items-center gap-3">
            <input
              id="preserve-pitch"
              type="checkbox"
              checked={options.preservePitch}
              onChange={handlePreservePitchChange}
              className="
                w-4 h-4 rounded
                bg-gray-700 border-gray-600
                text-purple-500 accent-purple-500
                focus:ring-2 focus:ring-purple-500 focus:ring-offset-gray-900
                cursor-pointer
              "
            />
            <label htmlFor="preserve-pitch" className="text-sm text-gray-300 cursor-pointer select-none">
              {t('speed.preservePitch')}
              <span className="block text-xs text-gray-500 mt-0.5">
                {options.preservePitch
                  ? t('speed.preservePitchOn')
                  : t('speed.preservePitchOff')}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
