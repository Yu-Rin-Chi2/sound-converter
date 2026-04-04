# 音声処理の設計方針

## 処理フロー

```
ファイル選択 / ドロップ
    │
    ▼
[validateFile] ← 対応フォーマット・サイズチェック（上限 200MB）
    │
    ▼
[Web Audio API decodeAudioData] ← ArrayBuffer → AudioBuffer
    │
    ▼
[detectSilence] ← 先頭・末尾の無音区間を検出
    │
    ├── 波形データ生成 → [WaveformViewer]
    │
    ▼
[trimAudio] ← AudioBuffer をスライス（Web Audio API）
    │
    ▼
[normalizeVolume / limitVolume] ← 音量処理（Web Audio API OfflineAudioContext）
    │
    ├── WAV 出力 → Web Audio API エンコード → downloadBlob
    └── MP3/OGG/速度変更 → [FFmpeg.wasm] → downloadBlob
```

## Web Audio API と FFmpeg.wasm の役割分担

| 処理 | 担当 |
|------|------|
| ファイルデコード | Web Audio API（`decodeAudioData`） |
| 無音検出・トリミング | Web Audio API（PCM 直接操作） |
| 音量正規化・リミット | Web Audio API（`OfflineAudioContext`） |
| WAV 出力 | Web Audio API |
| MP3 / OGG / AAC 出力 | FFmpeg.wasm |
| 再生速度変更（ピッチ調整含む） | FFmpeg.wasm（`atempo` フィルタ） |

## FFmpeg.wasm の遅延ロード

ffmpeg-core.wasm は数十 MB あるため、**MP3/OGG/AAC 出力または速度変更が必要になった時点**で初めてロードする。
`useFFmpeg` フックで `isLoaded` 状態を管理し、ロード中は進捗インジケーターを表示する。

`vite.config.ts` に以下のヘッダー設定が必須（SharedArrayBuffer 使用のため）：

```ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
},
```

## 無音検出アルゴリズム（`detectSilence.ts`）

- PCM サンプルのチャンネル平均 RMS を計算
- `SILENCE_THRESHOLD`（デフォルト: `-50 dBFS`）以下が連続する区間を無音と判定
- `MIN_SILENCE_DURATION`（デフォルト: `100ms`）未満の無音区間は無視
- 戻り値: `{ startTrimSec: number; endTrimSec: number }`

## 音量処理方針

| モード | 説明 | 用途 |
|--------|------|------|
| **peak** | 最大振幅を目標 dBFS に合わせる | 単一ファイルの最大化 |
| **rms** | 平均音量（RMS）を揃える | 複数音源の音量統一に最適 |
| **limit** | 指定 dBFS 以上の箇所のみソフトクリップ | 音割れ防止 |

## 型定義（`src/types/audio.ts`）

```ts
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
```
