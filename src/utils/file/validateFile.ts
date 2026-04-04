import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '../../constants/audio';

export type ValidationErrorCode =
  | { code: 'EMPTY_FILE' }
  | { code: 'FILE_TOO_LARGE'; maxMb: number }
  | { code: 'UNSUPPORTED_FORMAT'; supported: string };

export interface ValidationResult {
  valid: boolean;
  validationError?: ValidationErrorCode;
}

/**
 * ファイルの種別・サイズを検証する純粋関数。
 * MIMEタイプと拡張子の両方でチェックし、どちらかが対応していれば受け入れる。
 */
export function validateFile(file: { name: string; type: string; size: number }): ValidationResult {
  if (file.size === 0) {
    return { valid: false, validationError: { code: 'EMPTY_FILE' } };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, validationError: { code: 'FILE_TOO_LARGE', maxMb } };
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isSupportedExt = SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number]);
  const isSupportedMime = SUPPORTED_FORMATS.includes(file.type as typeof SUPPORTED_FORMATS[number]);

  if (!isSupportedExt && !isSupportedMime) {
    const supported = SUPPORTED_EXTENSIONS.join(', ');
    return {
      valid: false,
      validationError: { code: 'UNSUPPORTED_FORMAT', supported },
    };
  }

  return { valid: true };
}
