import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import type { AudioFile, ProcessResult } from '../../types/audio';
import { downloadBlob } from '../../utils/file/downloadBlob';

type IndividualDownloadProps = {
  result: ProcessResult;
  filename: string;
};

/**
 * 個別ファイルのダウンロードボタン。
 */
export const IndividualDownloadButton = ({ result, filename }: IndividualDownloadProps) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    downloadBlob(result.blob, filename);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="
        flex items-center gap-2 px-4 py-2 rounded-lg
        bg-green-700 hover:bg-green-600 active:bg-green-800
        text-white text-sm font-medium
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
      "
    >
      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {t('download.download')}
    </button>
  );
};

type BulkDownloadProps = {
  files: AudioFile[];
};

/**
 * 完了済みファイルをまとめて ZIP ダウンロードするボタン。
 * JSZip を使って Blob から ZIP を生成する。
 */
export const BulkDownloadButton = ({ files }: BulkDownloadProps) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const doneFiles = files.filter((f) => f.status === 'done' && f.processResult);

  if (doneFiles.length === 0) return null;

  const handleBulkDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const zip = new JSZip();

      doneFiles.forEach((audioFile) => {
        if (!audioFile.processResult) return;
        const ext = audioFile.processResult.blob.type.includes('ogg') ? 'ogg'
          : audioFile.processResult.blob.type.includes('mpeg') ? 'mp3'
          : 'wav';
        const baseName = audioFile.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}_converted.${ext}`, audioFile.processResult.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `sound-converter_${Date.now()}.zip`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBulkDownload}
      disabled={isGenerating}
      className="
        flex items-center gap-2 px-4 py-2 rounded-lg
        bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800
        disabled:opacity-60 disabled:cursor-not-allowed
        text-white text-sm font-medium
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
      "
      aria-label={t('download.bulkAriaLabel', { count: doneFiles.length })}
    >
      {isGenerating ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>{t('download.generatingZip')}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{t('download.bulkDownload', { count: doneFiles.length })}</span>
        </>
      )}
    </button>
  );
};
