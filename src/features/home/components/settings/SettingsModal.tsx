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
  onClose: () => void;
  onRequestClear: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: Theme | 'system') => void;
  onChangeAnimations: (disabled: boolean) => void;
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
  onClose,
  onRequestClear,
  onChangeLocale,
  onChangeTheme,
  onChangeAnimations,
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
        className="relative w-full max-w-sm surface rounded-2xl border surface-border shadow-xl overflow-hidden"
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
              <div className="mt-2 inline-flex items-center gap-2 p-1 rounded-full border surface-border bg-[var(--color-surface)]">
                <button
                  type="button"
                  onClick={() => onChangeLocale('en')}
                  className={classNames(
                    'relative h-10 w-10 rounded-full text-sm transition-soft motion-ease flex items-center justify-center',
                    locale === 'en' ? 'text-[var(--color-text)]' : 'text-subtle',
                  )}
                  aria-pressed={locale === 'en'}
                  aria-label="English"
                >
                  {locale === 'en' && (
                    <motion.span
                      layoutId="switchThumbLang"
                      transition={toggleTransition}
                      className="absolute inset-0 rounded-full border surface-border bg-[var(--color-surface-hover)]"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 font-medium">EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLocale('de')}
                  className={classNames(
                    'relative h-10 w-10 rounded-full text-sm transition-soft motion-ease flex items-center justify-center',
                    locale === 'de' ? 'text-[var(--color-text)]' : 'text-subtle',
                  )}
                  aria-pressed={locale === 'de'}
                  aria-label="Deutsch"
                >
                  {locale === 'de' && (
                    <motion.span
                      layoutId="switchThumbLang"
                      transition={toggleTransition}
                      className="absolute inset-0 rounded-full border surface-border bg-[var(--color-surface-hover)]"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 font-medium">DE</span>
                </button>
              </div>
            </div>
            <div>
              <SectionTitle>{copy.theme}</SectionTitle>
              <div className="mt-2 inline-flex items-center gap-2 p-1 rounded-full border surface-border bg-[var(--color-surface)]">
                <button
                  type="button"
                  onClick={() => onChangeTheme('system')}
                  className={classNames(
                    'relative h-10 w-10 rounded-full transition-soft motion-ease flex items-center justify-center',
                    isSystemTheme ? 'text-[var(--color-text)]' : 'text-subtle',
                  )}
                  aria-pressed={isSystemTheme}
                  aria-label={(copy.system ?? 'System')}
                >
                  {isSystemTheme && (
                    <motion.span
                      layoutId="switchThumbTheme"
                      transition={toggleTransition}
                      className="absolute inset-0 rounded-full border surface-border bg-[var(--color-surface-hover)]"
                      aria-hidden
                    />
                  )}
                  <Monitor className="relative z-10 h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('light')}
                  className={classNames(
                    'relative h-10 w-10 rounded-full transition-soft motion-ease flex items-center justify-center',
                    !isSystemTheme && theme === 'light' ? 'text-[var(--color-text)]' : 'text-subtle',
                  )}
                  aria-pressed={!isSystemTheme && theme === 'light'}
                  aria-label={copy.light}
                >
                  {!isSystemTheme && theme === 'light' && (
                    <motion.span
                      layoutId="switchThumbTheme"
                      transition={toggleTransition}
                      className="absolute inset-0 rounded-full border surface-border bg-[var(--color-surface-hover)]"
                      aria-hidden
                    />
                  )}
                  <Sun className="relative z-10 h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('dark')}
                  className={classNames(
                    'relative h-10 w-10 rounded-full transition-soft motion-ease flex items-center justify-center',
                    !isSystemTheme && theme === 'dark' ? 'text-[var(--color-text)]' : 'text-subtle',
                  )}
                  aria-pressed={!isSystemTheme && theme === 'dark'}
                  aria-label={copy.dark}
                >
                  {!isSystemTheme && theme === 'dark' && (
                    <motion.span
                      layoutId="switchThumbTheme"
                      transition={toggleTransition}
                      className="absolute inset-0 rounded-full border surface-border bg-[var(--color-surface-hover)]"
                      aria-hidden
                    />
                  )}
                  <Moon className="relative z-10 h-5 w-5" aria-hidden />
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
            <SectionTitle>{copy.motionSettings}</SectionTitle>
            <div className="mt-2 grid grid-cols-1 min-[350px]:grid-cols-2 items-center">
              <div className="text-sm font-medium">{copy.disableAnimations}</div>
              <div className="mt-2 min-[350px]:mt-0 flex items-center gap-2 w-[148px] justify-end">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {animationsDisabled ? copy.disableAnimationsOn : copy.disableAnimationsOff}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={animationsDisabled}
                  onClick={() => onChangeAnimations(!animationsDisabled)}
                  className={classNames(
                    'relative inline-flex h-9 w-16 items-center rounded-full border transition-soft motion-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    animationsDisabled
                      ? 'bg-[var(--color-text)] border-[var(--color-text)]'
                      : 'bg-[var(--color-surface)] surface-border',
                  )}
                >
                  <span className="sr-only">{copy.disableAnimations}</span>
                  <motion.span
                    className="absolute left-1 top-1 h-7 w-7 rounded-full border shadow-sm"
                    animate={{ x: animationsDisabled ? 28 : 0 }}
                    transition={toggleTransition}
                    style={{
                      // Knob matches BG when toggle is ON (animations disabled), contrast when OFF
                      backgroundColor: animationsDisabled ? 'var(--color-bg)' : 'var(--color-text)',
                      borderColor: animationsDisabled ? 'var(--color-border)' : 'var(--color-bg)',
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Feedback options removed from Settings — feedback handled on Feedback page */}
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
