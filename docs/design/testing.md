# テスト方針

## 優先テスト対象

音声処理ロジックはバグの影響が大きいため以下を最優先でテストする：

1. `detectSilence` -- 各種波形パターンでの無音区間検出精度
2. `normalizeVolume` / `limitVolume` -- 音量変換後の dBFS 値の正確性
3. `validateFile` -- 非対応フォーマット・過大ファイルの拒否

## テストデータ

`tests/fixtures/` に合成音声 ArrayBuffer をプログラムで生成（CI 対応）：

- 先頭のみ無音のパターン
- 末尾のみ無音のパターン
- 先頭・末尾両方に無音のパターン
- 無音なし（トリミング不要）のパターン

## モック方針

- `AudioContext` / `OfflineAudioContext` は `vi.mock` で代替
- FFmpeg.wasm はユニットテストではモック化（実エンコードは統合テストのみ）
