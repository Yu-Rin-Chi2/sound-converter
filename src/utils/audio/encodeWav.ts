/**
 * AudioBuffer を WAV 形式の Blob にエンコードする。
 * Web Audio API は WAV エクスポート機能を持たないため、
 * RIFF/WAV フォーマットのバイナリを手動で構築する。
 *
 * WAV フォーマット:
 * - RIFF チャンク (12 bytes)
 * - fmt チャンク (24 bytes)
 * - data チャンク (8 bytes + PCM データ)
 */
export function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // RIFF チャンク
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);      // ファイルサイズ - 8
  writeString(view, 8, 'WAVE');

  // fmt チャンク
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                // チャンクサイズ（PCM = 16）
  view.setUint16(20, 1, true);                 // オーディオフォーマット（PCM = 1）
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data チャンク
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // インターリーブした PCM データを書き込む
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i];
      // Float32 → Int16 に変換（クランプ付き）
      const int16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
