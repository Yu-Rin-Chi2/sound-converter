import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * FFmpeg.wasm の遅延ロードを管理するフック。
 * load() を呼び出した時点で初めてロードを開始する。
 * ffmpeg-core.wasm は数十 MB あるため、必要になるまでロードしない。
 *
 * loadPromiseRef によって、ロード中に複数の呼び出しが来た場合でも
 * 同一の Promise を共有し、競合状態を防ぐ。
 *
 * ffmpeg.on('progress') は処理中のみ発火しロード中は発火しないため、
 * setInterval によるシミュレーテッドプログレスでバーを動かす。
 */
export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadPromiseRef = useRef<Promise<FFmpeg | null> | null>(null);
  const simulatedIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // 既にロード済みの場合はそのまま返す
    if (ffmpegRef.current) return ffmpegRef.current;

    // ロード中の場合は同じ Promise を共有して競合を防ぐ
    if (loadPromiseRef.current) return loadPromiseRef.current;

    const promise = (async () => {
      setIsLoading(true);
      setLoadError(null);
      setLoadProgress(0);

      // WASM ダウンロード中は progress イベントが発火しないため setInterval で疑似進捗を表示
      let fakeProgress = 0;
      simulatedIntervalRef.current = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + Math.random() * 4 + 1, 85);
        setLoadProgress(Math.round(fakeProgress));
      }, 200);

      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        // CDN からロード（SharedArrayBuffer 対応環境が必要）
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
        });

        clearInterval(simulatedIntervalRef.current);
        setIsLoaded(true);
        setLoadProgress(100);
        return ffmpeg;
      } catch (err) {
        clearInterval(simulatedIntervalRef.current);
        const message = err instanceof Error ? err.message : 'FFmpeg のロードに失敗しました';
        setLoadError(message);
        ffmpegRef.current = null;
        loadPromiseRef.current = null;
        return null;
      } finally {
        setIsLoading(false);
      }
    })();

    loadPromiseRef.current = promise;
    return promise;
  }, []); // isLoaded / isLoading を依存配列から除外し、ref で状態を判断する

  return {
    ffmpeg: ffmpegRef.current,
    isLoaded,
    isLoading,
    loadProgress,
    loadError,
    load,
  };
}
