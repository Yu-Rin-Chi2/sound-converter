import type { VolumeOptions } from '../../types/audio';

type Props = {
  options: VolumeOptions;
  onChange: (options: VolumeOptions) => void;
};

const MODE_LABELS: Record<VolumeOptions['mode'], string> = {
  peak: 'ピーク正規化',
  rms: 'RMS 正規化',
  limit: 'リミッター',
};

const MODE_DESCRIPTIONS: Record<VolumeOptions['mode'], string> = {
  peak: '最大振幅を指定 dBFS に合わせる',
  rms: '平均音量を揃える（複数音源の統一に最適）',
  limit: '指定 dBFS を超える箇所のみソフトクリップ',
};

/**
 * 音量の最大値・正規化モードを設定するコントロールパネル。
 */
export const VolumeControls = ({ options, onChange }: Props) => {
  const handleToggle = () => {
    onChange({ ...options, enabled: !options.enabled });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...options, mode: e.target.value as VolumeOptions['mode'] });
  };

  const handleTargetDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, targetDb: Number(e.target.value) });
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${options.enabled ? 'border-blue-700 bg-blue-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-200 text-sm font-semibold">音量調整</h3>
          <p className="text-gray-500 text-xs mt-0.5">音量の正規化・リミット処理</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={options.enabled}
          aria-label="音量調整"
          onClick={handleToggle}
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
            ${options.enabled ? 'bg-blue-600' : 'bg-gray-600'}
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
          {/* モード選択 */}
          <div>
            <label htmlFor="volume-mode" className="block text-xs text-gray-400 mb-1.5">
              モード
            </label>
            <select
              id="volume-mode"
              value={options.mode}
              onChange={handleModeChange}
              className="
                w-full px-3 py-2 rounded-lg
                bg-gray-700 border border-gray-600
                text-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                cursor-pointer
              "
            >
              {(Object.keys(MODE_LABELS) as VolumeOptions['mode'][]).map((mode) => (
                <option key={mode} value={mode}>
                  {MODE_LABELS[mode]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{MODE_DESCRIPTIONS[options.mode]}</p>
          </div>

          {/* ターゲット dBFS */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="target-db" className="text-xs text-gray-400">
                {options.mode === 'limit' ? 'クリッピング閾値' : 'ターゲット音量'}
              </label>
              <span className="text-xs text-blue-400 font-mono">{options.targetDb} dBFS</span>
            </div>
            <input
              id="target-db"
              type="range"
              min={-40}
              max={0}
              step={0.5}
              value={options.targetDb}
              onChange={handleTargetDbChange}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
              aria-valuemin={-40}
              aria-valuemax={0}
              aria-valuenow={options.targetDb}
              aria-valuetext={`${options.targetDb} dBFS`}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>-40 dBFS</span>
              <span>0 dBFS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
