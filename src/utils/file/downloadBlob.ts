/**
 * Blob をファイルとしてダウンロードするヘルパー関数。
 * 一時的な <a> タグを生成してクリックし、即座に破棄する。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // メモリリーク防止のため URL を解放
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
