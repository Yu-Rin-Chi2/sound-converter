import { useRef } from 'react';
import { useWaveform } from '../../hooks/useWaveform';

type Props = {
  label: string;
  audioBlob: Blob | null;
  color?: string;
};

/**
 * 1つの波形を表示するサブコンポーネント。
 * wavesurfer.js を使ってインタラクティブな波形プレビューを描画する。
 */
const WaveformPanel = ({ label, audioBlob, color = '#4ade80' }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, duration, isPlaying, togglePlay } = useWaveform(containerRef, audioBlob, { waveColor: color });

  if (!audioBlob) return null;

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        {isReady && (
          <span className="text-xs text-gray-500">{duration.toFixed(2)}秒</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="w-full"
        aria-label={`${label}の波形`}
        style={{ '--waveform-color': color } as React.CSSProperties}
      />

      {!isReady && (
        <div className="h-20 flex items-center justify-center">
          <div className="flex gap-1 items-end" aria-label="波形読み込み中">
            {[...Array(8)].map((_, i) => (
              <div
                key={`bar-${i}`}
                className="w-1 bg-gray-600 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 0.8) * 15}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {isReady && (
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-300 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-gray-900"
            aria-label={isPlaying ? '停止' : '再生'}
          >
            {isPlaying ? (
              <>
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                停止
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                再生
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

type WaveformViewerProps = {
  originalBlob: Blob | null;
  processedBlob: Blob | null;
};

/**
 * Before/After の波形を縦に並べて比較表示するコンポーネント。
 * processedBlob がない場合は After を非表示にする。
 */
export const WaveformViewer = ({ originalBlob, processedBlob }: WaveformViewerProps) => {
  if (!originalBlob && !processedBlob) return null;

  return (
    <section aria-label="波形プレビュー" className="space-y-3">
      <h2 className="text-gray-300 text-sm font-medium">波形プレビュー</h2>

      <WaveformPanel
        label="変換前 (Before)"
        audioBlob={originalBlob}
        color="#60a5fa"
      />

      {processedBlob && (
        <WaveformPanel
          label="変換後 (After)"
          audioBlob={processedBlob}
          color="#4ade80"
        />
      )}
    </section>
  );
};
