import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeVolume } from '../../src/utils/audio/normalizeVolume';
import { createToneBuffer, createSilentBuffer, mockOfflineAudioContext } from '../fixtures';
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
 * 全チャンネルの RMS を dBFS で返す。
 */
function getRmsDb(buffer: AudioBuffer): number {
  let sumSquares = 0;
  let count = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
      count++;
    }
  }
  if (count === 0) return -Infinity;
  const rms = Math.sqrt(sumSquares / count);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

describe('normalizeVolume', () => {
  beforeEach(() => {
    // OfflineAudioContext をモックする
    vi.stubGlobal('OfflineAudioContext', vi.fn().mockImplementation(() => mockOfflineAudioContext()));
  });

  /**
   * U-11: peak モード ターゲット -3dBFS
   */
  it('U-11: peak モードでピーク値を -3dBFS に正規化する', () => {
    const buffer = createToneBuffer(44100, 1.0, 1, 440, -10);
    const options: VolumeOptions = { enabled: true, mode: 'peak', targetDb: -3 };

    const result = normalizeVolume(buffer, options);
    const peakDb = getPeakDb(result);

    expect(peakDb).toBeCloseTo(-3, 0); // ±0.5dB 以内
  });

  /**
   * U-12: peak モード — すでにターゲット以上のピークを下げる
   */
  it('U-12: peak モードでピーク -2dBFS を -3dBFS に下げる', () => {
    const buffer = createToneBuffer(44100, 1.0, 1, 440, -2);
    const options: VolumeOptions = { enabled: true, mode: 'peak', targetDb: -3 };

    const result = normalizeVolume(buffer, options);
    const peakDb = getPeakDb(result);

    expect(peakDb).toBeCloseTo(-3, 0);
  });

  /**
   * U-13: rms モード ターゲット -14dBFS
   */
  it('U-13: rms モードで RMS を -14dBFS に正規化する', () => {
    const buffer = createToneBuffer(44100, 1.0, 1, 440, -20);
    const options: VolumeOptions = { enabled: true, mode: 'rms', targetDb: -14 };

    const result = normalizeVolume(buffer, options);
    const rmsDb = getRmsDb(result);

    expect(rmsDb).toBeCloseTo(-14, 0);
  });

  /**
   * U-14: rms モード — 複数ファイルの統一
   */
  it('U-14: rms モードで異なる音量の 2 ファイルを同じ RMS に揃える', () => {
    const buffer1 = createToneBuffer(44100, 1.0, 1, 440, -18);
    const buffer2 = createToneBuffer(44100, 1.0, 1, 440, -12);
    const options: VolumeOptions = { enabled: true, mode: 'rms', targetDb: -14 };

    const result1 = normalizeVolume(buffer1, options);
    const result2 = normalizeVolume(buffer2, options);

    const rms1 = getRmsDb(result1);
    const rms2 = getRmsDb(result2);

    expect(rms1).toBeCloseTo(-14, 0);
    expect(rms2).toBeCloseTo(-14, 0);
  });

  /**
   * U-15: enabled: false の場合は処理をスキップ
   */
  it('U-15: enabled: false の場合は入力 AudioBuffer をそのまま返す', () => {
    const buffer = createToneBuffer(44100, 1.0, 1, 440, -10);
    const options: VolumeOptions = { enabled: false, mode: 'peak', targetDb: -3 };

    const result = normalizeVolume(buffer, options);

    // 同一オブジェクトが返ることを確認
    expect(result).toBe(buffer);
  });

  /**
   * U-16: 無音ファイルに対する peak モード — ゼロ除算が発生しないこと
   */
  it('U-16: 無音ファイルに対して peak モードでもゼロ除算が発生しない', () => {
    const buffer = createSilentBuffer(44100, 1.0);
    const options: VolumeOptions = { enabled: true, mode: 'peak', targetDb: -3 };

    // エラーが投げられずに処理が完了すること
    expect(() => normalizeVolume(buffer, options)).not.toThrow();
    const result = normalizeVolume(buffer, options);
    // 無音ファイルはそのまま返す
    expect(result).toBe(buffer);
  });

  /**
   * U-17: 処理後の duration・sampleRate・numberOfChannels が保持される
   */
  it('U-17: 処理後の AudioBuffer のメタデータが入力と一致する', () => {
    const buffer = createToneBuffer(44100, 2.0, 2, 440, -10);
    const options: VolumeOptions = { enabled: true, mode: 'peak', targetDb: -6 };

    const result = normalizeVolume(buffer, options);

    expect(result.sampleRate).toBe(buffer.sampleRate);
    expect(result.length).toBe(buffer.length);
    expect(result.numberOfChannels).toBe(buffer.numberOfChannels);
    expect(result.duration).toBeCloseTo(buffer.duration, 3);
  });
});
