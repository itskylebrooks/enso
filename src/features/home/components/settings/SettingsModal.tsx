import { useRef, type ReactElement, type RefObject } from 'react';
import { motion } from 'motion/react';
import type { ChangeEvent } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { DB, Locale, Theme } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { exportDB, parseIncomingDB, importData } from '@shared/services/storageService';
import { SectionTitle } from '@shared/components';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { Info, SquareArrowOutUpRight, X } from 'lucide-react';
// import version from package.json
import pkg from '../../../../../package.json';

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
  onNavigateToFeedback?: () => void;
  onNavigateToAbout?: () => void;
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
  onNavigateToFeedback,
  onNavigateToAbout,
  clearButtonRef,
  trapEnabled = true,
}: SettingsModalProps): ReactElement => {
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
            <X className="h-5 w-5" aria-hidden />
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

              <label className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease cursor-pointer">
                {copy.import}
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
                        onChangeDB(mergedDB);
                        // Close settings modal and show success
                        onClose();
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
          <div>
            <SectionTitle>{copy.feedback}</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={onNavigateToFeedback}
                className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease"
              >
                {copy.feedbackInApp}
              </button>
              <a
                href="mailto:itskylebrooks@icloud.com"
                className="px-3 py-2 text-sm rounded-xl border btn-tonal surface-hover transition-soft motion-ease"
              >
                {copy.feedbackEmail}
              </a>
            </div>
          </div>
          {/* Footer: divider and single-line with centered name and icons */}
          <div className="-mx-4 mt-4">
            <div className="pt-4 border-t surface-border text-center text-xs text-muted px-4">
              <div className="leading-snug">Enso {pkg.version}</div>
              {/* Center row with name and icons aligned to the same height */}
              <div className="relative leading-snug flex items-center justify-center">
                {/* Left icon */}
                <div className="absolute left-4 inset-y-0 flex items-center">
                  <button type="button" onClick={onNavigateToAbout} className="text-current" aria-label="About">
                    <Info className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {/* Center text */}
                <div>Kyle Brooks</div>

                {/* Right icon */}
                <div className="absolute right-4 inset-y-0 flex items-center">
                  <a href="https://itskylebrooks.vercel.app/" target="_blank" rel="noreferrer" className="text-current" aria-label="Kyle Brooks website">
                    <SquareArrowOutUpRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
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
      </motion.div>

    </motion.div>
  );
};
