import { useRef, type ReactElement, type RefObject } from 'react';
import { motion } from 'motion/react';
import type { ChangeEvent } from 'react';
import type { Copy } from '../../constants/i18n';
import type { DB, Locale, Theme } from '../../types';
import { classNames } from '../../utils/classNames';
import { exportDB, parseIncomingDB } from '../../services/storageService';
import { SectionTitle } from '../common';
import { useFocusTrap } from '../../utils/useFocusTrap';
import { useMotionPreferences } from '../ui/motion';
// import version from package.json
import pkg from '../../../package.json';

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
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences();

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
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 sm:px-0 bg-black/45"
      variants={overlayMotion.backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={overlayMotion.transition}
      onClick={onClose}
      style={{ backdropFilter: prefersReducedMotion ? 'blur(8px)' : undefined }}
    >
      <motion.div
        ref={dialogRef}
        className="relative w-full max-w-md surface rounded-2xl border surface-border shadow-xl overflow-hidden"
        variants={overlayMotion.panel}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={overlayMotion.panelTransition}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="p-4 border-b surface-border flex items-center justify-between">
          <h2 id="settings-title" className="font-semibold">
            {copy.settings}
          </h2>
          <motion.button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-sm rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            variants={overlayMotion.closeButton}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={toggleTransition}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x" aria-hidden>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </motion.button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <SectionTitle>{copy.language}</SectionTitle>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onChangeLocale('en')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm transition-soft motion-ease',
                  locale === 'en' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLocale('de')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm transition-soft motion-ease',
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
                  'px-3 py-1.5 rounded-lg border text-sm transition-soft motion-ease',
                  isSystemTheme ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.system ?? 'System'}
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm transition-soft motion-ease',
                  !isSystemTheme && theme === 'light' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.light}
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg border text-sm transition-soft motion-ease',
                  !isSystemTheme && theme === 'dark' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
              >
                {copy.dark}
              </button>
            </div>
          </div>
          <div>
            <SectionTitle>{copy.bookmarks}</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease"
              >
                {copy.import}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease"
              >
                {copy.export}
              </button>
              <button
                type="button"
                ref={clearButtonRef}
                onClick={onRequestClear}
                className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease"
              >
                {copy.clear}
              </button>
            </div>
          </div>
          {/* Footer: full-width divider and centered content */}
          <div className="-mx-4 mt-4">
            <div className="pt-4 border-t surface-border text-center text-xs text-muted px-4">
              <div>Enso {pkg.version}</div>
              <div className="relative flex items-center justify-center py-1">
                {/* left icon container, vertically centered with this row */}
                <div className="absolute left-4 inset-y-0 flex items-center">
                  <a href="/about" className="text-current" aria-label="About">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </a>
                </div>

                <div>© {new Date().getFullYear()} Kyle Brooks. All rights reserved.</div>

                {/* right icon container, vertically centered with this row */}
                <div className="absolute right-4 inset-y-0 flex items-center">
                  <a href="https://itskylebrooks.vercel.app/" target="_blank" rel="noreferrer" className="text-current" aria-label="Kyle Brooks website">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-arrow-out-up-right" aria-hidden>
                      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                      <path d="m21 3-9 9" />
                      <path d="M15 3h6v6" />
                    </svg>
                  </a>
                </div>
              </div>

              <div>
                Icons by{' '}
                <a href="https://lucide.dev/" target="_blank" rel="noreferrer" className="underline">
                  Lucide
                </a>
                .
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
    </motion.div>
  );
};
