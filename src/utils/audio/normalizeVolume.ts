import type { VolumeOptions } from '../../types/audio';
import { dbToLinear } from './math';


/**
 * AudioBuffer の全チャンネルのピーク振幅を求める。
 */
function getPeakAmplitude(buffer: AudioBuffer): number {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  return peak;
}

/**
 * AudioBuffer の全チャンネルの RMS を求める。
 */
function getRmsAmplitude(buffer: AudioBuffer): number {
  let sumSquares = 0;
  let count = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
      count++;
    }
  }
  if (count === 0) return 0;
  return Math.sqrt(sumSquares / count);
}

/**
 * AudioBuffer の音量を正規化する。
 * - peak モード: 最大振幅を目標 dBFS に合わせる
 * - rms モード: 平均音量 RMS を揃える
 * enabled: false の場合は入力をそのまま返す。
 * 無音ファイル（振幅 0）の場合はゼロ除算を防いでそのまま返す。
 */
export function normalizeVolume(buffer: AudioBuffer, options: VolumeOptions): AudioBuffer {
  if (!options.enabled || options.mode === 'limit') {
    return buffer;
  }

  const targetLinear = dbToLinear(options.targetDb);

  let currentAmplitude: number;
  if (options.mode === 'peak') {
    currentAmplitude = getPeakAmplitude(buffer);
  } else {
    // rms モード
    currentAmplitude = getRmsAmplitude(buffer);
  }

  // ゼロ除算ガード: 無音ファイルはそのまま返す
  if (currentAmplitude === 0) {
    return buffer;
  }

  const gain = targetLinear / currentAmplitude;

  // 処理後のピークが 0dBFS を超えないようにクランプ（peak / rms 両モードに適用）
  const peakAmplitude = getPeakAmplitude(buffer);
  const maxGain = 1.0 / peakAmplitude;
  const safeGain = Math.min(gain, maxGain);

  const channels = buffer.numberOfChannels;
  const newBuffer = new OfflineAudioContext(channels, buffer.length, buffer.sampleRate)
    .createBuffer(channels, buffer.length, buffer.sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const dstData = newBuffer.getChannelData(ch);
    for (let i = 0; i < srcData.length; i++) {
      dstData[i] = srcData[i] * safeGain;
    }
  }

  return newBuffer;
}
