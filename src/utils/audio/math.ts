/**
 * 音声処理で共通して使用する数値変換ユーティリティ。
 * 各ファイルで重複定義されていた dbToLinear / linearToDb をここに集約する。
 */

/**
 * dBFS を線形振幅に変換する。
 * 例: -6 dBFS → 約 0.501
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * 線形振幅を dBFS に変換する。
 * 例: 0.501 → 約 -6 dBFS
 */
export function linearToDb(linear: number): number {
  return 20 * Math.log10(linear);
}
