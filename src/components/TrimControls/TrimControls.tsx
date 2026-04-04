import type { TrimOptions } from '../../types/audio';

type Props = {
  options: TrimOptions;
  onChange: (options: TrimOptions) => void;
};

/**
 * 無音検出パラメータを調整するコントロールパネル。
 */
export const TrimControls = ({ options, onChange }: Props) => {
  const handleToggle = () => {
    onChange({ ...options, enabled: !options.enabled });
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, silenceThreshold: Number(e.target.value) });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, minSilenceDuration: Number(e.target.value) });
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${options.enabled ? 'border-green-700 bg-green-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-200 text-sm font-semibold">無音トリミング</h3>
          <p className="text-gray-500 text-xs mt-0.5">先頭・末尾の無音部分を自動検出してカット</p>
        </div>

        {/* トグルスイッチ */}
        <button
          type="button"
          role="switch"
          aria-checked={options.enabled}
          aria-label="無音トリミング"
          onClick={handleToggle}
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
            ${options.enabled ? 'bg-green-600' : 'bg-gray-600'}
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

      {/* パラメータ（enabled 時のみ表示） */}
      {options.enabled && (
        <div className="space-y-4">
          {/* 無音閾値 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="silence-threshold" className="text-xs text-gray-400">
                無音閾値
              </label>
              <span className="text-xs text-green-400 font-mono">{options.silenceThreshold} dBFS</span>
            </div>
            <input
              id="silence-threshold"
              type="range"
              min={-80}
              max={-20}
              step={1}
              value={options.silenceThreshold}
              onChange={handleThresholdChange}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-green-500"
              aria-valuemin={-80}
              aria-valuemax={-20}
              aria-valuenow={options.silenceThreshold}
              aria-valuetext={`${options.silenceThreshold} dBFS`}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>-80 dBFS（敏感）</span>
              <span>-20 dBFS（鈍感）</span>
            </div>
          </div>

          {/* 最小無音継続時間 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="min-silence-duration" className="text-xs text-gray-400">
                最小無音継続時間
              </label>
              <span className="text-xs text-green-400 font-mono">{options.minSilenceDuration} ms</span>
            </div>
            <input
              id="min-silence-duration"
              type="range"
              min={10}
              max={1000}
              step={10}
              value={options.minSilenceDuration}
              onChange={handleDurationChange}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-green-500"
              aria-valuemin={10}
              aria-valuemax={1000}
              aria-valuenow={options.minSilenceDuration}
              aria-valuetext={`${options.minSilenceDuration} ミリ秒`}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10ms</span>
              <span>1000ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
