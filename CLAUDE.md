# CLAUDE.md -- sound-converter

## プロジェクト概要

**sound-converter** は、SEやBGMなどのゲーム音声素材を整形するブラウザ完結型 Web ツール。
先頭・末尾の無音トリミング、音量正規化・リミット、再生速度調整をブラウザ内で処理する。

- **対象ユーザー**: ゲーム開発者・サウンドデザイナー
- **処理方式**: クライアントサイドのみ（サーバーへのアップロードなし）
- **認証**: 不要
- **参考 UX**: [mp3cut.net/ja/](https://mp3cut.net/ja/)

## 技術スタック

| 分類 | ライブラリ / ツール | 用途 |
|------|-------------------|------|
| UI | React 18.x | コンポーネントベース UI |
| ビルド | Vite 5.x | 高速 HMR・WASM 取り込み対応 |
| 言語 | TypeScript 5.x (strict) | 型安全な音声処理パラメータ管理 |
| 音声処理 | Web Audio API | デコード・無音検出・トリミング・音量解析・WAV 出力 |
| 音声処理 | @ffmpeg/ffmpeg 0.12.x | MP3/OGG/AAC エンコード・再生速度変更 |
| 波形表示 | wavesurfer.js 7.x | Before/After 波形プレビュー |
| スタイリング | Tailwind CSS 3.x | utility-first スタイリング |
| テスト | Vitest + React Testing Library | ユニットテスト・コンポーネントテスト |

## 設計ドキュメント

- [ディレクトリ構造](docs/design/folder-structure.md)
- [音声処理の設計方針・型定義](docs/design/audio-processing.md)
- [テスト方針](docs/design/testing.md)

## 開発コマンド

```bash
npm run dev         # 開発サーバー起動（HMR 有効）
npm run build       # 本番ビルド
npm run preview     # ビルド結果プレビュー
npm run typecheck   # 型チェック（コンパイルなし）
npm run test        # テスト実行（ウォッチモード）
npm run test:run    # テスト実行（CI 向け・一回のみ）
npm run lint        # Lint チェック
npm run lint:fix    # Lint 自動修正
```

## 設計・実装フロー

大規模な機能追加・アーキテクチャ変更を行う場合は、先に `docs/design/` に設計書を作成してから実装に入ること。
設計書には目的・技術選定・影響範囲・実装方針を記載する。実装完了後、設計書が陳腐化していれば更新または削除する。

## コーディングルール

- `strict: true` を有効にし、`any` 型は原則禁止
- 音声処理パラメータは必ず型定義する（`src/types/audio.ts`）
- `Promise` を返す関数には戻り値の型を明示する
- ユーティリティ関数は副作用のない純粋関数として実装する
- エラーは上位コンポーネントに伝播させてユーザーに表示する

### 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| コンポーネント | PascalCase | `WaveformViewer`, `DropZone` |
| カスタムフック | `use` + PascalCase | `useAudioProcessor`, `useFFmpeg` |
| ユーティリティ関数 | camelCase | `detectSilence`, `normalizeVolume` |
| 型・インターフェース | PascalCase | `TrimOptions`, `AudioFile` |
| 定数 | UPPER_SNAKE_CASE | `SILENCE_THRESHOLD`, `MAX_FILE_SIZE` |

### パフォーマンス上の注意

- ファイルサイズ上限を `validateFile` で設ける（推奨: 200MB）
- 複数ファイルの一括処理は **逐次処理**（並列実行でメモリ枯渇を防ぐ）
- `AudioBuffer` は処理完了後に参照を解放して GC に回収させる

## MCP ツール

Playwright MCP が利用可能。ブラウザ操作・E2E テスト・UI 動作確認には Playwright MCP ツールを使用すること。

## 新機能追加時のチェックリスト

- [ ] `src/types/audio.ts` に必要な型を追加したか
- [ ] 新しいユーティリティ関数に対応するユニットテストを作成したか
- [ ] コンポーネントの Props 型を定義したか
- [ ] エラーケースのハンドリングを実装したか
- [ ] FFmpeg.wasm の遅延ロードを考慮したか
