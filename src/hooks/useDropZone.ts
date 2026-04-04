import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateFile } from '../utils/file/validateFile';

/**
 * ファイルのドラッグ&ドロップ処理を管理するフック。
 * validateFile でフィルタリングし、有効なファイルのみ onFilesAccepted に渡す。
 * timerRef でエラークリア用タイマーを管理し、アンマウント時に確実にクリアする。
 */
export function useDropZone(onFilesAccepted: (files: File[]) => void) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const dragCounterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        const result = validateFile(file);
        if (result.valid) {
          validFiles.push(file);
        } else if (result.validationError) {
          const ve = result.validationError;
          let errorMsg: string;
          switch (ve.code) {
            case 'EMPTY_FILE':
              errorMsg = t('errors.emptyFile');
              break;
            case 'FILE_TOO_LARGE':
              errorMsg = t('errors.fileTooLarge', { maxMb: ve.maxMb });
              break;
            case 'UNSUPPORTED_FORMAT':
              errorMsg = t('errors.unsupportedFormat', { supported: ve.supported });
              break;
          }
          errors.push(`${file.name}: ${errorMsg}`);
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        // 前回のタイマーをクリアしてから新たに設定（連続エラー時のリセット）
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setValidationErrors([]);
          timerRef.current = null;
        }, 5000);
      }

      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    },
    [onFilesAccepted, t],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // 同じファイルを再選択できるようにリセット
      e.target.value = '';
    },
    [processFiles],
  );

  return {
    isDragging,
    validationErrors,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  };
}
