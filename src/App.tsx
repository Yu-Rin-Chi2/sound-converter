import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AudioFile, ProcessOptions } from './types/audio';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { WaveformViewer } from './components/WaveformViewer';
import { TrimControls } from './components/TrimControls';
import { VolumeControls } from './components/VolumeControls';
import { SpeedControls } from './components/SpeedControls';
import { BulkDownloadButton, IndividualDownloadButton } from './components/DownloadButton';
import { SiteNavBar } from './components/SiteNavBar';
import { TermsModal } from './components/TermsModal';
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
  const { t } = useTranslation();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [processOptions, setProcessOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // 共通UI state
  const [termsOpen, setTermsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    const targetFiles = audioFiles.filter((f) => f.status !== 'processing');
    if (targetFiles.length === 0 || isProcessing) return;

    setIsProcessing(true);

    for (const audioFile of targetFiles) {
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
        const message = err instanceof Error ? err.message : t('errors.processingError');
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
  }, [audioFiles, isProcessing, processFile, processOptions, t]);

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

  const doneCount = audioFiles.filter((f) => f.status === 'done').length;

  // シェアポップアップの外クリックで閉じる
  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareOpen]);

  // copyTimerRef のクリーンアップ
  useEffect(() => {
    return () => { clearTimeout(copyTimerRef.current); };
  }, []);

  const handleCopyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
    } catch {
      // Clipboard API が利用できない環境（HTTP 等）ではサイレントに失敗
      console.warn('Clipboard API not available');
    }
  };

  if (!ffmpegLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <SiteNavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-white font-semibold text-lg">Easy Sound Converter</h1>
          </div>

          <div className="w-72 space-y-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                {t('app.loading')}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <SiteNavBar />

      {/* ヘッダー */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-8 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-white font-semibold text-lg leading-tight">Easy Sound Converter</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 左カラム: 設定パネル */}
          <aside className="lg:col-span-1 space-y-4">
            <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-wide">{t('app.settingsTitle')}</h2>

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
              <h3 className="text-gray-200 text-sm font-semibold mb-3">{t('app.outputFormat')}</h3>
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
                  <span className="text-yellow-300 text-sm font-medium">{t('app.ffmpegLoading')}</span>
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
                    disabled={isProcessing || audioFiles.length === 0}
                    className="
                      flex items-center gap-2 px-6 py-3 rounded-xl
                      bg-green-600 hover:bg-green-500 active:bg-green-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-white font-semibold text-sm
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                      shadow-lg shadow-green-900/30
                    "
                    aria-label={isProcessing ? t('app.processingAriaLabel') : t('app.processAriaLabel', { count: audioFiles.length })}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        {t('app.processingButton')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('app.processButton', { count: audioFiles.length })}
                      </>
                    )}
                  </button>

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
                    {t('app.resetButton')}
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

                    {/* ダウンロードエリア */}
                    {selectedFile.status === 'done' && selectedFile.processResult && (
                      <div className="flex items-center gap-3 flex-wrap pt-2">
                        <IndividualDownloadButton
                          result={selectedFile.processResult}
                          filename={`${selectedFile.file.name.replace(/\.[^/.]+$/, '')}_converted.${
                            selectedFile.processResult.blob.type.includes('ogg') ? 'ogg'
                            : selectedFile.processResult.blob.type.includes('mpeg') ? 'mp3'
                            : 'wav'
                          }`}
                        />
                        {doneCount > 1 && <BulkDownloadButton files={audioFiles} />}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ファイルが空の場合のガイド */}
            {audioFiles.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-sm">{t('app.emptyGuide')}</p>
                <p className="text-xs mt-1">{t('app.emptyGuideFormats')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-slate-400">
          {/* 左: 著作権 + バージョン */}
          <span className="flex items-center gap-2">
            <span>{t('app.copyright')}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>v{__APP_VERSION__}</span>
          </span>

          {/* 右: リンク群 */}
          <nav className="flex items-center gap-4" aria-label={t('app.ariaFooter')}>
            {/* X リンク */}
            <a
              href="https://x.com/mitakamikata"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              aria-label={t('app.ariaContact')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t('app.contact')}
            </a>

            {/* GitHub リンク */}
            <a
              href="https://github.com/Yu-Rin-Chi2/image-converter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              aria-label={t('app.ariaGithub')}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>

            {/* シェアボタン（ドロップダウン） */}
            <div className="relative" ref={shareRef}>
              <button
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                aria-haspopup="true"
                aria-expanded={shareOpen}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {t('app.share')}
              </button>

              {shareOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-slate-700 bg-slate-900 shadow-lg overflow-hidden">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t('app.shareText'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                    onClick={() => setShareOpen(false)}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {t('app.shareX')}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('app.copied')}
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t('app.copyUrl')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 利用規約ボタン */}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="hover:underline hover:text-slate-200 transition-colors"
            >
              {t('app.terms')}
            </button>
          </nav>
        </div>
      </footer>

      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
