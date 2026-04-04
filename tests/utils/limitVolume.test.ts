import { describe, it, expect, vi, beforeEach } from 'vitest';
import { limitVolume } from '../../src/utils/audio/limitVolume';
import { createToneBuffer, mockOfflineAudioContext } from '../fixtures';
import type { VolumeOptions } from '../../src/types/audio';

/**
 * 全チャンネルのピーク振幅を dBFS で返す。
 */
function getPeakDb(buffer: AudioBuffer): number {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
}

/**
 * クリッピングに使う threshold 以下のサンプルが変化していないかチェックする。
 */
function checkSamplesUnderThresholdUnchanged(
  original: AudioBuffer,
  processed: AudioBuffer,
  thresholdLinear: number,
): boolean {
  for (let ch = 0; ch < original.numberOfChannels; ch++) {
    const origData = original.getChannelData(ch);
    const procData = processed.getChannelData(ch);
    for (let i = 0; i < origData.length; i++) {
      if (Math.abs(origData[i]) <= thresholdLinear) {
        // 閾値以下のサンプルは変化しないはず
        if (Math.abs(origData[i] - procData[i]) > 1e-6) {
          return false;
        }
      }
    }
  }
  return true;
}

describe('limitVolume', () => {
  beforeEach(() => {
    vi.stubGlobal('OfflineAudioContext', vi.fn().mockImplementation(() => mockOfflineAudioContext()));
  });

  /**
   * U-18: 閾値超過サンプルがソフトクリップされる
   */
  it('U-18: ピーク 0dBFS の音声を -3dBFS 以下にリミットする', () => {
    // 振幅 0dBFS (= 1.0) のトーン
    const buffer = createToneBuffer(44100, 0.1, 1, 440, 0);
    const options: VolumeOptions = { enabled: true, mode: 'limit', targetDb: -3 };

    const result = limitVolume(buffer, options);
    const peakDb = getPeakDb(result);

    expect(peakDb).toBeLessThanOrEqual(-3 + 0.1); // -3dBFS 以下（±0.1dB の誤差許容）
  });

  /**
   * U-19: 閾値以下のサンプルは変化しない
   */
  it('U-19: -10dBFS のサンプルは -3dBFS リミット処理で変化しない', () => {
    const buffer = createToneBuffer(44100, 0.1, 1, 440, -10);
    const options: VolumeOptions = { enabled: true, mode: 'limit', targetDb: -3 };
    const thresholdLinear = Math.pow(10, -3 / 20);

    const result = limitVolume(buffer, options);

    expect(checkSamplesUnderThresholdUnchanged(buffer, result, thresholdLinear)).toBe(true);
  });

  /**
   * U-20: 大幅に閾値を超えるピーク音への対応
   * 振幅が非常に大きい（クリッピング状態）でも処理が適用される
   */
  it('U-20: 大幅に閾値を超える音声（ピーク 1.0 = 0dBFS）を -6dBFS にリミットする', () => {
    // ピーク 0dBFS のトーン
    const buffer = createToneBuffer(44100, 0.1, 1, 440, 0);
    const options: VolumeOptions = { enabled: true, mode: 'limit', targetDb: -6 };

    const result = limitVolume(buffer, options);
    const peakDb = getPeakDb(result);

    expect(peakDb).toBeLessThanOrEqual(-6 + 0.5); // -6dBFS 以下（±0.5dB の誤差許容）
  });

  /**
   * U-21: enabled: false の場合は処理をスキップ
   */
  it('U-21: enabled: false の場合は入力 AudioBuffer をそのまま返す', () => {
    const buffer = createToneBuffer(44100, 0.1, 1, 440, 0);
    const options: VolumeOptions = { enabled: false, mode: 'limit', targetDb: -3 };

    const result = limitVolume(buffer, options);

    expect(result).toBe(buffer);
  });
});
