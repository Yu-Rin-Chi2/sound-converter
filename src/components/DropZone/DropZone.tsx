import { useRef } from 'react';
import { useDropZone } from '../../hooks/useDropZone';

type Props = {
  onFilesAccepted: (files: File[]) => void;
};

/**
 * ファイル受付エリア。
 * ドラッグ&ドロップ + クリックによるファイル選択に対応。
 * 複数ファイル可。
 */
export const DropZone = ({ onFilesAccepted }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isDragging,
    validationErrors,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  } = useDropZone(onFilesAccepted);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="音声ファイルをドロップまたはクリックして選択"
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-48 rounded-2xl border-2 border-dashed
          cursor-pointer select-none transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${
            isDragging
              ? 'border-green-400 bg-green-900/20 scale-[1.02]'
              : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* ドラッグ中のオーバーレイ */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <span className="text-green-400 text-lg font-medium">ここにドロップ</span>
          </div>
        )}

        {!isDragging && (
          <>
            {/* 音声アイコン */}
            <div className="mb-4 w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>

            <p className="text-gray-200 text-lg font-medium mb-1">
              ファイルをドロップ、またはクリックして選択
            </p>
            <p className="text-gray-400 text-sm">
              WAV, MP3, OGG — 最大 200MB、複数ファイル対応
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg"
          multiple
          className="hidden"
          aria-hidden="true"
          onChange={handleFileInputChange}
        />
      </div>

      {/* バリデーションエラー */}
      {validationErrors.length > 0 && (
        <div
          className="mt-3 p-3 rounded-lg bg-red-900/30 border border-red-700"
          role="alert"
          aria-live="polite"
        >
          <p className="text-red-400 text-sm font-medium mb-1">追加できないファイル:</p>
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li key={`error-${index}`} className="text-red-300 text-xs">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
