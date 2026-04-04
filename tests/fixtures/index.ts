/**
 * テスト用合成音声 AudioBuffer を生成するヘルパー関数群。
 * OfflineAudioContext を使わずに直接 AudioBuffer をモックして生成する。
 */

/**
 * モック AudioBuffer を生成する。
 * jsdom では AudioBuffer が未実装のため、プレーン JS オブジェクトで代替する。
 */
function createMockAudioBuffer(
  sampleRate: number,
  length: number,
  channels: number,
  channelData: Float32Array[],
): AudioBuffer {
  return {
    sampleRate,
    length,
    duration: length / sampleRate,
    numberOfChannels: channels,
    getChannelData: (channel: number) => channelData[channel],
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

/**
 * dBFS を線形振幅に変換する。
 */
function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * 無音バッファを生成する（全サンプルが 0.0）。
 */
export function createSilentBuffer(
  sampleRate: number,
  durationSec: number,
  channels: number = 1,
): AudioBuffer {
  const length = Math.floor(sampleRate * durationSec);
  const channelData = Array.from({ length: channels }, () => new Float32Array(length));
  return createMockAudioBuffer(sampleRate, length, channels, channelData);
}

/**
 * サイン波トーンバッファを生成する。
 *
 * @param amplitudeDb 振幅（dBFS）— 例: -10 は 0.316...
 */
export function createToneBuffer(
  sampleRate: number,
  durationSec: number,
  channels: number = 1,
  frequency: number = 440,
  amplitudeDb: number = -10,
): AudioBuffer {
  const length = Math.floor(sampleRate * durationSec);
  const amplitude = dbToLinear(amplitudeDb);
  const channelData = Array.from({ length: channels }, () => {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      data[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }
    return data;
  });
  return createMockAudioBuffer(sampleRate, length, channels, channelData);
}

/**
 * 先頭のみ無音のパターン。
 * [無音 silenceDurationSec] + [トーン toneDurationSec]
 */
export function createSilenceAtStartBuffer(
  sampleRate: number,
  silenceDurationSec: number,
  toneDurationSec: number,
  channels: number = 1,
): AudioBuffer {
  const silenceSamples = Math.floor(sampleRate * silenceDurationSec);
  const toneSamples = Math.floor(sampleRate * toneDurationSec);
  const totalSamples = silenceSamples + toneSamples;
  const amplitude = dbToLinear(-10);

  const channelData = Array.from({ length: channels }, () => {
    const data = new Float32Array(totalSamples);
    for (let i = silenceSamples; i < totalSamples; i++) {
      data[i] = amplitude * Math.sin((2 * Math.PI * 440 * (i - silenceSamples)) / sampleRate);
    }
    return data;
  });
  return createMockAudioBuffer(sampleRate, totalSamples, channels, channelData);
}

/**
 * 末尾のみ無音のパターン。
 * [トーン toneDurationSec] + [無音 silenceDurationSec]
 */
export function createSilenceAtEndBuffer(
  sampleRate: number,
  toneDurationSec: number,
  silenceDurationSec: number,
  channels: number = 1,
): AudioBuffer {
  const toneSamples = Math.floor(sampleRate * toneDurationSec);
  const silenceSamples = Math.floor(sampleRate * silenceDurationSec);
  const totalSamples = toneSamples + silenceSamples;
  const amplitude = dbToLinear(-10);

  const channelData = Array.from({ length: channels }, () => {
    const data = new Float32Array(totalSamples);
    for (let i = 0; i < toneSamples; i++) {
      data[i] = amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }
    return data;
  });
  return createMockAudioBuffer(sampleRate, totalSamples, channels, channelData);
}

/**
 * 先頭・末尾両方に無音のパターン。
 * [無音 silenceStart] + [トーン toneDuration] + [無音 silenceEnd]
 */
export function createSilenceBothEndsBuffer(
  sampleRate: number,
  silenceStartSec: number,
  toneDurationSec: number,
  silenceEndSec: number,
  channels: number = 1,
): AudioBuffer {
  const silenceStartSamples = Math.floor(sampleRate * silenceStartSec);
  const toneSamples = Math.floor(sampleRate * toneDurationSec);
  const silenceEndSamples = Math.floor(sampleRate * silenceEndSec);
  const totalSamples = silenceStartSamples + toneSamples + silenceEndSamples;
  const amplitude = dbToLinear(-10);

  const channelData = Array.from({ length: channels }, () => {
    const data = new Float32Array(totalSamples);
    for (let i = silenceStartSamples; i < silenceStartSamples + toneSamples; i++) {
      data[i] = amplitude * Math.sin((2 * Math.PI * 440 * (i - silenceStartSamples)) / sampleRate);
    }
    return data;
  });
  return createMockAudioBuffer(sampleRate, totalSamples, channels, channelData);
}

/**
 * 特定の振幅 (dBFS) で無音部分を生成するヘルパー。
 * 全区間が指定 dBFS のホワイトノイズで構成されるバッファを返す。
 */
export function createNoisyBuffer(
  sampleRate: number,
  durationSec: number,
  amplitudeDb: number,
  channels: number = 1,
): AudioBuffer {
  const length = Math.floor(sampleRate * durationSec);
  const amplitude = dbToLinear(amplitudeDb);

  const channelData = Array.from({ length: channels }, () => {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      // ±amplitude の範囲の確定的なノイズ（テストの再現性のため sin で生成）
      data[i] = amplitude * Math.sin(i * 0.1);
    }
    return data;
  });
  return createMockAudioBuffer(sampleRate, length, channels, channelData);
}

/**
 * OfflineAudioContext のモック（createBuffer に対応）。
 */
export function mockOfflineAudioContext() {
  return {
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const channelData = Array.from({ length: channels }, () => new Float32Array(length));
      return createMockAudioBuffer(sampleRate, length, channels, channelData);
    },
  };
}
