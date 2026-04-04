import { describe, it, expect } from 'vitest';
import { validateFile } from '../../src/utils/file/validateFile';
import { MAX_FILE_SIZE } from '../../src/constants/audio';

describe('validateFile', () => {
  /**
   * U-22: WAV ファイルを受け入れる
   */
  it('U-22: WAV ファイルはバリデーション成功', () => {
    const result = validateFile({ name: 'test.wav', type: 'audio/wav', size: 1_000_000 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  /**
   * U-23: MP3 ファイルを受け入れる
   */
  it('U-23: MP3 ファイルはバリデーション成功', () => {
    const result = validateFile({ name: 'test.mp3', type: 'audio/mpeg', size: 1_000_000 });
    expect(result.valid).toBe(true);
  });

  /**
   * U-24: OGG ファイルを受け入れる
   */
  it('U-24: OGG ファイルはバリデーション成功', () => {
    const result = validateFile({ name: 'test.ogg', type: 'audio/ogg', size: 1_000_000 });
    expect(result.valid).toBe(true);
  });

  /**
   * U-25: 非対応フォーマット（FLAC）を拒否する
   */
  it('U-25: FLAC ファイルはエラーを返す', () => {
    const result = validateFile({ name: 'test.flac', type: 'audio/flac', size: 1_000_000 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/対応していない/);
  });

  /**
   * U-26: テキストファイルを拒否する
   */
  it('U-26: テキストファイルはエラーを返す', () => {
    const result = validateFile({ name: 'test.txt', type: 'text/plain', size: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  /**
   * U-27: 画像ファイルを拒否する
   */
  it('U-27: 画像ファイルはエラーを返す', () => {
    const result = validateFile({ name: 'image.png', type: 'image/png', size: 500_000 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  /**
   * U-28: ファイルサイズ上限（200MB）以下を受け入れる
   */
  it('U-28: 200MB ちょうどはバリデーション成功', () => {
    const result = validateFile({ name: 'test.wav', type: 'audio/wav', size: MAX_FILE_SIZE });
    expect(result.valid).toBe(true);
  });

  /**
   * U-29: ファイルサイズ上限（200MB）超過を拒否する
   */
  it('U-29: 200MB + 1byte はエラーを返す', () => {
    const result = validateFile({ name: 'test.wav', type: 'audio/wav', size: MAX_FILE_SIZE + 1 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/上限/);
  });

  /**
   * U-30: 0バイトファイルを拒否する
   */
  it('U-30: 0バイトファイルはエラーを返す', () => {
    const result = validateFile({ name: 'empty.wav', type: 'audio/wav', size: 0 });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/空/);
  });

  /**
   * U-31: MIME type が空でも拡張子 .wav で判定する
   */
  it('U-31: MIME type が空でも拡張子 .wav で成功する', () => {
    const result = validateFile({ name: 'test.wav', type: '', size: 1_000_000 });
    // 拡張子 .wav は対応しているため成功
    expect(result.valid).toBe(true);
  });
});
