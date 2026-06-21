import { Header } from '@shared/components/layout/Header';
import { MobileTabBar } from '@shared/components/layout/MobileTabBar';
import { ConfirmClearModal } from '@shared/components/dialogs/ConfirmClearDialog';
import { ConfirmModal } from '@shared/components/ui/modals/ConfirmModal';
import { ConfettiBurst } from '@shared/components/ui/ConfettiBurst';
import { SettingsModal } from '@features/home/components/settings/SettingsModal';
import { SearchOverlay } from '@features/search/components/SearchOverlay';
import { OnboardingTourOverlay } from '@features/onboarding/components/OnboardingTourOverlay';
import { Toast } from '@shared/components/ui/Toast';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import type { ReactElement, RefObject } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type {
  AppRoute,
  DB,
  Exercise,
  ExerciseProgress,
  GlossaryProgress,
  Locale,
  Progress,
  StudyStatusMap,
  Technique,
} from '@shared/types';

type PageMotion = {
  variants: Variants;
  transition: Transition;
};

type AppShellProps = {
  copy: Copy;
  locale: Locale;
  route: AppRoute;
  mainContent: ReactElement;
  pageKey: string;
  pageMotion: PageMotion;
  skipEntranceAnimations: boolean;
  onExitComplete: () => void;
  onNavigate: (route: AppRoute, options?: { replace?: boolean; sourceRoute?: AppRoute }) => void;
  onSearch: (method?: 'keyboard' | 'mouse') => void;
  onSettings: () => void;
  onStartTour: () => void;
  searchButtonRef: RefObject<HTMLButtonElement | null>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
  searchOpen: boolean;
  searchOpenedBy: 'keyboard' | 'mouse';
  onCloseSearch: () => void;
  techniques: Technique[];
  exercises: Exercise[];
  progress: Progress[];
  glossaryProgress: GlossaryProgress[];
  exerciseProgress: ExerciseProgress[];
  studyStatus: StudyStatusMap;
  onSearchOpenTechnique: (slug: string) => void;
  onSearchOpenGlossary: (slug: string) => void;
  onSearchOpenExercise: (slug: string) => void;
  onToggleSearchTechniqueBookmark: (techniqueId: string) => void;
  onToggleSearchGlossaryBookmark: (termId: string) => void;
  onToggleSearchExerciseBookmark: (exerciseId: string) => void;
  settingsOpen: boolean;
  theme: 'light' | 'dark';
  isSystemTheme: boolean;
  db: DB;
  isOnline: boolean;
  isSignedIn: boolean;
  isAuthBootstrapping: boolean;
  syncStatus: 'signed-out' | 'idle' | 'syncing' | 'error';
  hasSyncError: boolean;
  showTeachInPrimaryNav: boolean;
  onCloseSettings: () => void;
  onRequestClear: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  onChangeShowTeachInPrimaryNav: (value: boolean) => void;
  onManageSync: () => void;
  onChangeDB: (db: DB) => void;
  settingsClearButtonRef: RefObject<HTMLButtonElement | null>;
  confirmClearOpen: boolean;
  onCancelClear: () => void;
  onConfirmClear: () => void;
  confirmDeleteAccountOpen: boolean;
  onCancelDeleteAccount: () => void;
  onConfirmDeleteAccount: () => void;
  tourOpen: boolean;
  tourSegmentIndex: number;
  isTechniqueDetailOpen: boolean;
  tourCompletionVisible: boolean;
  onTourBack: () => void;
  onTourNext: () => void;
  onSkipOnboarding: () => void;
  onReturnToTourStep: () => void;
  onTourGoHome: () => void;
  onOpenSettingsFromTour: () => void;
  showTourCompletionConfetti: boolean;
  toast: string | null;
};

export const AppShell = ({
  copy,
  locale,
  route,
  mainContent,
  pageKey,
  pageMotion,
  skipEntranceAnimations,
  onExitComplete,
  onNavigate,
  onSearch,
  onSettings,
  onStartTour,
  searchButtonRef,
  settingsButtonRef,
  searchOpen,
  searchOpenedBy,
  onCloseSearch,
  techniques,
  exercises,
  progress,
  glossaryProgress,
  exerciseProgress,
  studyStatus,
  onSearchOpenTechnique,
  onSearchOpenGlossary,
  onSearchOpenExercise,
  onToggleSearchTechniqueBookmark,
  onToggleSearchGlossaryBookmark,
  onToggleSearchExerciseBookmark,
  settingsOpen,
  theme,
  isSystemTheme,
  db,
  isOnline,
  isSignedIn,
  isAuthBootstrapping,
  syncStatus,
  hasSyncError,
  showTeachInPrimaryNav,
  onCloseSettings,
  onRequestClear,
  onChangeLocale,
  onChangeTheme,
  onChangeShowTeachInPrimaryNav,
  onManageSync,
  onChangeDB,
  settingsClearButtonRef,
  confirmClearOpen,
  onCancelClear,
  onConfirmClear,
  confirmDeleteAccountOpen,
  onCancelDeleteAccount,
  onConfirmDeleteAccount,
  tourOpen,
  tourSegmentIndex,
  isTechniqueDetailOpen,
  tourCompletionVisible,
  onTourBack,
  onTourNext,
  onSkipOnboarding,
  onReturnToTourStep,
  onTourGoHome,
  onOpenSettingsFromTour,
  showTourCompletionConfetti,
  toast,
}: AppShellProps): ReactElement => (
  <MotionConfig reducedMotion="user">
    <div className="min-h-dvh flex flex-col app-bg">
      <Header
        copy={copy}
        route={route}
        onNavigate={onNavigate}
        onSearch={onSearch}
        onSettings={onSettings}
        onStartTour={onStartTour}
        showTeachInPrimaryNav={showTeachInPrimaryNav}
        searchButtonRef={searchButtonRef}
        settingsButtonRef={settingsButtonRef}
      />

      <AnimatePresence
        mode={skipEntranceAnimations ? 'sync' : 'wait'}
        initial={!skipEntranceAnimations}
        onExitComplete={onExitComplete}
      >
        <motion.main
          key={pageKey}
          variants={pageMotion.variants}
          initial={skipEntranceAnimations ? 'animate' : 'initial'}
          animate="animate"
          transition={pageMotion.transition}
          className="flex-1 pt-8 pb-24 md:pb-0"
          style={{ willChange: 'opacity' }}
        >
          {mainContent}
        </motion.main>
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay
            key="search-overlay"
            copy={copy}
            locale={locale}
            techniques={techniques}
            exercises={exercises}
            progress={progress}
            glossaryProgress={glossaryProgress}
            exerciseProgress={exerciseProgress}
            studyStatus={studyStatus}
            onClose={onCloseSearch}
            onOpen={onSearchOpenTechnique}
            onOpenGlossary={onSearchOpenGlossary}
            onOpenExercise={onSearchOpenExercise}
            onToggleTechniqueBookmark={onToggleSearchTechniqueBookmark}
            onToggleGlossaryBookmark={onToggleSearchGlossaryBookmark}
            onToggleExerciseBookmark={onToggleSearchExerciseBookmark}
            openedBy={searchOpenedBy}
            trapEnabled={!tourOpen}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            key="settings-modal"
            copy={copy}
            locale={locale}
            theme={theme}
            isSystemTheme={isSystemTheme}
            db={db}
            onClose={onCloseSettings}
            onRequestClear={onRequestClear}
            onChangeLocale={onChangeLocale}
            onChangeTheme={onChangeTheme}
            showTeachInPrimaryNav={showTeachInPrimaryNav}
            onChangeShowTeachInPrimaryNav={onChangeShowTeachInPrimaryNav}
            onManageSync={onManageSync}
            onChangeDB={onChangeDB}
            isOnline={isOnline}
            isSignedIn={isSignedIn}
            isAuthBootstrapping={isAuthBootstrapping}
            syncStatus={syncStatus}
            hasSyncError={hasSyncError}
            clearButtonRef={settingsClearButtonRef}
            trapEnabled={!confirmClearOpen && !confirmDeleteAccountOpen && !tourOpen}
          />
        )}

        {confirmClearOpen && (
          <ConfirmClearModal
            key="confirm-clear"
            copy={copy}
            onCancel={onCancelClear}
            onConfirm={onConfirmClear}
          />
        )}

        {confirmDeleteAccountOpen && (
          <ConfirmModal
            key="confirm-delete-account"
            strings={{
              title: copy.confirmDeleteAccountTitle,
              body: copy.confirmDeleteAccountBody,
              confirmLabel: copy.confirmDeleteAccountAction,
              cancelLabel: copy.confirmDeleteAccountCancel,
            }}
            onCancel={onCancelDeleteAccount}
            onConfirm={onConfirmDeleteAccount}
            destructive
          />
        )}
      </AnimatePresence>

      <MobileTabBar
        copy={copy}
        route={route}
        showTeachInPrimaryNav={showTeachInPrimaryNav}
        onNavigate={onNavigate}
      />

      {showTourCompletionConfetti && <ConfettiBurst />}

      {tourOpen && (
        <OnboardingTourOverlay
          copy={copy}
          isOpen={tourOpen}
          segmentIndex={tourSegmentIndex}
          route={route}
          isTechniqueDetailOpen={isTechniqueDetailOpen}
          searchOpen={searchOpen}
          completionVisible={tourCompletionVisible}
          onBack={onTourBack}
          onNext={onTourNext}
          onSkip={onSkipOnboarding}
          onReturnToStep={onReturnToTourStep}
          onGoHome={onTourGoHome}
          onOpenSettings={onOpenSettingsFromTour}
        />
      )}

      {toast && <Toast>{toast}</Toast>}
    </div>
  </MotionConfig>
);
