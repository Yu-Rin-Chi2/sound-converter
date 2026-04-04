export type FileStatus = 'idle' | 'processing' | 'done' | 'error';

export interface AudioFile {
  id: string;
  file: File;
  status: FileStatus;
  processResult?: ProcessResult;
  errorMessage?: string;
}

export interface TrimOptions {
  enabled: boolean;
  silenceThreshold: number;    // dBFS（例: -50）
  minSilenceDuration: number;  // ms（例: 100）
}

export interface VolumeOptions {
  enabled: boolean;
  mode: 'peak' | 'rms' | 'limit';
  targetDb: number;            // dBFS（例: -3 for peak, -14 for RMS）
}

export interface SpeedOptions {
  enabled: boolean;
  rate: number;                // 倍率（0.5〜4.0）
  preservePitch: boolean;      // ピッチを維持するか
}

export interface ProcessOptions {
  trim: TrimOptions;
  volume: VolumeOptions;
  speed: SpeedOptions;
  outputFormat: 'wav' | 'mp3' | 'ogg';
}

export interface ProcessResult {
  originalDuration: number;    // 秒
  processedDuration: number;   // 秒
  startTrimMs: number;         // 先頭カット量（ms）
  endTrimMs: number;           // 末尾カット量（ms）
  blob: Blob;
}

export interface TrimResult {
  startTrimSec: number;
  endTrimSec: number;
}
