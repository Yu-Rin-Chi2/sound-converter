import { useCallback, useEffect } from 'react';
import type { ProcessOptions, ProcessResult } from '../types/audio';
import { detectSilence } from '../utils/audio/detectSilence';
import { trimAudio } from '../utils/audio/trimAudio';
import { normalizeVolume } from '../utils/audio/normalizeVolume';
import { limitVolume } from '../utils/audio/limitVolume';
import { encodeWav } from '../utils/audio/encodeWav';
import { useFFmpeg } from './useFFmpeg';

/**
 * 音声ファイルの処理フロー全体を管理するフック。
 * decodeAudioData → detectSilence → trimAudio → volume処理 → 出力
 */
export function useAudioProcessor() {
  const { load: loadFFmpeg, isLoaded: ffmpegLoaded, isLoading: ffmpegLoading, loadProgress } = useFFmpeg();

  // ページ表示と同時にバックグラウンドでプリロード
  useEffect(() => {
    void loadFFmpeg();
  }, [loadFFmpeg]);

  const processFile = useCallback(
    async (file: File, options: ProcessOptions): Promise<ProcessResult> => {
      // ArrayBuffer に変換
      const arrayBuffer = await file.arrayBuffer();

      // Web Audio API でデコード
      const audioCtx = new AudioContext();
      let buffer: AudioBuffer;
      try {
        buffer = await audioCtx.decodeAudioData(arrayBuffer);
      } finally {
        await audioCtx.close();
      }

      const originalDuration = buffer.duration;

      // 無音検出・トリミング
      let startTrimMs = 0;
      let endTrimMs = 0;

      if (options.trim.enabled) {
        const trimResult = detectSilence(buffer, options.trim);
        startTrimMs = trimResult.startTrimSec * 1000;
        endTrimMs = trimResult.endTrimSec * 1000;

        if (trimResult.startTrimSec > 0 || trimResult.endTrimSec > 0) {
          buffer = trimAudio(buffer, trimResult);
        }
      }

      // 音量処理
      if (options.volume.enabled) {
        if (options.volume.mode === 'limit') {
          buffer = limitVolume(buffer, options.volume);
        } else {
          buffer = normalizeVolume(buffer, options.volume);
        }
      }

      const processedDuration = buffer.duration;

      // 速度変更が必要、または MP3/OGG 出力の場合は FFmpeg を使用
      const needsFFmpeg =
        (options.speed.enabled && options.speed.rate !== 1.0) ||
        options.outputFormat === 'mp3' ||
        options.outputFormat === 'ogg';

      let blob: Blob;

      if (needsFFmpeg) {
        // FFmpeg を遅延ロード
        const ffmpeg = await loadFFmpeg();
        if (!ffmpeg) {
          throw new Error('FFmpeg のロードに失敗しました。WAV 形式で出力してください。');
        }

        // まず WAV に変換してから FFmpeg に渡す
        const wavBlob = encodeWav(buffer);
        const wavArrayBuffer = await wavBlob.arrayBuffer();
        let inputData = new Uint8Array(wavArrayBuffer);
        const inputFilename = `input_${Date.now()}.wav`;

        // Uint8Array を純粋な ArrayBuffer ベースに正規化するヘルパー
        const toCleanUint8Array = (src: Uint8Array): Uint8Array<ArrayBuffer> => {
          const ab = new ArrayBuffer(src.byteLength);
          new Uint8Array(ab).set(src);
          return new Uint8Array(ab);
        };

        // 速度変更
        if (options.speed.enabled && options.speed.rate !== 1.0) {
          const { adjustSpeed } = await import('../utils/audio/adjustSpeed');
          const speedResult = await adjustSpeed(inputData, options.speed, ffmpeg, inputFilename, buffer.sampleRate);
          inputData = toCleanUint8Array(speedResult);
        }

        // フォーマット変換
        if (options.outputFormat === 'mp3' || options.outputFormat === 'ogg') {
          const { fetchFile } = await import('@ffmpeg/util');
          const ext = options.outputFormat;
          const outputFilename = `output_${Date.now()}.${ext}`;
          const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'audio/ogg';

          // 速度変更済みデータをFFmpegに書き込む
          const tempInputName = `temp_input_${Date.now()}.wav`;
          await ffmpeg.writeFile(tempInputName, inputData);

          await ffmpeg.exec(['-i', tempInputName, outputFilename]);
          const result = await ffmpeg.readFile(outputFilename);
          await ffmpeg.deleteFile(tempInputName);
          await ffmpeg.deleteFile(outputFilename);

          const rawData = result instanceof Uint8Array ? result : await fetchFile(result);
          blob = new Blob([toCleanUint8Array(rawData)], { type: mimeType });
        } else {
          blob = new Blob([toCleanUint8Array(inputData)], { type: 'audio/wav' });
        }
      } else {
        // WAV 出力（FFmpeg 不要）
        blob = encodeWav(buffer);
      }

      return {
        originalDuration,
        processedDuration,
        startTrimMs,
        endTrimMs,
        blob,
      };
    },
    [loadFFmpeg],
  );

  return {
    processFile,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegLoadProgress: loadProgress,
  };
}
