import type { FFmpeg } from '@ffmpeg/ffmpeg';
import type { SpeedOptions } from '../../types/audio';

/**
 * atempo フィルタのチェーンを生成する。
 * atempo は 0.5〜2.0 の範囲しか受け付けないため、
 * それ以外の倍率は複数の atempo を直列に適用して実現する。
 *
 * 例: rate=4.0 → atempo=2.0,atempo=2.0
 *     rate=0.25 → atempo=0.5,atempo=0.5
 */
function buildAtempoChain(rate: number): string {
  const filters: string[] = [];
  let remaining = rate;

  if (remaining > 1) {
    while (remaining > 2.0) {
      filters.push('atempo=2.0');
      remaining /= 2.0;
    }
    filters.push(`atempo=${remaining.toFixed(6)}`);
  } else {
    while (remaining < 0.5) {
      filters.push('atempo=0.5');
      remaining /= 0.5;
    }
    filters.push(`atempo=${remaining.toFixed(6)}`);
  }

  return filters.join(',');
}

/**
 * FFmpeg の atempo フィルタを使用して再生速度を変更する。
 * preservePitch: true → atempo のみ（ピッチ維持）
 * preservePitch: false → asetrate + aresample でピッチも変化させる
 */
export async function adjustSpeed(
  inputData: Uint8Array,
  options: SpeedOptions,
  ffmpeg: FFmpeg,
  inputFilename: string,
  sampleRate: number,
): Promise<Uint8Array> {
  const { fetchFile } = await import('@ffmpeg/util');

  const outputFilename = `output_${Date.now()}.wav`;
  await ffmpeg.writeFile(inputFilename, inputData);

  let filterComplex: string;
  if (options.preservePitch) {
    // atempo のみ: ピッチを維持しつつ速度を変える
    filterComplex = buildAtempoChain(options.rate);
  } else {
    // asetrate でサンプリングレートを変更してピッチも変える
    // aresample で元のサンプリングレートに戻す
    const newRate = Math.round(sampleRate * options.rate);
    filterComplex = `asetrate=${newRate},aresample=${sampleRate}`;
  }

  await ffmpeg.exec([
    '-i', inputFilename,
    '-af', filterComplex,
    outputFilename,
  ]);

  const result = await ffmpeg.readFile(outputFilename);
  await ffmpeg.deleteFile(inputFilename);
  await ffmpeg.deleteFile(outputFilename);

  if (result instanceof Uint8Array) {
    return result;
  }
  // string が返された場合（通常は発生しない）
  return fetchFile(result);
}
