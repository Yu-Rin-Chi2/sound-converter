import type { VolumeOptions } from '../../types/audio';
import { dbToLinear } from './math';

/**
 * ソフトクリッピング関数。
 * threshold 以下の成分は変化しない。
 * threshold を超えた成分は圧縮し、最大値が threshold を超えないことを保証する。
 *
 * 実装: threshold を超えた excess を tanh で圧縮し、
 * 出力 = threshold + knee * tanh(excess / knee)
 * ここで knee は threshold の 2% と小さいため threshold に速く収束する。
 *
 * @param sample 入力サンプル（任意の値）
 * @param threshold 線形振幅の閾値（0.0 〜 1.0）
 */
function softClip(sample: number, threshold: number): number {
  const abs = Math.abs(sample);
  if (abs <= threshold) return sample;

  const sign = sample > 0 ? 1 : -1;
  const excess = abs - threshold;

  // knee が小さいほど threshold へ速く収束する（ほぼハードリミット）
  // 0.001 で tanh(excess/0.001) は excess > 0.005 で実質 1.0 に達する
  const knee = 0.001;
  const clipped = threshold + knee * Math.tanh(excess / knee);
  return sign * clipped;
}

/**
 * AudioBuffer の音量をリミットする。
 * 指定 dBFS 以上の箇所のみソフトクリップ（tanh ベース）を適用。
 * enabled: false または mode が limit 以外の場合は入力をそのまま返す。
 */
export function limitVolume(buffer: AudioBuffer, options: VolumeOptions): AudioBuffer {
  if (!options.enabled || options.mode !== 'limit') {
    return buffer;
  }

  const threshold = dbToLinear(options.targetDb);
  const channels = buffer.numberOfChannels;

  const newBuffer = new OfflineAudioContext(channels, buffer.length, buffer.sampleRate)
    .createBuffer(channels, buffer.length, buffer.sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const srcData = buffer.getChannelData(ch);
    const dstData = newBuffer.getChannelData(ch);
    for (let i = 0; i < srcData.length; i++) {
      dstData[i] = softClip(srcData[i], threshold);
    }
  }

  return newBuffer;
}
