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
import { Info, SquareArrowOutUpRight, X, Sun, Moon, Monitor } from 'lucide-react';
// import version from package.json
import pkg from '../../../../../package.json';

type SettingsModalProps = {
  copy: Copy;
  locale: Locale;
  theme: Theme;
  isSystemTheme: boolean;
  db: DB;
  animationsDisabled: boolean;
  pageLabelsEnabled: boolean;
  onClose: () => void;
  onRequestClear: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: Theme | 'system') => void;
  onChangeAnimations: (disabled: boolean) => void;
  onChangePageLabels: (enabled: boolean) => void;
  onChangeDB: (db: DB) => void;
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
  animationsDisabled,
  pageLabelsEnabled,
  onClose,
  onRequestClear,
  onChangeLocale,
  onChangeTheme,
  onChangeAnimations,
  onChangePageLabels,
  onChangeDB,
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
        <div className="p-4 space-y-4">
          {/* Two columns on most phones; stack only below ~400px */}
          <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-4">
            <div>
              <SectionTitle>{copy.language}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChangeLocale('en')}
                  className={classNames(
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
            <div>
              <SectionTitle>{copy.theme}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChangeTheme('system')}
                  className={classNames(
                    'p-2 rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
                    'p-2 rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
                    'p-2 rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
          {/* Motion and Page Labels on left and right */}
          <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-4">
            <div>
              <SectionTitle>{copy.motionSettings}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChangeAnimations(true)}
                  className={classNames(
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
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
            <div>
              <SectionTitle>{copy.pageLabels}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChangePageLabels(false)}
                  className={classNames(
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    !pageLabelsEnabled 
                      ? 'btn-contrast' 
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={!pageLabelsEnabled}
                  aria-label="Off"
                >
                  Off
                </button>
                <button
                  type="button"
                  onClick={() => onChangePageLabels(true)}
                  className={classNames(
                    'px-3 py-2 text-sm rounded-xl border inline-flex items-center justify-center transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    pageLabelsEnabled 
                      ? 'btn-contrast' 
                      : 'btn-tonal surface-hover',
                  )}
                  aria-pressed={pageLabelsEnabled}
                  aria-label="On"
                >
                  On
                </button>
              </div>
            </div>
          </div>
          <div>
            <SectionTitle>{'Data'}</SectionTitle>
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
          {/* Feedback options removed from Settings — feedback handled on Feedback page */}
          {/* Footer: divider and single-line with centered name and icons */}
          <div className="-mx-4 mt-4">
            <div className="pt-4 border-t surface-border text-center text-xs text-muted px-4">
                {/* Wrapper for both footer lines with icons centered vertically between them */}
                <div className="relative flex flex-col">
                  {/* Left and right icons positioned absolutely, centered vertically in the entire footer */}
                  <div className="absolute left-4 inset-y-0 flex items-center">
                    <button type="button" onClick={onNavigateToAbout} className="text-current" aria-label="About">
                      <Info className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <div className="absolute right-4 inset-y-0 flex items-center">
                    <a href="https://itskylebrooks.vercel.app/" target="_blank" rel="noreferrer" className="text-current" aria-label="Kyle Brooks website">
                      <SquareArrowOutUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>

                  {/* Center text: author · version on one line */}
                  <div className="leading-snug flex items-center justify-center gap-2">
                    <span className="truncate">Kyle Brooks</span>
                    <span className="text-muted">·</span>
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
