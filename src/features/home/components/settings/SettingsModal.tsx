import { useRef, type ReactElement, type RefObject } from 'react';
import { motion } from 'motion/react';
import type { ChangeEvent } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { DB, Locale, Theme } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { exportDB, parseIncomingDB, importData, saveDB } from '@shared/services/storageService';
import { SectionTitle } from '@shared/components';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { usePwaInstall } from '@shared/hooks/usePwaInstall';
import { Linkedin, User, X, Sun, Moon, Monitor, Download, Check } from 'lucide-react';
// import version from package.json
import pkg from '../../../../../package.json';

type SettingsModalProps = {
  copy: Copy;
  locale: Locale;
  theme: Theme;
  isSystemTheme: boolean;
  db: DB;
  animationsDisabled: boolean;
  onClose: () => void;
  onRequestClear: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: Theme | 'system') => void;
  onChangeAnimations: (disabled: boolean) => void;
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
  animationsDisabled,
  onClose,
  onRequestClear,
  onChangeLocale,
  onChangeTheme,
  onChangeAnimations,
  onChangeDB,
  clearButtonRef,
  trapEnabled = true,
}: SettingsModalProps): ReactElement => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences();
  const { isInstalled, isInstallable, install } = usePwaInstall(copy);

  useFocusTrap(trapEnabled, dialogRef, onClose);

  const handleExport = (): void => {
    const blob = new Blob([exportDB(db)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `enso_export_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
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
        className="relative w-full max-w-sm surface rounded-2xl border surface-border panel-shadow overflow-hidden"
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
            <X className="h-5 w-5" aria-hidden />
          </motion.button>
        </div>
        <div className="p-4 space-y-3">
          {/* Theme */}
          <div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <SectionTitle muted={false}>{copy.theme}</SectionTitle>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChangeTheme('system')}
                  className={classNames(
                    'flex-1 p-2 rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    isSystemTheme
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={isSystemTheme}
                  aria-label={(copy.system ?? 'System')}
                >
                  <Monitor className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('light')}
                  className={classNames(
                    'flex-1 p-2 rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    !isSystemTheme && theme === 'light'
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={!isSystemTheme && theme === 'light'}
                  aria-label={copy.light}
                >
                  <Sun className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('dark')}
                  className={classNames(
                    'flex-1 p-2 rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    !isSystemTheme && theme === 'dark'
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={!isSystemTheme && theme === 'dark'}
                  aria-label={copy.dark}
                >
                  <Moon className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t surface-border" />

          {/* Install App */}
          <div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="col-span-2">
                <SectionTitle muted={false}>{copy.installPwa}</SectionTitle>
              </div>
              <button
                type="button"
                onClick={isInstalled || !isInstallable ? undefined : install}
                disabled={isInstalled || !isInstallable}
                className={classNames(
                  'col-span-1 w-full px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center gap-2 transition-soft motion-ease',
                  isInstalled
                    ? 'btn-tonal opacity-50 cursor-not-allowed'
                    : isInstallable
                      ? 'btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]'
                      : 'btn-tonal opacity-50 cursor-not-allowed'
                )}
                aria-label={isInstalled ? 'Installed' : 'Install'}
              >
                {isInstalled ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Installed
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" aria-hidden />
                    Install
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="border-t surface-border" />

          {/* Language */}
          <div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="col-span-2">
                <SectionTitle muted={false}>{copy.language}</SectionTitle>
              </div>
              <div className="col-span-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChangeLocale('en')}
                  className={classNames(
                    'flex-1 px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    locale === 'en'
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={locale === 'en'}
                  aria-label="English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLocale('de')}
                  className={classNames(
                    'flex-1 px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    locale === 'de'
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={locale === 'de'}
                  aria-label="Deutsch"
                >
                  DE
                </button>
              </div>
            </div>
          </div>
          <div className="border-t surface-border" />

          {/* Animations */}
          <div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="col-span-2">
                <SectionTitle muted={false}>{copy.motionSettings}</SectionTitle>
              </div>
              <div className="col-span-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChangeAnimations(true)}
                  className={classNames(
                    'flex-1 px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    animationsDisabled
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={animationsDisabled}
                  aria-label={copy.disableAnimationsOff}
                >
                  {copy.disableAnimationsOff}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeAnimations(false)}
                  className={classNames(
                    'flex-1 px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    !animationsDisabled
                      ? 'btn-contrast'
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={!animationsDisabled}
                  aria-label={copy.disableAnimationsOn}
                >
                  {copy.disableAnimationsOn}
                </button>
              </div>
            </div>
          </div>
          <div className="border-t surface-border" />

          {/* Data */}
          <div>
            <SectionTitle muted={false}>{copy.data}</SectionTitle>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {/* Import */}
              <label className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border btn-tonal surface-hover transition-soft motion-ease cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-input-icon lucide-folder-input">
                  <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
                  <path d="M2 13h10" />
                  <path d="m9 16 3-3-3-3" />
                </svg>
                <span>{copy.import}</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const [file] = event.target.files ?? [];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const importedData = parseIncomingDB(String(reader.result));
                        const mergedDB = importData(db, importedData);
                        // Save the merged DB directly to localStorage before reloading
                        // This ensures data persists before the page reload happens
                        saveDB(mergedDB);
                        onChangeDB(mergedDB);
                        // Reload the page to apply imported preferences
                        window.location.reload();
                      } catch (error) {
                        const reason = error instanceof Error ? error.message : 'Unknown error';
                        window.alert(`Import failed: ${reason}`);
                      } finally {
                        // Clear the input so same file can be selected again
                        event.target.value = '';
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>

              {/* Reset (center) */}
              <button
                type="button"
                ref={clearButtonRef}
                onClick={onRequestClear}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-soft motion-ease"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eraser-icon lucide-eraser">
                  <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" />
                  <path d="m5.082 11.09 8.828 8.828" />
                </svg>
                <span>{copy.clear}</span>
              </button>

              {/* Export */}
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border btn-tonal surface-hover transition-soft motion-ease"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-output-icon lucide-folder-output">
                  <path d="M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5" />
                  <path d="M2 13h10" />
                  <path d="m5 10-3 3 3 3" />
                </svg>
                <span>{copy.export}</span>
              </button>
            </div>
          </div>
          {/* Footer: divider and single-line with centered name and icons */}
          <div className="-mx-4 mt-4">
            <div className="pt-4 border-t surface-border text-center text-xs text-muted px-4">
              {/* Wrapper for both footer lines with icons centered vertically between them */}
              <div className="relative flex flex-col">
                {/* Left and right icons positioned absolutely, centered vertically in the entire footer */}
                <div className="absolute left-4 inset-y-0 flex items-center">
                  <a
                    href="https://www.linkedin.com/in/itskylebrooks/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Kyle Brooks on LinkedIn"
                    className="text-current opacity-90"
                  >
                    <Linkedin className="h-5 w-5" aria-hidden />
                  </a>
                </div>

                <div className="absolute right-4 inset-y-0 flex items-center">
                  <a
                    href="https://itskylebrooks.tech/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Kyle Brooks personal website"
                    className="text-current opacity-90"
                  >
                    <User className="h-5 w-5" aria-hidden />
                  </a>
                </div>

                {/* Center text: author • version on one line */}
                <div className="leading-snug flex items-center justify-center gap-2">
                  <span className="truncate font-medium text-strong">Kyle Brooks</span>
                  <span>•</span>
                  <span className="truncate">Enso {pkg.version}</span>
                </div>

                {/* Legal links */}
                <div className="flex items-center justify-center gap-2.5 leading-snug mt-1">
                  <a className="underline" href="https://itskylebrooks.vercel.app/imprint" target="_blank" rel="noopener noreferrer">{(copy as unknown as Record<string, string>).footerImprint ?? 'Imprint'}</a>
                  <a className="underline" href="https://itskylebrooks.vercel.app/privacy" target="_blank" rel="noopener noreferrer">{(copy as unknown as Record<string, string>).footerPrivacy ?? 'Privacy Policy'}</a>
                  <a className="underline" href="https://itskylebrooks.vercel.app/license" target="_blank" rel="noopener noreferrer">{(copy as unknown as Record<string, string>).footerLicense ?? 'License'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};
