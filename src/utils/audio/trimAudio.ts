import type { TrimResult } from '../../types/audio';

/**
 * AudioBuffer を指定したトリム結果に基づいてスライスする。
 * startTrimSec 〜 (totalDuration - endTrimSec) の区間を新しい AudioBuffer として返す。
 */
export function trimAudio(buffer: AudioBuffer, trimResult: TrimResult): AudioBuffer {
  const { startTrimSec, endTrimSec } = trimResult;
  const sampleRate = buffer.sampleRate;
  const totalSamples = buffer.length;
  const channels = buffer.numberOfChannels;

  const startSample = Math.floor(startTrimSec * sampleRate);
  const endSample = totalSamples - Math.floor(endTrimSec * sampleRate);

  // トリム後のサンプル数（最低 1 サンプル確保）
  const newLength = Math.max(1, endSample - startSample);

  const ctx = new OfflineAudioContext(channels, newLength, sampleRate);
  const newBuffer = ctx.createBuffer(channels, newLength, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const dstData = newBuffer.getChannelData(ch);
    dstData.set(srcData.subarray(startSample, startSample + newLength));
  }

  return newBuffer;
}
