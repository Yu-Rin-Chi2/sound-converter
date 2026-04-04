# ディレクトリ構造

```
sound-converter/
├── public/
│   └── ffmpeg/                     # FFmpeg.wasm バイナリ（バンドラーから除外）
│       ├── ffmpeg-core.js
│       ├── ffmpeg-core.wasm
│       └── ffmpeg-core.worker.js
├── src/
│   ├── assets/                     # 静的リソース（アイコン等）
│   ├── components/
│   │   ├── DropZone/               # ファイル受付 UI
│   │   │   ├── DropZone.tsx
│   │   │   └── index.ts
│   │   ├── FileList/               # ファイル一覧・ステータス表示
│   │   │   ├── FileList.tsx
│   │   │   ├── FileListItem.tsx
│   │   │   └── index.ts
│   │   ├── WaveformViewer/         # 波形 Before/After 比較表示
│   │   │   ├── WaveformViewer.tsx
│   │   │   └── index.ts
│   │   ├── TrimControls/           # 無音検出パラメータ調整
│   │   │   ├── TrimControls.tsx
│   │   │   └── index.ts
│   │   ├── VolumeControls/         # 最大音量・正規化設定
│   │   │   ├── VolumeControls.tsx
│   │   │   └── index.ts
│   │   ├── SpeedControls/          # 再生速度・ピッチ設定
│   │   │   ├── SpeedControls.tsx
│   │   │   └── index.ts
│   │   └── DownloadButton/         # 個別DL / 一括 ZIP ダウンロード
│   │       ├── DownloadButton.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useAudioProcessor.ts    # 統合処理フロー（trim → volume → speed）
│   │   ├── useFFmpeg.ts            # FFmpeg.wasm の遅延ロード・実行
│   │   ├── useDropZone.ts          # ファイルドロップ処理
│   │   └── useWaveform.ts          # 波形データ生成・管理
│   ├── utils/
│   │   ├── audio/
│   │   │   ├── detectSilence.ts    # RMS ベース無音区間検出
│   │   │   ├── trimAudio.ts        # AudioBuffer スライス
│   │   │   ├── normalizeVolume.ts  # ピーク・RMS 正規化
│   │   │   ├── limitVolume.ts      # 音量リミット（dBFS 上限）
│   │   │   └── adjustSpeed.ts      # 再生速度調整（FFmpeg 経由）
│   │   └── file/
│   │       ├── validateFile.ts     # ファイル種別・サイズ検証
│   │       └── downloadBlob.ts     # Blob → ダウンロードヘルパー
│   ├── types/
│   │   └── audio.ts                # 全型定義（AudioFile, ProcessOptions など）
│   ├── constants/
│   │   └── audio.ts                # SILENCE_THRESHOLD, DEFAULT_SAMPLE_RATE など
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── utils/
│   │   ├── detectSilence.test.ts
│   │   ├── normalizeVolume.test.ts
│   │   └── limitVolume.test.ts
│   └── fixtures/                   # テスト用合成音声データ（ArrayBuffer）
├── docs/
│   └── design/                     # 設計ドキュメント
├── CLAUDE.md
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## コンポーネント構成ルール

- 1コンポーネント = 1ディレクトリ（本体 + `index.ts`）
- `index.ts` からのみ外部エクスポート
