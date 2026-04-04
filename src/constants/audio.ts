export const SILENCE_THRESHOLD = -50;        // dBFS
export const MIN_SILENCE_DURATION = 100;     // ms
export const MAX_FILE_SIZE = 200 * 1024 * 1024;  // 200MB
export const DEFAULT_SAMPLE_RATE = 44100;
export const SUPPORTED_FORMATS = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/x-wav',
] as const;
export const SUPPORTED_EXTENSIONS = ['.wav', '.mp3', '.ogg'] as const;
