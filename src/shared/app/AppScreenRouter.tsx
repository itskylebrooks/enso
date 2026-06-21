import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import { FeedbackPage } from '@features/home/components/feedback/FeedbackPage';
import { ExamGradePage } from '@features/home/components/exams/ExamGradePage';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { ExamsPage } from '@features/home/components/home/ExamsPage';
import { LibraryRoutinePage } from '@features/home/components/home/LibraryRoutinePage';
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
import { examsRouteToGrade, routeToRoutine } from '@shared/navigation/appRoutes';
import { gradeOrder } from '@shared/utils/grades';
import {
  BookOpenText,
  CalendarDays,
  Dumbbell,
  ExternalLink,
  Footprints,
  Gamepad2,
  Landmark,
  LayoutTemplate,
  ListChecks,
  PencilLine,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  UserCheck,
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
  LibraryRoutine,
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
  openExamsGrade: (grade: Grade, source?: { route: AppRoute; slug: string }) => void;
  navigateToExamsGrade: (grade: Grade, sourceRoute?: AppRoute) => void;
  navigateToLibraryRoutine: (routine: LibraryRoutine, sourceRoute?: AppRoute) => void;
  openLibraryRoutinePreset: (routine: LibraryRoutine, routineSlug: string) => void;
  closeLibraryRoutinePreset: (routine: LibraryRoutine) => void;
  handlePracticeBack: () => void;
  handleExamsBack: () => void;
  techniqueBackLabel: string;
  glossaryBackLabel: string;
  glossaryBackRoute: AppRoute;
  practiceBackLabel: string;
  examsBackLabel: string;
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
  handleOpenExamsFromPrompt: () => void;
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
  meta,
  icon: Icon,
  featured = false,
}: {
  title: string;
  description: string;
  meta?: string;
  icon?: LucideIcon;
  featured?: boolean;
}): ReactElement => (
  <div
    className={`surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow ${
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
  const routineLabel = data.copy.examsPage.headings.routines;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <LandingLink
          title={data.copy.techniques}
          description={data.copy.libraryLanding.techniques}
          meta={formatCategoryCount(data.db.techniques.length, data.copy.techniques, data.locale)}
          icon={Footprints}
          featured
          onClick={() => navigation.navigateTo('libraryTechniques')}
        />
        <LandingLink
          title={data.copy.glossary}
          description={data.copy.libraryLanding.terms}
          meta={formatCategoryCount(data.glossaryTerms.length, data.copy.glossary, data.locale)}
          icon={BookOpenText}
          featured
          onClick={() => navigation.navigateTo('libraryTerms')}
        />
        <LandingLink
          title={data.copy.exercises}
          description={data.copy.libraryLanding.exercises}
          meta={formatCategoryCount(data.practiceExercises.length, data.copy.exercises, data.locale)}
          icon={Dumbbell}
          featured
          onClick={() => navigation.navigateTo('libraryExercises')}
        />
        <LandingLink
          title={routineLabel}
          description={data.copy.libraryLanding.routines}
          meta={formatCategoryCount(data.copy.examsPage.routines.length, routineLabel, data.locale)}
          icon={ListChecks}
          featured
          onClick={() => navigation.navigateTo('libraryRoutines')}
        />
        <LandingLink
          title={data.copy.forms}
          description={data.copy.libraryLanding.forms}
          meta={formatCategoryCount(data.copy.formsPage.items.length, data.copy.forms, data.locale)}
          icon={ScrollText}
          featured
          onClick={() => navigation.navigateTo('libraryForms')}
        />
        <LandingLink
          title={data.copy.culture}
          description={data.copy.libraryLanding.culture}
          meta={data.copy.libraryLanding.cultureScope}
          icon={Landmark}
          featured
          onClick={() => navigation.navigateTo('libraryCulture')}
        />
      </div>
    </section>
  );
};

const LibraryTermGroup = ({
  title,
  terms,
  locale,
  onOpenTerm,
}: {
  title: string;
  terms: GlossaryTerm[];
  locale: Locale;
  onOpenTerm: (slug: string) => void;
}): ReactElement => (
  <section className="space-y-3">
    <header>
      <h2 className="text-xl font-semibold leading-tight">{title}</h2>
    </header>
    <div className="grid gap-3 sm:grid-cols-2">
      {terms.map((term) => (
        <button
          key={term.slug}
          type="button"
          onClick={() => onOpenTerm(term.slug)}
          className="surface border surface-border rounded-2xl p-4 flex flex-col gap-2 text-left card-hover-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          title={term.romaji}
        >
          <span className="flex items-start justify-between gap-3">
            <span className="block text-base font-semibold leading-tight">{term.romaji}</span>
            {term.jp ? <span className="shrink-0 text-xs text-subtle">{term.jp}</span> : null}
          </span>
          <span className="block text-sm leading-relaxed text-muted line-clamp-3">
            {term.def[locale] || term.def.en}
          </span>
        </button>
      ))}
    </div>
  </section>
);

const LibraryFormsScreen = ({
  data,
  navigation,
}: Pick<AppScreenRouterProps, 'data' | 'navigation'>): ReactElement => {
  const openFormOverview = (id: string): void => {
    switch (id) {
      case 'saya-no-uchi':
      case 'jo-program':
      case 'tanto-program':
        navigation.navigateTo('examsAdvanced');
        return;
      case 'aiki-no-kata':
        navigation.navigateTo('examsDan');
        return;
      case '13-no-jo':
      case '31-no-jo':
        navigation.openGlossaryTerm(id);
        return;
      default:
        navigation.navigateTo('libraryForms');
    }
  };

  return (
    <section className="space-y-5">
      <LibraryPageTitle title={data.copy.forms} />
      <div className="grid gap-3 md:grid-cols-2">
        {data.copy.formsPage.items.map((item) => (
          <LandingLink
            key={item.id}
            title={item.title}
            description={item.description}
            meta={item.meta}
            onClick={() => openFormOverview(item.id)}
          />
        ))}
      </div>
    </section>
  );
};

const CultureTextSection = ({
  title,
  lead,
  points,
}: {
  title: string;
  lead: string;
  points: readonly string[];
}): ReactElement => (
  <section className="space-y-3">
    <header className="space-y-2">
      <h2 className="text-xl font-semibold leading-tight">{title}</h2>
      <p className="text-sm text-subtle leading-relaxed">{lead}</p>
    </header>
    <ul className="space-y-3 text-sm leading-relaxed">
      {points.map((point) => (
        <li key={point} className="flex gap-2">
          <span aria-hidden className="shrink-0">
            •
          </span>
          <span className="flex-1">{point}</span>
        </li>
      ))}
    </ul>
  </section>
);

const CultureLinkSection = ({
  title,
  lead,
  links,
}: {
  title: string;
  lead: string;
  links: ReadonlyArray<{ id: string; label: string; href: string }>;
}): ReactElement => (
  <section className="space-y-3">
    <header className="space-y-2">
      <h2 className="text-xl font-semibold leading-tight">{title}</h2>
      <p className="text-sm text-subtle leading-relaxed">{lead}</p>
    </header>
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label={link.label}
        >
          <span>{link.label}</span>
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
        </a>
      ))}
    </div>
  </section>
);

const LibraryCultureScreen = ({
  data,
  navigation,
}: Pick<AppScreenRouterProps, 'data' | 'navigation'>): ReactElement => {
  const cultureCopy = data.copy.examsPage;
  const sortTerms = (terms: GlossaryTerm[]): GlossaryTerm[] =>
    [...terms].sort((a, b) => a.romaji.localeCompare(b.romaji, data.locale));
  const etiquetteTerms = sortTerms(
    data.glossaryTerms.filter((term) => term.category === 'etiquette'),
  );
  const philosophyTerms = sortTerms(
    data.glossaryTerms.filter((term) => term.category === 'philosophy'),
  );

  return (
    <section className="space-y-10">
      <LibraryPageTitle title={data.copy.culture} />
      <CultureTextSection
        title={cultureCopy.headings.philosophy}
        lead={cultureCopy.philosophyLead}
        points={cultureCopy.philosophyPoints}
      />
      <CultureTextSection
        title={cultureCopy.headings.etiquette}
        lead={cultureCopy.etiquetteLead}
        points={cultureCopy.etiquettePoints}
      />
      <CultureLinkSection
        title={cultureCopy.headings.furtherStudy}
        lead={cultureCopy.furtherStudyLead}
        links={cultureCopy.furtherStudyLinks}
      />
      <CultureLinkSection
        title={cultureCopy.headings.youtubeInspiration}
        lead={cultureCopy.youtubeInspirationLead}
        links={cultureCopy.youtubeLinks}
      />
      <LibraryTermGroup
        title={data.copy.categoryEtiquette}
        terms={etiquetteTerms}
        locale={data.locale}
        onOpenTerm={navigation.openGlossaryTerm}
      />
      <LibraryTermGroup
        title={data.copy.categoryPhilosophy}
        terms={philosophyTerms}
        locale={data.locale}
        onOpenTerm={navigation.openGlossaryTerm}
      />
    </section>
  );
};

const LibraryRoutinesScreen = ({
  data,
  navigation,
}: Pick<AppScreenRouterProps, 'data' | 'navigation'>): ReactElement => (
  <section className="space-y-5">
    <LibraryPageTitle title={data.copy.examsPage.headings.routines} />
    <div className="grid gap-3 md:grid-cols-2">
      {data.copy.examsPage.routines.map((routine) => (
        <LandingLink
          key={routine.id}
          title={routine.title}
          description={routine.description}
          onClick={() => navigation.navigateToLibraryRoutine(routine.id)}
        />
      ))}
    </div>
  </section>
);

const TeachLandingScreen = ({ data }: Pick<AppScreenRouterProps, 'data'>): ReactElement => (
  <section className="space-y-5">
    <div className="grid gap-3 md:grid-cols-2">
      <LandingInfo
        title={data.copy.teachLanding.classPlanner.title}
        description={data.copy.teachLanding.classPlanner.description}
        meta={data.copy.teachLanding.classPlanner.meta}
        icon={CalendarDays}
        featured
      />
      <LandingInfo
        title={data.copy.teachLanding.childrenGames.title}
        description={data.copy.teachLanding.childrenGames.description}
        meta={data.copy.teachLanding.childrenGames.meta}
        icon={Gamepad2}
        featured
      />
      <LandingInfo
        title={data.copy.teachLanding.lessonTemplates.title}
        description={data.copy.teachLanding.lessonTemplates.description}
        meta={data.copy.teachLanding.lessonTemplates.meta}
        icon={LayoutTemplate}
        featured
      />
      <LandingInfo
        title={data.copy.teachLanding.safetyNotes.title}
        description={data.copy.teachLanding.safetyNotes.description}
        meta={data.copy.teachLanding.safetyNotes.meta}
        icon={ShieldCheck}
        featured
      />
      <LandingInfo
        title={data.copy.teachLanding.ukemiProgression.title}
        description={data.copy.teachLanding.ukemiProgression.description}
        meta={data.copy.teachLanding.ukemiProgression.meta}
        icon={RotateCcw}
        featured
      />
      <LandingInfo
        title={data.copy.teachLanding.attendance.title}
        description={data.copy.teachLanding.attendance.description}
        meta={data.copy.teachLanding.attendance.meta}
        icon={UserCheck}
        featured
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
          onOpenExamsGrade={(grade) => {
            navigation.openExamsGrade(grade, { route, slug: currentTechnique.slug });
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
        onOpenPinnedBeltGrade={(grade) => navigation.navigateToExamsGrade(grade, 'home')}
        beltPromptDismissed={data.beltPromptDismissed}
        onOpenExamsFromPrompt={workflow.handleOpenExamsFromPrompt}
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
  } else if (route === 'examsAdvanced') {
    mainContent = (
      <AdvancedPrograms
        locale={locale}
        onOpenTechnique={navigation.openTechnique}
        onBack={() => navigation.navigateTo('exams')}
      />
    );
  } else if (route === 'examsDan') {
    mainContent = <DanOverview locale={locale} onBack={() => navigation.navigateTo('exams')} />;
  } else if (routeToRoutine(route)) {
    const routine = routeToRoutine(route) as LibraryRoutine;
    mainContent = (
      <LibraryRoutinePage
        copy={copy}
        locale={locale}
        routine={routine}
        activeRoutineSlug={activeSlug}
        onBack={() => navigation.navigateTo('libraryRoutines')}
        onBackToOverview={() => navigation.closeLibraryRoutinePreset(routine)}
        onOpenRoutine={(routineSlug) => navigation.openLibraryRoutinePreset(routine, routineSlug)}
        onOpenExercise={navigation.openPracticeExercise}
      />
    );
  } else if (examsRouteToGrade(route)) {
    const grade = examsRouteToGrade(route) as Grade;
    mainContent = (
      <ExamGradePage
        copy={copy}
        locale={locale}
        grade={grade}
        techniques={db.techniques}
        glossaryTerms={data.glossaryTerms}
        backLabel={navigation.examsBackLabel}
        onBack={navigation.handleExamsBack}
        pinnedBeltGrade={data.pinnedBeltGrade}
        onTogglePin={workflow.togglePinnedBeltGrade}
        onOpenTechnique={(slug) => navigation.openTechnique(slug, undefined, undefined, false)}
        onOpenTerm={navigation.openGlossaryTerm}
        onStartLearn={(cards, options) =>
          workflow.startLearnSession(cards, options, route, copy.backToExams)
        }
      />
    );
  } else if (route === 'exams') {
    mainContent = (
      <ExamsPage
        locale={locale}
        onNavigateToExamsGrade={navigation.navigateToExamsGrade}
        onOpenTechnique={navigation.openTechnique}
        onNavigateToAdvanced={() => navigation.navigateTo('examsAdvanced')}
        onNavigateToDan={() => navigation.navigateTo('examsDan')}
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
        onOpenExams={() => navigation.navigateTo('exams', { replace: true })}
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

        {route === 'libraryForms' && <LibraryFormsScreen data={data} navigation={navigation} />}

        {route === 'libraryCulture' && (
          <LibraryCultureScreen data={data} navigation={navigation} />
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

        {route === 'teach' && <TeachLandingScreen data={data} />}
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
