import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Copy } from '../../constants/i18n';
import type { DB, Locale, Theme } from '../../types';
import { classNames } from '../../utils/classNames';
import { clearDB, exportDB, parseIncomingDB } from '../../services/storageService';
import { SectionTitle } from '../common';

type SettingsModalProps = {
  copy: Copy;
  locale: Locale;
  theme: Theme;
  isSystemTheme: boolean;
  db: DB;
  onClose: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: Theme | 'system') => void;
  onChangeDB: (db: DB) => void;
};

export const SettingsModal = ({
  copy,
  locale,
  theme,
  isSystemTheme,
  db,
  onClose,
  onChangeLocale,
  onChangeTheme,
  onChangeDB,
}: SettingsModalProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (): void => {
    const blob = new Blob([exportDB(db)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `enso_export_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const [file] = event.target.files ?? [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseIncomingDB(String(reader.result));
        onChangeDB(next);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        window.alert(`Import failed: ${reason}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = (): void => {
    const confirmation = window.prompt('Type CLEAR to delete all local data');
    if (confirmation === 'CLEAR') {
      onChangeDB(clearDB());
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg surface rounded-2xl border surface-border shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b surface-border flex items-center justify-between">
          <h2 className="font-semibold">{copy.settings}</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg border btn-tonal surface-hover"
          >
            Close
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <SectionTitle>{copy.language}</SectionTitle>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onChangeLocale('en')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  locale === 'en' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLocale('de')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  locale === 'de' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                DE
              </button>
            </div>
          </div>
          <div>
            <SectionTitle>{copy.theme}</SectionTitle>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onChangeTheme('system')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  isSystemTheme ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.system ?? 'System'}
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  !isSystemTheme && theme === 'light' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.light}
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm',
                  !isSystemTheme && theme === 'dark' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.dark}
              </button>
            </div>
          </div>
          <div>
            <SectionTitle>Data</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl border btn-tonal surface-hover"
              >
                {copy.import}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 rounded-xl border btn-tonal surface-hover"
              >
                {copy.export}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl border btn-tonal surface-hover"
              >
                {copy.clear}
              </button>
            </div>
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
    </div>
  );
};
