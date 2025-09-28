import { useRef, type ReactElement, type RefObject } from 'react';
import type { ChangeEvent } from 'react';
import type { Copy } from '../../constants/i18n';
import type { DB, Locale, Theme } from '../../types';
import { classNames } from '../../utils/classNames';
import { exportDB, parseIncomingDB } from '../../services/storageService';
import { SectionTitle } from '../common';
import { useFocusTrap } from '../../utils/useFocusTrap';

type SettingsModalProps = {
  copy: Copy;
  locale: Locale;
  theme: Theme;
  isSystemTheme: boolean;
  db: DB;
  onClose: () => void;
  onRequestClear: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: Theme | 'system') => void;
  onChangeDB: (db: DB) => void;
  clearButtonRef?: RefObject<HTMLButtonElement | null>;
  trapEnabled?: boolean;
};

export const SettingsModal = ({
  copy,
  locale,
  theme,
  isSystemTheme,
  db,
  onClose,
  onRequestClear,
  onChangeLocale,
  onChangeTheme,
  onChangeDB,
  clearButtonRef,
  trapEnabled = true,
}: SettingsModalProps): ReactElement => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(trapEnabled, dialogRef, onClose);

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

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        ref={dialogRef}
        className="w-full max-w-lg surface rounded-2xl border surface-border shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="p-4 border-b surface-border flex items-center justify-between">
          <h2 id="settings-title" className="font-semibold">
            {copy.settings}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            aria-label="Close"
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
                ref={clearButtonRef}
                onClick={onRequestClear}
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
