import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '../../shared/constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  Locale,
  Progress,
  Technique,
  TechniqueVersion,
} from '../../shared/types';
import { classNames } from '../../shared/utils/classNames';
import { getTaxonomyLabel } from '../../shared/i18n/taxonomy';
import { stripDiacritics } from '../../shared/utils/text';
import { useMotionPreferences, defaultEase } from '../ui/motion';
import { TechniqueHeader, type CollectionOption } from './TechniqueHeader';
import { VersionTabs } from './VersionTabs';
import { StepsList } from './StepsList';
import { UkePanel } from './UkePanel';
import { MediaPanel } from './MediaPanel';
import { NotesPanel } from './NotesPanel';
import { useTechniqueViewStore } from '../../features/technique';

const buildTags = (technique: Technique, locale: Locale): string[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = stripDiacritics(title);

  const candidates: Array<{ type: 'category' | 'attack' | 'stance' | 'weapon'; value?: string | null }> = [
    { type: 'stance', value: technique.stance },
    { type: 'weapon', value: technique.weapon && technique.weapon !== 'empty-hand' ? technique.weapon : undefined },
    { type: 'category', value: technique.category },
    { type: 'attack', value: technique.attack },
  ];

  const unique: string[] = [];
  const seen = new Set<string>();

  candidates.forEach(({ type, value }) => {
    if (!value) return;
    const label = getTaxonomyLabel(locale, type, value);
    const normalizedValue = stripDiacritics(label.toLowerCase());
    if (normalizedValue.length === 0) return;
    if (normalizedTitle.includes(normalizedValue)) return;
    if (seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    unique.push(label);
  });

  return unique;
};

type TechniquePageProps = {
  technique: Technique;
  progress: Progress | null;
  copy: Copy;
  locale: Locale;
  backLabel: string;
  onBack: () => void;
  onToggleBookmark: () => void;
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
  onAssignToCollection: (collectionId: string) => void;
  onRemoveFromCollection: (collectionId: string) => void;
};

const getCollectionOptions = (
  collections: Collection[],
  bookmarkCollections: BookmarkCollection[],
  techniqueId: string,
): CollectionOption[] => {
  const techniqueCollectionIds = new Set(
    bookmarkCollections
      .filter((entry) => entry.techniqueId === techniqueId)
      .map((entry) => entry.collectionId),
  );

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon ?? null,
    checked: techniqueCollectionIds.has(collection.id),
  }));
};

const ensureVersion = (versions: TechniqueVersion[], versionId: string | null | undefined): TechniqueVersion => {
  if (versionId) {
    const match = versions.find((version) => version.id === versionId);
    if (match) return match;
  }
  return versions[0];
};

export const TechniquePage = ({
  technique,
  progress,
  copy,
  locale,
  backLabel,
  onBack,
  onToggleBookmark,
  collections,
  bookmarkCollections,
  onAssignToCollection,
  onRemoveFromCollection,
}: TechniquePageProps): ReactElement => {
  const tags = useMemo(() => buildTags(technique, locale), [technique, locale]);
  const summary = technique.summary[locale] || technique.summary.en;
  const { prefersReducedMotion } = useMotionPreferences();

  const storedLastViewed = useTechniqueViewStore((state) => state.lastViewedVersion[technique.id]);
  const setLastViewedVersion = useTechniqueViewStore((state) => state.setLastViewedVersion);

  const [activeVersionId, setActiveVersionId] = useState(() =>
    ensureVersion(technique.versions, storedLastViewed ?? technique.versions[0].id).id,
  );

  useEffect(() => {
    const nextActive = ensureVersion(technique.versions, storedLastViewed ?? technique.versions[0].id).id;
    setActiveVersionId(nextActive);
  }, [technique.id, technique.versions, storedLastViewed]);

  useEffect(() => {
    setLastViewedVersion(technique.id, activeVersionId);
  }, [technique.id, activeVersionId, setLastViewedVersion]);

  const activeVersion = useMemo(
    () => technique.versions.find((version) => version.id === activeVersionId) ?? technique.versions[0],
    [technique.versions, activeVersionId],
  );

  const bookmarkedActive = Boolean(progress?.bookmarked);
  const collectionOptions = useMemo(
    () => getCollectionOptions(collections, bookmarkCollections, technique.id),
    [collections, bookmarkCollections, technique.id],
  );

  const handleCollectionToggle = (collectionId: string, nextChecked: boolean) => {
    if (nextChecked) {
      onAssignToCollection(collectionId);
    } else {
      onRemoveFromCollection(collectionId);
    }
  };

  const motionInitial = prefersReducedMotion ? undefined : { opacity: 0, y: 18 };
  const motionAnimate = prefersReducedMotion ? undefined : { opacity: 1, y: 0 };
  const motionExit = prefersReducedMotion ? undefined : { opacity: 0, y: -18 };
  const versionMotionTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.18, ease: defaultEase };

  const stepsLabel = copy.steps;
  const ukeNotes = activeVersion.uke;

  return (
    <motion.main
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-10"
      initial={motionInitial}
      animate={motionAnimate}
      transition={versionMotionTransition}
    >
      <TechniqueHeader
        technique={technique}
        locale={locale}
        copy={copy}
        backLabel={backLabel}
        onBack={onBack}
        summary={summary}
        tags={tags}
        isBookmarked={bookmarkedActive}
        onToggleBookmark={onToggleBookmark}
        collections={collectionOptions}
        onToggleCollection={handleCollectionToggle}
      />

      <div
        className={classNames(
          'flex flex-col gap-4 md:flex-row md:items-center',
          technique.versions.length > 1 ? 'md:justify-between' : 'md:justify-start',
        )}
      >
        <VersionTabs
          versions={technique.versions}
          activeVersionId={activeVersionId}
          onChange={setActiveVersionId}
          label={copy.version}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={activeVersion.id}
          initial={motionInitial}
          animate={motionAnimate}
          exit={motionExit}
          transition={versionMotionTransition}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              <section className="space-y-4">
                <header className="text-xs uppercase tracking-[0.3em] text-subtle">{stepsLabel}</header>
                <StepsList
                  steps={activeVersion.steps[locale] ?? activeVersion.steps.en}
                  ariaLabel={`${technique.name[locale]} – ${copy.steps}`}
                />
              </section>
              <UkePanel
                role={ukeNotes.role[locale] ?? ukeNotes.role.en}
                notes={ukeNotes.notes[locale] ?? ukeNotes.notes.en}
                copy={copy}
              />
            </div>
            <div className="space-y-8">
              <MediaPanel media={activeVersion.media} copy={copy} />
              <NotesPanel
                keyPoints={activeVersion.keyPoints ? activeVersion.keyPoints[locale] ?? activeVersion.keyPoints.en : undefined}
                commonMistakes={
                  activeVersion.commonMistakes
                    ? activeVersion.commonMistakes[locale] ?? activeVersion.commonMistakes.en
                    : undefined
                }
                context={activeVersion.context ? activeVersion.context[locale] ?? activeVersion.context.en : undefined}
                copy={copy}
              />
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </motion.main>
  );
};
