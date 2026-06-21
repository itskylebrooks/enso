import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import { FeedbackPage } from '@features/home/components/feedback/FeedbackPage';
import { GuideGradePage } from '@features/home/components/guide/GuideGradePage';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { GuidePage } from '@features/home/components/home/GuidePage';
import { GuideRoutinePage } from '@features/home/components/home/GuideRoutinePage';
import { SyncPage } from '@features/home/components/home/SyncPage';
import {
  LearnSessionPage,
  type LearnCard,
  type LearnSession,
  type LearnSetupOptions,
} from '@features/learn';
import { TechniquePage } from '@features/technique/components/TechniquePage';
import { TechniquesPage } from '@features/technique/components/TechniquesPage';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { MobileFilters } from '@shared/components/ui/MobileFilters';
import type { Copy } from '@shared/constants/i18n';
import { guideRouteToGrade, routeToRoutine } from '@shared/navigation/appRoutes';
import { gradeOrder } from '@shared/utils/grades';
import {
  BookOpenText,
  Dumbbell,
  Footprints,
  ListChecks,
  PencilLine,
  type LucideIcon,
} from 'lucide-react';
import { motion, type Transition } from 'motion/react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { BookmarksView } from '../../features/bookmarks/components/BookmarksView';
import type { ExerciseFilters } from '../../features/exercises';
import {
  ExerciseDetailPage,
  ExercisesFilterPanel,
  ExercisesPage,
  MobileExercisesFilters,
} from '../../features/exercises';
import { HomePage } from '../../features/home';
import { FilterPanel } from '../../features/search/components/FilterPanel';
import {
  MobileTermsFilters,
  TermDetailPage,
  TermsFilterPanel,
  TermsPage,
} from '../../features/terms';
import type { AuthSession, SyncMetaState } from '../../lib/supabase/types';
import type {
  AppRoute,
  DB,
  EntryMode,
  Exercise,
  Filters,
  GlossaryProgress,
  GlossaryTerm,
  Grade,
  GuideRoutine,
  Locale,
  PracticeCategory,
  Progress,
  StudyStatus,
  Technique,
  TechniqueVariantKey,
} from '../types';
import type { GlossaryFilters } from './useContentController';

type NavigateOptions = {
  replace?: boolean;
  sourceRoute?: AppRoute;
};

type OpenTechnique = (
  slug: string,
  trainerId?: string,
  entry?: EntryMode,
  skipExistenceCheck?: boolean,
  options?: { originRoute?: AppRoute },
  bookmarkedVariant?: TechniqueVariantKey,
) => void;

type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  checked: boolean;
};

type ActiveTourSegment = {
  id: string;
} | null;

type PageMotion = {
  transition: Transition;
};

type AppScreenState = {
  route: AppRoute;
  activeSlug: string | null;
  activeTourSegment: ActiveTourSegment;
  techniqueNotFound: boolean;
  showHomeOnboardingCard: boolean;
  skipEntranceAnimations: boolean;
};

type AppScreenData = {
  db: DB;
  copy: Copy;
  locale: Locale;
  currentTechnique: Technique | null | undefined;
  currentProgress: Progress | null | undefined;
  currentGlossaryTerm: GlossaryTerm | null | undefined;
  currentGlossaryProgress: GlossaryProgress | null | undefined;
  currentGlossaryStudyStatus: StudyStatus;
  currentExerciseStudyStatus: StudyStatus;
  glossaryCollectionOptions: CollectionOption[];
  glossaryTerms: GlossaryTerm[];
  practiceExercises: Exercise[];
  filteredTechniques: Technique[];
  categories: string[];
  attacks: string[];
  stances: string[];
  weapons: string[];
  trainers: string[];
  glossaryCategories: NonNullable<GlossaryFilters['category']>[];
  practiceCategories: PracticeCategory[];
  authSession: AuthSession | null;
  isAuthBootstrapping: boolean;
  syncStatus: 'signed-out' | 'idle' | 'syncing' | 'error';
  syncError: string | null;
  syncMeta: SyncMetaState;
  learnSession: LearnSession | null;
  feedbackInitialType: FeedbackType | null;
  pinnedBeltGrade: Grade | null;
  beltPromptDismissed: boolean;
};

type AppScreenFilters = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  glossaryFilters: GlossaryFilters;
  setGlossaryFilters: Dispatch<SetStateAction<GlossaryFilters>>;
  practiceFilters: ExerciseFilters;
  setPracticeFilters: Dispatch<SetStateAction<ExerciseFilters>>;
};

type AppScreenNavigation = {
  navigateTo: (route: AppRoute, options?: NavigateOptions) => void;
  openTechnique: OpenTechnique;
  closeTechnique: () => void;
  openGlossaryTerm: (slug: string) => void;
  openPracticeExercise: (slug: string) => void;
  openGuideGrade: (grade: Grade, source?: { route: AppRoute; slug: string }) => void;
  navigateToGuideGrade: (grade: Grade, sourceRoute?: AppRoute) => void;
  navigateToGuideRoutine: (routine: GuideRoutine, sourceRoute?: AppRoute) => void;
  openGuideRoutinePreset: (routine: GuideRoutine, routineSlug: string) => void;
  closeGuideRoutinePreset: (routine: GuideRoutine) => void;
  handlePracticeBack: () => void;
  handleGuideBack: () => void;
  techniqueBackLabel: string;
  glossaryBackLabel: string;
  glossaryBackRoute: AppRoute;
  practiceBackLabel: string;
  guideBackLabel: string;
};

type AppScreenLibrary = {
  updateGlossaryProgress: (termId: string, patch: Partial<GlossaryProgress>) => void;
  cycleItemStudyStatus: (
    itemType: 'technique' | 'term' | 'exercise',
    slug: string,
    variant?: TechniqueVariantKey,
  ) => void;
  createCollection: (name: string) => string | null;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  assignToCollection: (techniqueId: string, collectionId: string) => void;
  removeFromCollection: (techniqueId: string, collectionId: string) => void;
  assignGlossaryToCollection: (termId: string, collectionId: string) => void;
  removeGlossaryFromCollection: (termId: string, collectionId: string) => void;
  assignExerciseToCollection: (exerciseId: string, collectionId: string) => void;
  removeExerciseFromCollection: (exerciseId: string, collectionId: string) => void;
  reorderCollectionItem: (
    collectionId: string,
    itemId: string,
    direction: 'backward' | 'forward',
  ) => void;
  toggleBookmark: (
    technique: Technique,
    entry: Progress | null,
    bookmarkedVariant: TechniqueVariantKey,
  ) => void;
  toggleExerciseBookmark: (exerciseId: string, nextBookmarked: boolean) => void;
};

type AppScreenWorkflow = {
  pageMotion: PageMotion;
  prefetchFeedbackPage: () => void;
  goToFeedback: (type?: FeedbackType) => void;
  handleOpenGuideFromPrompt: () => void;
  handleStartOnboardingTour: () => void;
  handleSkipOnboarding: () => void;
  togglePinnedBeltGrade: (grade: Grade) => void;
  startLearnSession: (
    cards: LearnCard[],
    options: LearnSetupOptions,
    sourceRoute: AppRoute,
    sourceLabel: string,
  ) => void;
  requestOtpForSync: (email: string) => Promise<void>;
  verifyOtpForSync: (email: string, token: string) => Promise<void>;
  signOutFromSync: () => Promise<void>;
  syncNow: () => Promise<void>;
  handleRequestDeleteAccount: () => void;
  setFeedbackInitialType: Dispatch<SetStateAction<FeedbackType | null>>;
  selectedCollectionId: string;
  setSelectedCollectionId: Dispatch<SetStateAction<string>>;
};

export type AppScreenRouterProps = {
  state: AppScreenState;
  data: AppScreenData;
  filters: AppScreenFilters;
  navigation: AppScreenNavigation;
  library: AppScreenLibrary;
  workflow: AppScreenWorkflow;
};

export type AppScreenRouterResult = {
  mainContent: ReactElement;
  pageKey: string;
};

export const getAppPageKey = (params: {
  route: AppRoute;
  activeSlug: string | null;
  currentTechnique?: Technique | null;
}): string => {
  if (params.currentTechnique) return `technique-${params.currentTechnique.id}`;
  if (params.route === 'libraryExercises' && params.activeSlug) {
    return `library-exercises-${params.activeSlug}`;
  }
  if (params.activeSlug) return `terms-${params.activeSlug}`;
  return params.route;
};

const LibraryPageTitle = ({ title }: { title: string }): ReactElement => (
  <header className="mb-4 text-center">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  </header>
);

const TechniqueListScreen = ({
  data,
  filters,
  navigation,
  workflow,
  activeTourSegment,
}: Pick<AppScreenRouterProps, 'data' | 'filters' | 'navigation' | 'workflow'> & {
  activeTourSegment: ActiveTourSegment;
}): ReactElement => (
  <>
    <LibraryPageTitle title={data.copy.techniques} />
    <div className="lg:hidden">
      <MobileFilters
        copy={data.copy}
        locale={data.locale}
        filters={filters.filters}
        categories={data.categories}
        attacks={data.attacks}
        stances={data.stances}
        weapons={data.weapons}
        levels={gradeOrder}
        trainers={data.trainers}
        onChange={filters.setFilters}
        onContribute={() => workflow.goToFeedback('newTechnique')}
        onContributePrefetch={workflow.prefetchFeedbackPage}
        forceOpen={activeTourSegment?.id === 'techniques-filters'}
      />
    </div>
    {/* Mobile CTA removed here — now rendered inside the MobileFilters panel */}
    <div className="relative">
      <ExpandableFilterBar
        label={data.copy.filters}
        tourTargetId="techniques-filters-trigger"
        forceOpen={activeTourSegment?.id === 'techniques-filters'}
      >
        <FilterPanel
          copy={data.copy}
          locale={data.locale}
          filters={filters.filters}
          categories={data.categories}
          attacks={data.attacks}
          stances={data.stances}
          weapons={data.weapons}
          levels={gradeOrder}
          trainers={data.trainers}
          onChange={filters.setFilters}
        />
        {/* Desktop CTA under filter panel */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => workflow.goToFeedback('newTechnique')}
            onMouseEnter={workflow.prefetchFeedbackPage}
            onFocus={workflow.prefetchFeedbackPage}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
          >
            <PencilLine width={20} height={20} aria-hidden />
            {data.copy.feedbackAddTechniqueCta}
          </button>
        </div>
      </ExpandableFilterBar>
      <section>
        {/* Button moved to under filters (desktop) and above grid (mobile) */}
        <TechniquesPage
          copy={data.copy}
          locale={data.locale}
          techniques={data.filteredTechniques}
          progress={data.db.progress}
          studyStatus={data.db.studyStatus}
          onOpen={navigation.openTechnique}
        />
      </section>
    </div>
  </>
);

const ExerciseListScreen = ({
  data,
  filters,
  navigation,
  workflow,
}: Pick<AppScreenRouterProps, 'data' | 'filters' | 'navigation' | 'workflow'>): ReactElement => (
  <>
    <LibraryPageTitle title={data.copy.exercises} />
    <div className="lg:hidden">
      <MobileExercisesFilters
        copy={data.copy}
        filters={filters.practiceFilters}
        categories={data.practiceCategories}
        onChange={filters.setPracticeFilters}
        onContribute={() => workflow.goToFeedback()}
        onContributePrefetch={workflow.prefetchFeedbackPage}
      />
    </div>
    <div className="relative">
      <ExpandableFilterBar label={data.copy.filters}>
        <ExercisesFilterPanel
          copy={data.copy}
          filters={filters.practiceFilters}
          categories={data.practiceCategories}
          onChange={filters.setPracticeFilters}
        />
        <div className="mt-3">
          <button
            type="button"
            onClick={() => workflow.goToFeedback()}
            onMouseEnter={workflow.prefetchFeedbackPage}
            onFocus={workflow.prefetchFeedbackPage}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
          >
            <PencilLine width={20} height={20} aria-hidden />
            {data.copy.feedbackAddExerciseCta}
          </button>
        </div>
      </ExpandableFilterBar>
      <section>
        <ExercisesPage
          copy={data.copy}
          locale={data.locale}
          studyStatus={data.db.studyStatus}
          filters={filters.practiceFilters}
          onOpenExercise={navigation.openPracticeExercise}
        />
      </section>
    </div>
  </>
);

const TermsScreen = ({
  state,
  data,
  filters,
  navigation,
  library,
}: Pick<
  AppScreenRouterProps,
  'state' | 'data' | 'filters' | 'navigation' | 'library'
>): ReactElement => (
  <>
    {state.activeSlug ? (
      <TermDetailPage
        slug={state.activeSlug}
        copy={data.copy}
        locale={data.locale}
        backLabel={navigation.glossaryBackLabel}
        onBack={() => navigation.navigateTo('libraryTerms', { replace: true })}
        isBookmarked={Boolean(data.currentGlossaryProgress?.bookmarked)}
        onToggleBookmark={() =>
          library.updateGlossaryProgress(state.activeSlug!, {
            bookmarked: !data.currentGlossaryProgress?.bookmarked,
          })
        }
        studyStatus={data.currentGlossaryStudyStatus}
        onToggleStudyStatus={() => library.cycleItemStudyStatus('term', state.activeSlug!)}
        collections={data.glossaryCollectionOptions}
        onToggleCollection={(collectionId, nextChecked) => {
          if (nextChecked) {
            library.assignGlossaryToCollection(state.activeSlug!, collectionId);
          } else {
            library.removeGlossaryFromCollection(state.activeSlug!, collectionId);
          }
        }}
        onCreateCollection={library.createCollection}
        onNavigateToTermsWithFilter={(category) => {
          filters.setGlossaryFilters({ category });
          navigation.navigateTo('libraryTerms');
        }}
      />
    ) : (
      <>
        <LibraryPageTitle title={data.copy.glossary} />
        <div className="lg:hidden">
          <MobileTermsFilters
            copy={data.copy}
            filters={filters.glossaryFilters}
            categories={data.glossaryCategories}
            onChange={filters.setGlossaryFilters}
          />
        </div>
        <div className="relative">
          <ExpandableFilterBar label={data.copy.filters}>
            <TermsFilterPanel
              copy={data.copy}
              filters={filters.glossaryFilters}
              categories={data.glossaryCategories}
              onChange={filters.setGlossaryFilters}
            />
          </ExpandableFilterBar>
          <section>
            <TermsPage
              locale={data.locale}
              copy={data.copy}
              studyStatus={data.db.studyStatus}
              filters={filters.glossaryFilters}
              onOpenTerm={navigation.openGlossaryTerm}
            />
          </section>
        </div>
      </>
    )}
  </>
);

const LandingLink = ({
  title,
  description,
  meta,
  icon: Icon,
  featured = false,
  onClick,
}: {
  title: string;
  description: string;
  meta?: string;
  icon?: LucideIcon;
  featured?: boolean;
  onClick: () => void;
}): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className={`surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] ${
      featured ? 'min-h-40' : ''
    }`}
    title={title}
  >
    <span className="flex items-start justify-between gap-4">
      <span className="block text-base font-semibold leading-tight">{title}</span>
      {Icon ? (
        <span className="shrink-0 text-muted">
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </span>
      ) : null}
    </span>
    <span className="block text-sm leading-relaxed text-muted line-clamp-3 flex-1">
      {description}
    </span>
    {meta ? (
      <span className="block text-xs font-medium uppercase tracking-wide text-muted">{meta}</span>
    ) : null}
  </button>
);

const LandingInfo = ({
  title,
  description,
}: {
  title: string;
  description: string;
}): ReactElement => (
  <div
    className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow"
    title={title}
  >
    <span className="block text-base font-semibold leading-tight">{title}</span>
    <span className="block text-sm leading-relaxed text-muted line-clamp-3 flex-1">
      {description}
    </span>
  </div>
);

const formatCategoryCount = (count: number, label: string, locale: Locale): string => {
  const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US');
  const countLabel = locale === 'en' ? label.toLocaleLowerCase('en') : label;
  return `${formatter.format(count)} ${countLabel}`;
};

const LibraryLandingScreen = ({
  data,
  navigation,
}: Pick<AppScreenRouterProps, 'data' | 'navigation'>): ReactElement => {
  const routineLabel = data.copy.guidePage.headings.routines;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <LandingLink
          title={data.copy.techniques}
          description="Browse forms, variations, grades, attacks, stances, and weapons."
          meta={formatCategoryCount(data.db.techniques.length, data.copy.techniques, data.locale)}
          icon={Footprints}
          featured
          onClick={() => navigation.navigateTo('libraryTechniques')}
        />
        <LandingLink
          title={data.copy.glossary}
          description="Study Japanese terminology, concepts, etiquette, and principles."
          meta={formatCategoryCount(data.glossaryTerms.length, data.copy.glossary, data.locale)}
          icon={BookOpenText}
          featured
          onClick={() => navigation.navigateTo('libraryTerms')}
        />
        <LandingLink
          title={data.copy.exercises}
          description="Review preparation, mobility, strength, balance, and recovery exercises."
          meta={formatCategoryCount(data.practiceExercises.length, data.copy.exercises, data.locale)}
          icon={Dumbbell}
          featured
          onClick={() => navigation.navigateTo('libraryExercises')}
        />
        <LandingLink
          title={routineLabel}
          description="Use curated exercise sequences for warm-up, cooldown, mobility, strength, skill, and recovery."
          meta={formatCategoryCount(data.copy.guidePage.routines.length, routineLabel, data.locale)}
          icon={ListChecks}
          featured
          onClick={() => navigation.navigateTo('libraryRoutines')}
        />
      </div>
    </section>
  );
};

const LibraryRoutinesScreen = ({
  data,
  navigation,
}: Pick<AppScreenRouterProps, 'data' | 'navigation'>): ReactElement => (
  <section className="space-y-5">
    <LibraryPageTitle title={data.copy.guidePage.headings.routines} />
    <div className="grid gap-3 md:grid-cols-2">
      {data.copy.guidePage.routines.map((routine) => (
        <LandingLink
          key={routine.id}
          title={routine.title}
          description={routine.description}
          onClick={() => navigation.navigateToGuideRoutine(routine.id)}
        />
      ))}
    </div>
  </section>
);

const TeachLandingScreen = (): ReactElement => (
  <section className="space-y-5">
    <div className="grid gap-3 md:grid-cols-3">
      <LandingInfo
        title="Class planner"
        description="Prepare training sessions from techniques, routines, and exercises."
      />
      <LandingInfo
        title="Children games"
        description="Organize playful drills for attention, movement, safety, and cooperation."
      />
      <LandingInfo
        title="Lesson templates"
        description="Save reusable class structures for different groups and training goals."
      />
    </div>
  </section>
);

export const AppScreenRouter = ({
  state,
  data,
  filters,
  navigation,
  library,
  workflow,
}: AppScreenRouterProps): AppScreenRouterResult => {
  const {
    route,
    activeSlug,
    activeTourSegment,
    techniqueNotFound,
    showHomeOnboardingCard,
    skipEntranceAnimations,
  } = state;
  const { db, copy, locale, currentTechnique, currentProgress, currentGlossaryTerm } = data;

  let mainContent: ReactElement;

  if (currentTechnique) {
    mainContent = (
      <motion.div
        initial={skipEntranceAnimations ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={workflow.pageMotion.transition}
        style={{ willChange: 'opacity' }}
      >
        <TechniquePage
          technique={currentTechnique}
          progress={currentProgress ?? null}
          copy={copy}
          locale={locale}
          backLabel={navigation.techniqueBackLabel}
          onBack={() => navigation.closeTechnique()}
          onToggleBookmark={(bookmarkedVariant) =>
            library.toggleBookmark(currentTechnique, currentProgress ?? null, bookmarkedVariant)
          }
          studyStatusMap={db.studyStatus}
          onToggleStudyStatus={(variant) =>
            library.cycleItemStudyStatus('technique', currentTechnique.slug, variant)
          }
          collections={db.collections}
          bookmarkCollections={db.bookmarkCollections}
          onAssignToCollection={(collectionId) =>
            library.assignToCollection(currentTechnique.id, collectionId)
          }
          onRemoveFromCollection={(collectionId) =>
            library.removeFromCollection(currentTechnique.id, collectionId)
          }
          onOpenGlossary={navigation.openGlossaryTerm}
          onOpenGuideGrade={(grade) => {
            navigation.openGuideGrade(grade, { route, slug: currentTechnique.slug });
          }}
          onFeedbackClick={() => workflow.goToFeedback()}
          onCreateCollection={library.createCollection}
        />
      </motion.div>
    );
  } else if (currentGlossaryTerm) {
    mainContent = (
      <TermDetailPage
        slug={activeSlug!}
        copy={copy}
        locale={locale}
        backLabel={navigation.glossaryBackLabel}
        onBack={() => navigation.navigateTo(navigation.glossaryBackRoute, { replace: true })}
        isBookmarked={Boolean(data.currentGlossaryProgress?.bookmarked)}
        onToggleBookmark={() =>
          library.updateGlossaryProgress(activeSlug!, {
            bookmarked: !data.currentGlossaryProgress?.bookmarked,
          })
        }
        studyStatus={data.currentGlossaryStudyStatus}
        onToggleStudyStatus={() =>
          library.cycleItemStudyStatus('term', currentGlossaryTerm?.slug ?? activeSlug!)
        }
        collections={data.glossaryCollectionOptions}
        onToggleCollection={(collectionId, nextChecked) => {
          if (nextChecked) {
            library.assignGlossaryToCollection(activeSlug!, collectionId);
          } else {
            library.removeGlossaryFromCollection(activeSlug!, collectionId);
          }
        }}
        onCreateCollection={library.createCollection}
        onNavigateToTermsWithFilter={(category) => {
          filters.setGlossaryFilters({ category });
          navigation.navigateTo('libraryTerms');
        }}
      />
    );
  } else if (route === 'libraryExercises' && activeSlug) {
    mainContent = (
      <ExerciseDetailPage
        slug={activeSlug}
        copy={copy}
        locale={locale}
        collections={db.collections}
        exerciseProgress={db.exerciseProgress}
        exerciseBookmarkCollections={db.exerciseBookmarkCollections}
        studyStatus={data.currentExerciseStudyStatus}
        onToggleStudyStatus={() => library.cycleItemStudyStatus('exercise', activeSlug)}
        onToggleBookmark={library.toggleExerciseBookmark}
        onAssignToCollection={library.assignExerciseToCollection}
        onRemoveFromCollection={library.removeExerciseFromCollection}
        onCreateCollection={library.createCollection}
        backLabel={navigation.practiceBackLabel}
        onNavigateToExercisesWithFilter={(nextFilters) => {
          filters.setPracticeFilters(nextFilters);
          navigation.navigateTo('libraryExercises', { replace: true });
        }}
        onBack={navigation.handlePracticeBack}
      />
    );
  } else if (techniqueNotFound) {
    mainContent = (
      <div className="max-w-5xl mx-auto px-6 pt-0 pb-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Technique not found.</p>
        <button
          type="button"
          onClick={() => navigation.navigateTo('libraryTechniques', { replace: true })}
          className="text-sm underline"
        >
          {copy.backToLibrary}
        </button>
      </div>
    );
  } else if (route === 'home') {
    mainContent = (
      <HomePage
        copy={copy}
        locale={locale}
        techniques={db.techniques}
        techniqueProgress={db.progress}
        glossaryTerms={data.glossaryTerms}
        exercises={data.practiceExercises}
        onOpenTechnique={navigation.openTechnique}
        onOpenGlossaryTerm={navigation.openGlossaryTerm}
        onOpenExercise={navigation.openPracticeExercise}
        pinnedBeltGrade={data.pinnedBeltGrade}
        onOpenPinnedBeltGrade={(grade) => navigation.navigateToGuideGrade(grade, 'home')}
        beltPromptDismissed={data.beltPromptDismissed}
        onOpenGuideFromPrompt={workflow.handleOpenGuideFromPrompt}
        showOnboardingCard={showHomeOnboardingCard}
        onStartOnboardingTour={workflow.handleStartOnboardingTour}
        onSkipOnboarding={workflow.handleSkipOnboarding}
      />
    );
  } else if (route === 'about') {
    mainContent = <AboutPage copy={copy} />;
  } else if (route === 'sync') {
    mainContent = (
      <SyncPage
        copy={copy}
        isSignedIn={Boolean(data.authSession)}
        isAuthBootstrapping={data.isAuthBootstrapping}
        signedInEmail={data.authSession?.email ?? null}
        syncStatus={data.syncStatus}
        syncError={data.syncError}
        lastSyncedAt={data.syncMeta.lastSyncedAt}
        onRequestOtp={workflow.requestOtpForSync}
        onVerifyOtp={workflow.verifyOtpForSync}
        onSignOut={workflow.signOutFromSync}
        onSyncNow={workflow.syncNow}
        onRequestDeleteAccount={workflow.handleRequestDeleteAccount}
      />
    );
  } else if (route === 'guideAdvanced') {
    mainContent = (
      <AdvancedPrograms
        locale={locale}
        onOpenTechnique={navigation.openTechnique}
        onBack={() => navigation.navigateTo('guide')}
      />
    );
  } else if (route === 'guideDan') {
    mainContent = <DanOverview locale={locale} onBack={() => navigation.navigateTo('guide')} />;
  } else if (routeToRoutine(route)) {
    const routine = routeToRoutine(route) as GuideRoutine;
    mainContent = (
      <GuideRoutinePage
        copy={copy}
        locale={locale}
        routine={routine}
        activeRoutineSlug={activeSlug}
        onBack={() => navigation.navigateTo('libraryRoutines')}
        onBackToOverview={() => navigation.closeGuideRoutinePreset(routine)}
        onOpenRoutine={(routineSlug) => navigation.openGuideRoutinePreset(routine, routineSlug)}
        onOpenExercise={navigation.openPracticeExercise}
      />
    );
  } else if (guideRouteToGrade(route)) {
    const grade = guideRouteToGrade(route) as Grade;
    mainContent = (
      <GuideGradePage
        copy={copy}
        locale={locale}
        grade={grade}
        techniques={db.techniques}
        glossaryTerms={data.glossaryTerms}
        backLabel={navigation.guideBackLabel}
        onBack={navigation.handleGuideBack}
        pinnedBeltGrade={data.pinnedBeltGrade}
        onTogglePin={workflow.togglePinnedBeltGrade}
        onOpenTechnique={(slug) => navigation.openTechnique(slug, undefined, undefined, false)}
        onOpenTerm={navigation.openGlossaryTerm}
        onStartLearn={(cards, options) =>
          workflow.startLearnSession(cards, options, route, copy.backToGuide)
        }
      />
    );
  } else if (route === 'guide') {
    mainContent = (
      <GuidePage
        locale={locale}
        onNavigateToGuideGrade={navigation.navigateToGuideGrade}
        onOpenTechnique={navigation.openTechnique}
        onNavigateToAdvanced={() => navigation.navigateTo('guideAdvanced')}
        onNavigateToDan={() => navigation.navigateTo('guideDan')}
      />
    );
  } else if (route === 'feedback') {
    mainContent = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={workflow.pageMotion.transition}
        style={{ willChange: 'opacity' }}
      >
        <FeedbackPage
          copy={copy}
          locale={locale}
          techniques={db.techniques}
          onBack={() => navigation.navigateTo('libraryTechniques')}
          initialType={data.feedbackInitialType}
          onConsumeInitialType={() => workflow.setFeedbackInitialType(null)}
        />
      </motion.div>
    );
  } else if (route === 'studyLearn') {
    mainContent = (
      <LearnSessionPage
        copy={copy}
        session={data.learnSession}
        onBack={() =>
          navigation.navigateTo(data.learnSession?.sourceRoute ?? 'study', { replace: true })
        }
        onOpenBookmarks={() => navigation.navigateTo('study', { replace: true })}
        onOpenGuide={() => navigation.navigateTo('guide', { replace: true })}
      />
    );
  } else {
    mainContent = (
      <div className="container max-w-4xl mx-auto px-4 md:px-6 pt-0 pb-4 space-y-4 lg:space-y-0">
        {route === 'library' && (
          <LibraryLandingScreen data={data} navigation={navigation} />
        )}

        {route === 'libraryTechniques' && (
          <TechniqueListScreen
            data={data}
            filters={filters}
            navigation={navigation}
            workflow={workflow}
            activeTourSegment={activeTourSegment}
          />
        )}

        {route === 'libraryExercises' && (
          <ExerciseListScreen
            data={data}
            filters={filters}
            navigation={navigation}
            workflow={workflow}
          />
        )}

        {route === 'libraryRoutines' && (
          <LibraryRoutinesScreen data={data} navigation={navigation} />
        )}

        {route === 'study' && (
          <BookmarksView
            copy={copy}
            locale={locale}
            techniques={db.techniques}
            exercises={data.practiceExercises}
            glossaryTerms={data.glossaryTerms}
            progress={db.progress}
            glossaryProgress={db.glossaryProgress}
            exerciseProgress={db.exerciseProgress}
            studyStatus={db.studyStatus}
            collections={db.collections}
            bookmarkCollections={db.bookmarkCollections}
            glossaryBookmarkCollections={db.glossaryBookmarkCollections}
            exerciseBookmarkCollections={db.exerciseBookmarkCollections}
            selectedCollectionId={workflow.selectedCollectionId}
            onSelectCollection={(id) => workflow.setSelectedCollectionId(id)}
            onCreateCollection={library.createCollection}
            onRenameCollection={library.renameCollection}
            onDeleteCollection={library.deleteCollection}
            onAssign={library.assignToCollection}
            onUnassign={library.removeFromCollection}
            onAssignGlossary={library.assignGlossaryToCollection}
            onUnassignGlossary={library.removeGlossaryFromCollection}
            onAssignExercise={library.assignExerciseToCollection}
            onUnassignExercise={library.removeExerciseFromCollection}
            onReorderCollectionItem={library.reorderCollectionItem}
            onOpenTechnique={(slug, bookmarkedVariant) =>
              navigation.openTechnique(
                slug,
                undefined,
                undefined,
                undefined,
                { originRoute: 'study' },
                bookmarkedVariant,
              )
            }
            onOpenGlossaryTerm={(slug) => navigation.openGlossaryTerm(slug)}
            onOpenExercise={navigation.openPracticeExercise}
            onStartLearn={(cards, options) =>
              workflow.startLearnSession(cards, options, 'study', copy.backToBookmarks)
            }
            forceCollectionsSidebarOpen={activeTourSegment?.id === 'bookmarks-collections'}
          />
        )}

        {route === 'libraryTerms' && (
          <TermsScreen
            state={state}
            data={data}
            filters={filters}
            navigation={navigation}
            library={library}
          />
        )}

        {route === 'teach' && <TeachLandingScreen />}
      </div>
    );
  }

  return {
    mainContent,
    pageKey: getAppPageKey({
      route,
      activeSlug,
      currentTechnique,
    }),
  };
};
