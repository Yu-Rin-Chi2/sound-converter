import { useTranslation } from 'react-i18next';
import type { AudioFile } from '../../types/audio';
import { FileListItem } from './FileListItem';

type Props = {
  files: AudioFile[];
  onRemove: (id: string) => void;
};

/**
 * アップロード済みファイルの一覧を表示するコンポーネント。
 * ファイルが0件の場合は何も表示しない。
 */
export const FileList = ({ files, onRemove }: Props) => {
  const { t } = useTranslation();

  if (files.length === 0) return null;

  return (
    <section aria-label={t('fileList.ariaLabel')}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-300 text-sm font-medium">
          {t('fileList.title')}
          <span className="ml-2 text-gray-500">{t('fileList.count', { count: files.length })}</span>
        </h2>
      </div>

      <div className="space-y-2">
        {files.map((audioFile) => (
          <FileListItem
            key={audioFile.id}
            audioFile={audioFile}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
};
