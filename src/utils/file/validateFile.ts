import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '../../constants/audio';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * ファイルの種別・サイズを検証する純粋関数。
 * MIMEタイプと拡張子の両方でチェックし、どちらかが対応していれば受け入れる。
 */
export function validateFile(file: { name: string; type: string; size: number }): ValidationResult {
  if (file.size === 0) {
    return { valid: false, error: 'ファイルが空です（0バイト）。' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `ファイルサイズが上限（${maxMb}MB）を超えています。` };
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isSupportedExt = SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number]);
  const isSupportedMime = SUPPORTED_FORMATS.includes(file.type as typeof SUPPORTED_FORMATS[number]);

  if (!isSupportedExt && !isSupportedMime) {
    const supported = SUPPORTED_EXTENSIONS.join(', ');
    return {
      valid: false,
      error: `対応していないファイル形式です。対応形式: ${supported}`,
    };
  }

  return { valid: true };
}
