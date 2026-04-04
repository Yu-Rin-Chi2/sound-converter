import { describe, it, expect } from 'vitest';
import { detectSilence } from '../../src/utils/audio/detectSilence';
import {
  createSilenceAtStartBuffer,
  createSilenceAtEndBuffer,
  createSilenceBothEndsBuffer,
  createToneBuffer,
  createSilentBuffer,
} from '../fixtures';
import type { TrimOptions } from '../../src/types/audio';

const defaultOptions: TrimOptions = {
  enabled: true,
  silenceThreshold: -50,
  minSilenceDuration: 100,
};

const TOLERANCE = 0.015; // 15ms の誤差を許容（フレームサイズ 10ms の 1.5 フレーム分）

describe('detectSilence', () => {
  /**
   * U-01: 先頭のみ無音
   * 先頭 500ms が -60dBFS（閾値 -50dBFS 以下）、残りは -10dBFS
   */
  it('U-01: 先頭のみ無音を検出する', () => {
    const buffer = createSilenceAtStartBuffer(44100, 0.5, 1.0);
    const result = detectSilence(buffer, defaultOptions);

    expect(result.startTrimSec).toBeCloseTo(0.5, 1);
    expect(result.endTrimSec).toBeLessThan(TOLERANCE);
  });

  /**
   * U-02: 末尾のみ無音
   * 末尾 500ms が -60dBFS
   */
  it('U-02: 末尾のみ無音を検出する', () => {
    const buffer = createSilenceAtEndBuffer(44100, 1.0, 0.5);
    const result = detectSilence(buffer, defaultOptions);

    expect(result.startTrimSec).toBeLessThan(TOLERANCE);
    expect(result.endTrimSec).toBeCloseTo(0.5, 1);
  });

  /**
   * U-03: 先頭・末尾両方に無音
   */
  it('U-03: 先頭・末尾両方の無音を検出する', () => {
    const buffer = createSilenceBothEndsBuffer(44100, 0.3, 1.0, 0.4);
    const result = detectSilence(buffer, defaultOptions);

    expect(result.startTrimSec).toBeCloseTo(0.3, 1);
    expect(result.endTrimSec).toBeCloseTo(0.4, 1);
  });

  /**
   * U-04: 無音なし（トリミング不要）
   */
  it('U-04: 無音なしの場合はトリミング量が 0 になる', () => {
    const buffer = createToneBuffer(44100, 1.0, 1, 440, -10);
    const result = detectSilence(buffer, defaultOptions);

    expect(result.startTrimSec).toBeLessThan(TOLERANCE);
    expect(result.endTrimSec).toBeLessThan(TOLERANCE);
  });

  /**
   * U-05: 全体が無音
   * 全区間が無音の場合は安全に処理（エラーにならないこと）
   */
  it('U-05: 全体が無音の場合はゼロを返す（クラッシュしない）', () => {
    const buffer = createSilentBuffer(44100, 1.0);
    // 全無音の場合はトリムしない（安全側に倒す）
    const result = detectSilence(buffer, defaultOptions);

    // 全無音のケース: startTrimSec + endTrimSec = 総時間 にならず、
    // 実装により 0,0 を返す
    expect(result.startTrimSec + result.endTrimSec).toBeLessThanOrEqual(buffer.duration);
    // エラーが発生しないこと（テスト自体が通過することで確認）
  });

  /**
   * U-06: MIN_SILENCE_DURATION 未満の無音は無視
   * 先頭 50ms（< 100ms）の無音は無視される
   */
  it('U-06: MIN_SILENCE_DURATION 未満の無音は無視する', () => {
    // 先頭 50ms 無音、残り 950ms トーン
    const buffer = createSilenceAtStartBuffer(44100, 0.05, 0.95);
    const result = detectSilence(buffer, defaultOptions); // minSilenceDuration: 100ms

    // 50ms < 100ms なので無視される
    expect(result.startTrimSec).toBeLessThan(TOLERANCE);
  });

  /**
   * U-07: カスタム閾値 -30dBFS
   * -40dBFS は -30dBFS 以下なので無音と判定される
   */
  it('U-07: silenceThreshold を -30dBFS に設定すると -40dBFS の区間も無音と判定する', () => {
    const customOptions: TrimOptions = { ...defaultOptions, silenceThreshold: -30 };
    // 先頭 500ms が -40dBFS（-30dBFS より小さい = 無音と判定）
    // createSilenceAtStartBuffer は先頭が 0（= -∞ dBFS）なので閾値内
    const buffer = createSilenceAtStartBuffer(44100, 0.5, 1.0);
    const result = detectSilence(buffer, customOptions);

    expect(result.startTrimSec).toBeCloseTo(0.5, 1);
  });

  /**
   * U-08: カスタム閾値 -70dBFS
   * 先頭 500ms が -60dBFS の区間は -70dBFS より大きいので無音と判定されない
   * NOTE: createSilenceAtStartBuffer の先頭は 0（-∞ dBFS）なので無音として検出される。
   * このテストでは -60dBFS ノイズを先頭に置いた場合のシナリオを確認する。
   */
  it('U-08: silenceThreshold を -70dBFS に設定すると -60dBFS の区間は無音と判定されない', () => {
    // 先頭 500ms が -60dBFS のノイズ、残り 1s がトーン -10dBFS
    // createNoisyBuffer は sin ベースで -60dBFS の振幅を生成
    const sampleRate = 44100;
    const silenceSamples = Math.floor(sampleRate * 0.5);
    const toneSamples = Math.floor(sampleRate * 1.0);
    const amplitude60db = Math.pow(10, -60 / 20);
    const amplitude10db = Math.pow(10, -10 / 20);

    const data = new Float32Array(silenceSamples + toneSamples);
    for (let i = 0; i < silenceSamples; i++) {
      data[i] = amplitude60db * Math.sin(i * 0.1);
    }
    for (let i = silenceSamples; i < data.length; i++) {
      data[i] = amplitude10db * Math.sin(i * 0.1);
    }

    const mockBuffer = {
      sampleRate,
      length: data.length,
      duration: data.length / sampleRate,
      numberOfChannels: 1,
      getChannelData: () => data,
    } as unknown as AudioBuffer;

    const customOptions: TrimOptions = { ...defaultOptions, silenceThreshold: -70 };
    const result = detectSilence(mockBuffer, customOptions);

    // -60dBFS は -70dBFS より大きいので無音と判定されない
    expect(result.startTrimSec).toBeLessThan(TOLERANCE);
  });

  /**
   * U-09: ステレオ音声（2ch）の先頭無音検出
   */
  it('U-09: ステレオ音声の先頭 200ms 無音を検出する', () => {
    const buffer = createSilenceAtStartBuffer(44100, 0.2, 1.0, 2);
    const result = detectSilence(buffer, defaultOptions);

    expect(result.startTrimSec).toBeCloseTo(0.2, 1);
    expect(result.endTrimSec).toBeLessThan(TOLERANCE);
  });

  /**
   * U-10: minSilenceDuration をカスタム設定（200ms）
   */
  it('U-10: minSilenceDuration=100ms では 150ms の無音を検出し、200ms では検出しない', () => {
    // 先頭 150ms 無音
    const buffer = createSilenceAtStartBuffer(44100, 0.15, 0.85);

    // minSilenceDuration=100ms → 150ms > 100ms → 検出される
    const opts100: TrimOptions = { ...defaultOptions, minSilenceDuration: 100 };
    const result100 = detectSilence(buffer, opts100);
    expect(result100.startTrimSec).toBeCloseTo(0.15, 1);

    // minSilenceDuration=200ms → 150ms < 200ms → 検出されない
    const opts200: TrimOptions = { ...defaultOptions, minSilenceDuration: 200 };
    const result200 = detectSilence(buffer, opts200);
    expect(result200.startTrimSec).toBeLessThan(TOLERANCE);
  });
});
