import type { TrimOptions, TrimResult } from '../../types/audio';
import { dbToLinear } from './math';

/**
 * フレーム単位の RMS（Root Mean Square）を計算する。
 * マルチチャンネルの場合はチャンネル平均 RMS を返す。
 */
function calculateFrameRms(buffer: AudioBuffer, frameStart: number, frameSize: number): number {
  const channels = buffer.numberOfChannels;
  let sumSquares = 0;
  let count = 0;

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = frameStart; i < Math.min(frameStart + frameSize, data.length); i++) {
      sumSquares += data[i] * data[i];
      count++;
    }
  }

  if (count === 0) return 0;
  return Math.sqrt(sumSquares / count);
}

/**
 * AudioBuffer の先頭・末尾の無音区間を検出する。
 * PCM サンプルのチャンネル平均 RMS を計算し、
 * SILENCE_THRESHOLD 以下が MIN_SILENCE_DURATION 以上続く区間を無音と判定する。
 *
 * @returns { startTrimSec, endTrimSec } — それぞれカット量（秒）
 */
export function detectSilence(buffer: AudioBuffer, options: TrimOptions): TrimResult {
  const { silenceThreshold, minSilenceDuration } = options;

  const sampleRate = buffer.sampleRate;
  const totalSamples = buffer.length;
  // フレームサイズ: 約 10ms 単位で解析する
  const frameSize = Math.floor(sampleRate * 0.01);
  const silenceLinear = dbToLinear(silenceThreshold);
  const minSilenceSamples = Math.floor(sampleRate * (minSilenceDuration / 1000));

  // 各フレームが無音かどうかを判定
  const frames: boolean[] = [];
  for (let offset = 0; offset < totalSamples; offset += frameSize) {
    const rms = calculateFrameRms(buffer, offset, frameSize);
    frames.push(rms <= silenceLinear);
  }

  const totalFrames = frames.length;
  const minSilenceFrames = Math.ceil(minSilenceSamples / frameSize);

  // 先頭から連続する無音フレーム数を数える
  let silentStartFrames = 0;
  for (let i = 0; i < totalFrames; i++) {
    if (frames[i]) {
      silentStartFrames++;
    } else {
      break;
    }
  }

  // 末尾から連続する無音フレーム数を数える
  let silentEndFrames = 0;
  for (let i = totalFrames - 1; i >= 0; i--) {
    if (frames[i]) {
      silentEndFrames++;
    } else {
      break;
    }
  }

  // MIN_SILENCE_DURATION 未満の無音区間は無視する
  const startTrimFrames = silentStartFrames >= minSilenceFrames ? silentStartFrames : 0;
  const endTrimFrames = silentEndFrames >= minSilenceFrames ? silentEndFrames : 0;

  const startTrimSec = (startTrimFrames * frameSize) / sampleRate;
  const endTrimSec = (endTrimFrames * frameSize) / sampleRate;

  // 全体が無音の場合は安全に処理: トリムしない
  const totalTrimSec = startTrimSec + endTrimSec;
  const totalDuration = totalSamples / sampleRate;
  if (totalTrimSec >= totalDuration) {
    return { startTrimSec: 0, endTrimSec: 0 };
  }

  return { startTrimSec, endTrimSec };
}
