import { useCallback, useMemo, useState } from 'react';
import type { AudioFile, ProcessOptions } from './types/audio';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { WaveformViewer } from './components/WaveformViewer';
import { TrimControls } from './components/TrimControls';
import { VolumeControls } from './components/VolumeControls';
import { SpeedControls } from './components/SpeedControls';
import { BulkDownloadButton } from './components/DownloadButton';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { SILENCE_THRESHOLD, MIN_SILENCE_DURATION } from './constants/audio';

const DEFAULT_OPTIONS: ProcessOptions = {
  trim: {
    enabled: true,
    silenceThreshold: SILENCE_THRESHOLD,
    minSilenceDuration: MIN_SILENCE_DURATION,
  },
  volume: {
    enabled: false,
    mode: 'peak',
    targetDb: -3,
  },
  speed: {
    enabled: false,
    rate: 1.0,
    preservePitch: true,
  },
  outputFormat: 'wav',
};

/**
 * アプリケーションのルートコンポーネント。
 * ファイル一覧の state 管理、処理オプションの state 管理、
 * および逐次処理フローを担当する。
 */
export default function App() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [processOptions, setProcessOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const { processFile, ffmpegLoaded, ffmpegLoading, ffmpegLoadProgress } = useAudioProcessor();

  // ファイル追加
  const handleFilesAccepted = useCallback((files: File[]) => {
    const newFiles: AudioFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'idle',
    }));
    setAudioFiles((prev) => [...prev, ...newFiles]);
    // 選択中ファイルがなければ最初の新規ファイルを即選択して波形表示
    setSelectedFileId((prev) => prev ?? newFiles[0]?.id ?? null);
  }, []);

  // ファイル削除
  const handleRemoveFile = useCallback((id: string) => {
    setAudioFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  }, [selectedFileId]);

  // 処理実行（逐次処理でメモリ枯渇防止）
  const handleProcess = useCallback(async () => {
    const idleFiles = audioFiles.filter((f) => f.status === 'idle' || f.status === 'error');
    if (idleFiles.length === 0 || isProcessing) return;

    setIsProcessing(true);

    for (const audioFile of idleFiles) {
      // ステータスを processing に変更
      setAudioFiles((prev) =>
        prev.map((f) =>
          f.id === audioFile.id ? { ...f, status: 'processing', errorMessage: undefined } : f
        )
      );

      try {
        const result = await processFile(audioFile.file, processOptions);
        setAudioFiles((prev) =>
          prev.map((f) =>
            f.id === audioFile.id
              ? { ...f, status: 'done', processResult: result }
              : f
          )
        );
        // 最初の処理完了ファイルを選択して波形プレビューに表示
        setSelectedFileId((prev) => prev ?? audioFile.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : '処理中にエラーが発生しました';
        setAudioFiles((prev) =>
          prev.map((f) =>
            f.id === audioFile.id
              ? { ...f, status: 'error', errorMessage: message }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  }, [audioFiles, isProcessing, processFile, processOptions]);

  // リセット
  const handleReset = useCallback(() => {
    setAudioFiles([]);
    setSelectedFileId(null);
  }, []);

  // 選択中ファイルの波形表示用データ
  const selectedFile = audioFiles.find((f) => f.id === selectedFileId);
  // selectedFile.id が変わった時のみ Blob を再生成（毎レンダリングでの無駄な生成を防ぐ）
  const originalBlob = useMemo(
    () => selectedFile ? new Blob([selectedFile.file], { type: selectedFile.file.type }) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFile?.id],
  );
  const processedBlob = selectedFile?.processResult?.blob ?? null;

  const idleCount = audioFiles.filter((f) => f.status === 'idle' || f.status === 'error').length;
  const doneCount = audioFiles.filter((f) => f.status === 'done').length;

  if (!ffmpegLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-white font-semibold text-lg">Sound Converter</h1>
        </div>

        <div className="w-72 space-y-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              音声処理エンジンを準備中...
            </span>
            <span className="text-green-400 font-mono">{ffmpegLoadProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${ffmpegLoadProgress}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight">Sound Converter</h1>
              <p className="text-gray-500 text-xs">ゲーム音声素材整形ツール</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>ブラウザ完結処理（サーバー送信なし）</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 左カラム: 設定パネル */}
          <aside className="lg:col-span-1 space-y-4">
            <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-wide">処理設定</h2>

            <TrimControls
              options={processOptions.trim}
              onChange={(trim) => setProcessOptions((prev) => ({ ...prev, trim }))}
            />

            <VolumeControls
              options={processOptions.volume}
              onChange={(volume) => setProcessOptions((prev) => ({ ...prev, volume }))}
            />

            <SpeedControls
              options={processOptions.speed}
              onChange={(speed) => setProcessOptions((prev) => ({ ...prev, speed }))}
            />

            {/* 出力フォーマット */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
              <h3 className="text-gray-200 text-sm font-semibold mb-3">出力フォーマット</h3>
              <div className="flex gap-2">
                {(['wav', 'mp3', 'ogg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setProcessOptions((prev) => ({ ...prev, outputFormat: fmt }))}
                    className={`
                      flex-1 py-2 rounded-lg text-sm font-medium uppercase
                      transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                      ${processOptions.outputFormat === fmt
                        ? 'bg-green-700 text-white focus:ring-green-500'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600 focus:ring-gray-500'}
                    `}
                    aria-pressed={processOptions.outputFormat === fmt}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 右カラム: メインエリア */}
          <div className="lg:col-span-2 space-y-6">
            {/* ドロップゾーン */}
            <DropZone onFilesAccepted={handleFilesAccepted} />

            {/* FFmpeg ロード進捗 */}
            {ffmpegLoading && (
              <div
                className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span className="text-yellow-300 text-sm font-medium">FFmpeg.wasm をロード中...</span>
                  <span className="text-yellow-400 text-sm font-mono">{ffmpegLoadProgress}%</span>
                </div>
                <div className="h-1.5 bg-yellow-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${ffmpegLoadProgress}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {/* ファイル一覧 */}
            {audioFiles.length > 0 && (
              <>
                <FileList files={audioFiles} onRemove={handleRemoveFile} />

                {/* 処理ボタンエリア */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={isProcessing || idleCount === 0}
                    className="
                      flex items-center gap-2 px-6 py-3 rounded-xl
                      bg-green-600 hover:bg-green-500 active:bg-green-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-white font-semibold text-sm
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                      shadow-lg shadow-green-900/30
                    "
                    aria-label={isProcessing ? '処理中' : `${idleCount}件のファイルを処理`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        処理中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {idleCount > 0 ? `${idleCount}件を処理` : '処理済み'}
                      </>
                    )}
                  </button>

                  {doneCount > 0 && (
                    <BulkDownloadButton files={audioFiles} />
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="
                      px-4 py-3 rounded-xl
                      bg-gray-700 hover:bg-gray-600 active:bg-gray-800
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-gray-300 text-sm font-medium
                      transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900
                    "
                  >
                    リセット
                  </button>
                </div>

                {/* 波形プレビュー（ファイル選択時に表示） */}
                {selectedFile && (
                  <div>
                    {/* ファイル選択タブ（複数ファイル時） */}
                    {audioFiles.length > 1 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {audioFiles.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedFileId(f.id)}
                            className={`
                              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-colors duration-150
                              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-gray-900
                              ${selectedFileId === f.id
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}
                            `}
                            aria-pressed={selectedFileId === f.id}
                          >
                            {f.status === 'processing' && (
                              <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                            )}
                            {f.status === 'error' && (
                              <span className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
                            )}
                            {f.status === 'done' && (
                              <span className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
                            )}
                            {f.file.name.length > 20
                              ? `${f.file.name.slice(0, 20)}...`
                              : f.file.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <WaveformViewer
                      originalBlob={originalBlob}
                      processedBlob={processedBlob}
                    />
                  </div>
                )}
              </>
            )}

            {/* ファイルが空の場合のガイド */}
            {audioFiles.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-sm">上のエリアにファイルをドロップするか、クリックして選択してください</p>
                <p className="text-xs mt-1">WAV, MP3, OGG 形式対応 — 最大 200MB</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-800 mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-xs">
          <p>Sound Converter — すべての処理はブラウザ内で完結します。ファイルはサーバーに送信されません。</p>
        </div>
      </footer>
    </div>
  );
}
