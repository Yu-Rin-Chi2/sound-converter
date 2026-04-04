import { useTranslation } from 'react-i18next';
import type { AudioFile } from '../../types/audio';

type Props = {
  audioFile: AudioFile;
  onRemove: (id: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-gray-700 text-gray-300',
  processing: 'bg-blue-900/50 text-blue-300 animate-pulse',
  done: 'bg-green-900/50 text-green-300',
  error: 'bg-red-900/50 text-red-300',
};

/**
 * ファイル一覧の1行。ステータスバッジ・処理結果・ダウンロードボタンを表示。
 */
export const FileListItem = ({ audioFile, onRemove }: Props) => {
  const { t } = useTranslation();
  const { id, file, status, processResult, errorMessage } = audioFile;

  const STATUS_LABELS: Record<string, string> = {
    idle: t('fileItem.statusIdle'),
    processing: t('fileItem.statusProcessing'),
    done: t('fileItem.statusDone'),
    error: t('fileItem.statusError'),
  };

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    if (mins > 0) return `${mins}:${secs.padStart(4, '0')}`;
    return t('fileItem.seconds', { value: secs });
  }

  function formatMs(ms: number): string {
    if (ms < 1000) return t('fileItem.milliseconds', { value: Math.round(ms) });
    return t('fileItem.seconds', { value: (ms / 1000).toFixed(2) });
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700 transition-all duration-200 hover:border-gray-600">
      {/* ファイル情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {/* ファイルアイコン */}
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
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

          <span className="text-gray-100 text-sm font-medium truncate" title={file.name}>
            {file.name}
          </span>

          <span
            className={`
              flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
              ${STATUS_COLORS[status]}
            `}
            aria-label={t('fileItem.statusAriaLabel', { status: STATUS_LABELS[status] })}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{formatFileSize(file.size)}</span>

          {processResult && (
            <>
              <span>{t('fileItem.originalDuration', { duration: formatDuration(processResult.originalDuration) })}</span>
              <span className="text-green-400">{t('fileItem.processedDuration', { duration: formatDuration(processResult.processedDuration) })}</span>
              {(processResult.startTrimMs > 0 || processResult.endTrimMs > 0) && (
                <span className="text-yellow-400">
                  {t('fileItem.trimInfo', {
                    start: formatMs(processResult.startTrimMs),
                    end: formatMs(processResult.endTrimMs),
                  })}
                </span>
              )}
            </>
          )}

          {errorMessage && (
            <span className="text-red-400 truncate" title={errorMessage}>
              {errorMessage}
            </span>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 処理中スピナー */}
        {status === 'processing' && (
          <div
            className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"
            aria-label={t('fileItem.processingSpinner')}
          />
        )}


        {/* 削除ボタン */}
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="
            w-8 h-8 flex items-center justify-center rounded-lg
            text-gray-500 hover:text-red-400 hover:bg-red-900/20
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
          "
          aria-label={t('fileItem.removeAriaLabel', { name: file.name })}
          disabled={status === 'processing'}
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
