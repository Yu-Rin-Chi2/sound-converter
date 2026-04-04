import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

/**
 * wavesurfer.js を使って波形を表示するフック。
 * containerRef が指す DOM 要素に波形を描画する。
 * audioBlob が変わるたびに波形を再描画する。
 * options.waveColor / options.progressColor で Before と After を色分けできる。
 */
export function useWaveform(
  containerRef: React.RefObject<HTMLDivElement | null>,
  audioBlob: Blob | null,
  options?: { waveColor?: string; progressColor?: string },
) {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 既存インスタンスを破棄
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    setIsPlaying(false);

    if (!audioBlob) {
      setIsReady(false);
      setDuration(0);
      return;
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: options?.waveColor ?? '#4ade80',       // デフォルト: green-400
      progressColor: options?.progressColor ?? '#16a34a', // デフォルト: green-600
      cursorColor: '#86efac',     // green-300
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      interact: true,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    ws.on('error', () => {
      setIsReady(false);
    });

    const url = URL.createObjectURL(audioBlob);
    ws.load(url);

    return () => {
      ws.destroy();
      URL.revokeObjectURL(url);
      wavesurferRef.current = null;
    };
  }, [containerRef, audioBlob, options?.waveColor, options?.progressColor]);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  return { isReady, duration, isPlaying, togglePlay };
}
