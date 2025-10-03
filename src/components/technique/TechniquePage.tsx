import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '../../shared/constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  EntryMode,
  Locale,
  Progress,
  Technique,
  TechniqueVersion,
} from '../../shared/types';
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
import { Segmented, type SegmentedOption } from '../../shared/components/ui/Segmented';
import {
  deriveEntryMode,
  setGlobalEntryPref,
  setTechniqueEntryPref,
} from '../../features/technique/entryPref';
import { migrateTechniqueToStepsByEntry } from '../../utils/migrations/to-stepsByEntry';
import { DEFAULT_ENTRY_MODE, ENTRY_MODE_ORDER } from '../../shared/constants/entryModes';

const buildTags = (technique: Technique, locale: Locale, copy: Copy): string[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = stripDiacritics(title);

  const candidates: Array<{ type: 'category' | 'attack' | 'weapon'; value?: string | null }> = [
    { type: 'weapon', value: technique.weapon && technique.weapon !== 'empty-hand' ? technique.weapon : undefined },
    { type: 'category', value: technique.category },
    { type: 'attack', value: technique.attack },
  ];

  // Add entry mode tags based on available stepsByEntry
  const availableEntries = technique.versions[0]?.stepsByEntry || {};
  const entryModeLabels: Record<EntryMode, string> = {
    irimi: copy.entryIrimi,
    omote: copy.entryOmote,
    tenkan: copy.entryTenkan,
    ura: copy.entryUra,
  };
  const entryModeTags = ENTRY_MODE_ORDER.flatMap((mode) =>
    availableEntries[mode] ? [entryModeLabels[mode]] : []
  );

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

  // Add entry mode tags (these are always shown as they're important context)
  entryModeTags.forEach(tag => {
    const normalizedTag = stripDiacritics(tag.toLowerCase());
    if (!seen.has(normalizedTag)) {
      seen.add(normalizedTag);
      unique.push(tag);
    }
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
  onOpenGlossary?: (slug: string) => void;
  // URL parameters for hierarchical navigation
  urlTrainerId?: string | null;
  urlEntry?: EntryMode | null;
  onUrlChange?: (trainerId?: string, entry?: EntryMode) => void;
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

const findVersionByTrainerId = (versions: TechniqueVersion[], trainerId: string | null | undefined): TechniqueVersion | null => {
  if (!trainerId) return null;
  return versions.find((version) => version.trainerId === trainerId) ?? null;
};

// Map tag labels to glossary slugs
const mapTagToGlossarySlug = (tagLabel: string): string | null => {
  // Create a comprehensive map of localized labels to glossary slugs
  const labelToSlugMap: Record<string, string> = {
    // Category mappings (English)
    'throws (nage-waza)': 'nage-waza',
    'throws': 'nage-waza',
    'nage-waza': 'nage-waza',
    'nage waza': 'nage-waza',
    'throw': 'nage-waza',
    'throwing techniques': 'nage-waza',
    
    'controls / pins (osae-waza)': 'osae-waza',
    'controls / pins': 'osae-waza',
    'controls': 'osae-waza',
    'pins': 'osae-waza',
    'osae-waza': 'osae-waza',
    'osae waza': 'osae-waza',
    'control': 'osae-waza',
    'pinning techniques': 'osae-waza',
    
    'immobilizations (katame-waza)': 'katame-waza',
    'immobilizations': 'katame-waza',
    'katame-waza': 'katame-waza',
    'katame waza': 'katame-waza',
    'immobilization': 'katame-waza',
    'holding techniques': 'katame-waza',
    
    'weapons (buki-waza)': 'buki-waza',
    'weapons': 'buki-waza',
    'buki-waza': 'buki-waza',
    'buki waza': 'buki-waza',
    'weapon': 'buki-waza',
    'weapon techniques': 'buki-waza',
    
    // Category mappings (German)
    'würfe (nage-waza)': 'nage-waza',
    'würfe': 'nage-waza',
    'wurf': 'nage-waza',
    
    'kontrollen / haltegriffe (osae-waza)': 'osae-waza',
    'kontrollen / haltegriffe': 'osae-waza',
    'kontrollen': 'osae-waza',
    'haltegriffe': 'osae-waza',
    'kontrolle': 'osae-waza',
    
    'immobilisationen (katame-waza)': 'katame-waza',
    'immobilisationen': 'katame-waza',
    'immobilisation': 'katame-waza',
    
    'waffen (buki-waza)': 'buki-waza',
    'waffen': 'buki-waza',
    'waffe': 'buki-waza',
    
    // Attack patterns (English labels)
    'shomen-uchi': 'shomen-uchi',
    'shomen uchi': 'shomen-uchi',
    'shōmen-uchi': 'shomen-uchi',
    '正面打ち': 'shomen-uchi',
    'shomen': 'shomen-uchi',
    
    // Movement patterns - all terms now point to appropriate entries
    'irimi (omote)': 'irimi',
    'irimi omote': 'irimi',
    'omote (irimi)': 'irimi',
    'omote irimi': 'irimi',
    '表（入身）': 'irimi',
    'irimi': 'irimi',
    'entering': 'irimi',
    '入身': 'irimi',
    
    'tenkan (ura)': 'tenkan',
    'tenkan ura': 'tenkan',
    'ura (tenkan)': 'tenkan',
    'ura tenkan': 'tenkan',
    '裏（転換）': 'tenkan',
    'tenkan': 'tenkan',
    'turning': 'tenkan',
    '転換': 'tenkan',
    
    // Separate entries for line concepts
    'omote': 'omote',
    '表': 'omote',
    'ura': 'ura',
    '裏': 'ura',
    
    // Concepts
    'ukemi': 'ukemi',
    '受身': 'ukemi',
    'breakfalls': 'ukemi',
    'rolling': 'ukemi',
    
    'rei': 'rei',
    '礼': 'rei',
    'bow': 'rei',
    'bowing': 'rei',
    
    'ma-ai': 'ma-ai',
    'ma ai': 'ma-ai',
    '間合い': 'ma-ai',
    'distance': 'ma-ai',
    'timing': 'ma-ai',
    
    'kamae': 'kamae',
    '構え': 'kamae',
    'stance': 'kamae',
    'ready position': 'kamae',
    
    'tai-sabaki': 'tai-sabaki',
    'tai sabaki': 'tai-sabaki',
    '体捌き': 'tai-sabaki',
    'body movement': 'tai-sabaki',
    'evasion': 'tai-sabaki',
  };

  // Normalize the tag label for lookup
  const normalizedTag = tagLabel.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/[・]/g, '')  // Remove Japanese separator
    .trim();

  // Direct lookup
  if (labelToSlugMap[normalizedTag]) {
    return labelToSlugMap[normalizedTag];
  }

  // Try without spaces/hyphens/punctuation
  const withoutPunctuation = normalizedTag.replace(/[\s\-_.]/g, '');
  for (const [key, slug] of Object.entries(labelToSlugMap)) {
    if (key.replace(/[\s\-_.]/g, '') === withoutPunctuation) {
      return slug;
    }
  }

  // Check if the normalized tag contains any known terms (substring matching)
  for (const [key, slug] of Object.entries(labelToSlugMap)) {
    if (normalizedTag.includes(key) || key.includes(normalizedTag)) {
      return slug;
    }
  }

  return null;
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
  onOpenGlossary,
  urlTrainerId,
  urlEntry,
  onUrlChange,
}: TechniquePageProps): ReactElement => {
  const tags = useMemo(() => buildTags(technique, locale, copy), [technique, locale, copy]);
  const summary = technique.summary[locale] || technique.summary.en;
  const { prefersReducedMotion } = useMotionPreferences();

  // Apply migration on runtime to support new stepsByEntry structure
  const migratedTechnique = useMemo(() => migrateTechniqueToStepsByEntry(technique), [technique]);

  const getFirstAvailableEntryMode = useCallback((version: TechniqueVersion): EntryMode => {
    for (const mode of ENTRY_MODE_ORDER) {
      if (version.stepsByEntry?.[mode]) {
        return mode;
      }
    }

    return DEFAULT_ENTRY_MODE;
  }, []);

  const storedLastViewed = useTechniqueViewStore((state) => state.lastViewedVersion[technique.id]);
  const setLastViewedVersion = useTechniqueViewStore((state) => state.setLastViewedVersion);

  // Entry mode state management
  const [entryMode, setEntryMode] = useState<EntryMode>(() => {
    // If URL specifies an entry mode, use it
    if (urlEntry) {
      return urlEntry;
    }
    
    // For non-URL specified cases, try to get from preferences
    const derivedMode = deriveEntryMode('', technique.id); // Pass empty search to avoid URL query conflicts
    const firstVersion = migratedTechnique.versions[0];
    
    // Check if the derived mode is available in the first version
    if (firstVersion.stepsByEntry?.[derivedMode]) {
      return derivedMode;
    }
    
    // If not available, select the first available entry mode
    return getFirstAvailableEntryMode(firstVersion);
  });

  const [activeVersionId, setActiveVersionId] = useState(() => {
    // If URL specifies a trainer, try to find that version
    if (urlTrainerId) {
      const trainerVersion = findVersionByTrainerId(migratedTechnique.versions, urlTrainerId);
      if (trainerVersion) {
        return trainerVersion.id;
      }
    }
    // Fallback to stored preference or default
    return ensureVersion(migratedTechnique.versions, storedLastViewed ?? migratedTechnique.versions[0].id).id;
  });

  // Update active version when URL trainer changes (but avoid circular updates)
  useEffect(() => {
    if (urlTrainerId) {
      const trainerVersion = findVersionByTrainerId(migratedTechnique.versions, urlTrainerId);
      if (trainerVersion && trainerVersion.id !== activeVersionId) {
        setActiveVersionId(trainerVersion.id);
      }
    }
  }, [urlTrainerId, migratedTechnique.versions, activeVersionId]);

  useEffect(() => {
    setLastViewedVersion(technique.id, activeVersionId);
  }, [technique.id, activeVersionId, setLastViewedVersion]);

  const activeVersion = useMemo(
    () => migratedTechnique.versions.find((version) => version.id === activeVersionId) ?? migratedTechnique.versions[0],
    [migratedTechnique.versions, activeVersionId],
  );

  // Sync entry mode when URL changes (only when urlEntry changes, not when entryMode changes)
  useEffect(() => {
    if (!urlEntry) {
      return;
    }

    if (activeVersion.stepsByEntry?.[urlEntry]) {
      if (entryMode !== urlEntry) {
        setEntryMode(urlEntry);
        setTechniqueEntryPref(technique.id, urlEntry);
        setGlobalEntryPref(urlEntry);
      }
      return;
    }

    const fallbackMode = getFirstAvailableEntryMode(activeVersion);
    if (fallbackMode !== entryMode) {
      setEntryMode(fallbackMode);
      setTechniqueEntryPref(technique.id, fallbackMode);
      setGlobalEntryPref(fallbackMode);
    }
  }, [urlEntry, activeVersion, entryMode, getFirstAvailableEntryMode, technique.id, setTechniqueEntryPref, setGlobalEntryPref]);

  // Auto-switch entry mode when version changes and current mode is not available
  useEffect(() => {
    const activeVersion = migratedTechnique.versions.find((version) => version.id === activeVersionId);
    if (!activeVersion) return;

    // Check if current entry mode is available in the active version
    if (!activeVersion.stepsByEntry?.[entryMode]) {
      // Switch to the first available entry mode
      const newEntryMode = getFirstAvailableEntryMode(activeVersion);
      setEntryMode(newEntryMode);
      setTechniqueEntryPref(technique.id, newEntryMode);
      setGlobalEntryPref(newEntryMode);
      
      // Update URL with current trainer and new entry mode
      const currentTrainerId = activeVersion?.trainerId;
      onUrlChange?.(currentTrainerId, newEntryMode);
    }
  }, [activeVersionId, migratedTechnique.versions, technique.id, getFirstAvailableEntryMode, setTechniqueEntryPref, setGlobalEntryPref, onUrlChange]);

  // Entry mode change handler
  const handleEntryModeChange = useCallback((newMode: EntryMode) => {
    setEntryMode(newMode);
    setTechniqueEntryPref(technique.id, newMode);
    setGlobalEntryPref(newMode);
    
    // Update URL with current trainer and new entry mode
    const activeVersion = migratedTechnique.versions.find((v) => v.id === activeVersionId);
    const currentTrainerId = activeVersion?.trainerId;
    onUrlChange?.(currentTrainerId, newMode);
  }, [migratedTechnique.versions, activeVersionId, technique.id, onUrlChange]);

  // Version change handler
  const handleVersionChange = useCallback((versionId: string) => {
    setActiveVersionId(versionId);
    
    // Find the new version and update URL
    const newVersion = migratedTechnique.versions.find((v) => v.id === versionId);
    const newTrainerId = newVersion?.trainerId;
    
    // Keep current entry mode if available in new version, otherwise reset
    let newEntry = entryMode;
    if (newVersion && !newVersion.stepsByEntry?.[entryMode]) {
      newEntry = getFirstAvailableEntryMode(newVersion);
      setEntryMode(newEntry);
    }
    
    onUrlChange?.(newTrainerId, newEntry);
  }, [migratedTechnique.versions, entryMode, getFirstAvailableEntryMode, onUrlChange]);

  // Keyboard shortcuts for entry mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with inputs or content editable elements
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key.toLowerCase();
      const modeByKey: Record<string, EntryMode> = {
        i: 'irimi',
        t: 'tenkan',
        o: 'omote',
        u: 'ura',
      };
      const nextMode = modeByKey[key];
      if (!nextMode) return;

      if (!activeVersion.stepsByEntry?.[nextMode]) {
        return;
      }

      event.preventDefault();
      handleEntryModeChange(nextMode);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeVersion.stepsByEntry, handleEntryModeChange]);

  // Entry mode options with localized labels
  const entryOptions: SegmentedOption<EntryMode>[] = useMemo(() => {
    const labels: Record<EntryMode, string> = {
      irimi: copy.entryIrimi,
      omote: copy.entryOmote,
      tenkan: copy.entryTenkan,
      ura: copy.entryUra,
    };

    return ENTRY_MODE_ORDER.map((mode) => {
      const isAvailable = Boolean(activeVersion.stepsByEntry?.[mode]);
      return {
        value: mode,
        label: labels[mode],
        disabled: !isAvailable,
        tooltip: !isAvailable ? copy.entryNotAvailable : undefined,
        className: 'w-full text-center',
      } satisfies SegmentedOption<EntryMode>;
    });
  }, [activeVersion.stepsByEntry, copy]);

  // Derive current steps based on entry mode and available data
  const currentSteps = useMemo(() => {
    // Try to get steps for current entry mode
    const entrySteps = activeVersion.stepsByEntry?.[entryMode];
    if (entrySteps) {
      return entrySteps[locale] ?? entrySteps.en;
    }

    // No steps available for this entry mode
    return null;
  }, [activeVersion, entryMode, locale]);

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

  const handleTagClick = (tagLabel: string) => {
    if (!onOpenGlossary) return;
    
    const glossarySlug = mapTagToGlossarySlug(tagLabel);
    if (glossarySlug) {
      onOpenGlossary(glossarySlug);
    } else {
      // For tags that don't have glossary entries, we can still try to open them
      // The GlossaryDetailPage will handle showing "not found" message
      const fallbackSlug = tagLabel.toLowerCase()
        .replace(/[()]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .trim();
      
      if (fallbackSlug) {
        onOpenGlossary(fallbackSlug);
      }
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
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6"
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
        onTagClick={onOpenGlossary ? handleTagClick : undefined}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center -mb-2">
        {/* Entry mode toggle - vertical stack on far left, centered in y-axis */}
        <div className="flex flex-row md:flex-col gap-2 md:justify-center">
          <Segmented
            options={entryOptions}
            value={entryMode}
            onChange={handleEntryModeChange}
            aria-label={copy.entrySelectLabel}
            className="!grid grid-cols-2 gap-2 auto-rows-fr md:w-44"
          />
        </div>
        
        {/* Version tabs - to the right of entry mode */}
        <div className="flex-1 md:ml-4">
          <VersionTabs
            versions={migratedTechnique.versions}
            activeVersionId={activeVersionId}
            onChange={handleVersionChange}
            label={copy.version}
          />
        </div>
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
                {currentSteps ? (
                  <StepsList
                    steps={currentSteps}
                    ariaLabel={`${migratedTechnique.name[locale]} – ${copy.steps}`}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="text-muted">
                      {locale === 'de' 
                        ? <>Für <strong>{entryOptions.find(opt => opt.value === entryMode)?.label}</strong> sind noch keine Schritte dokumentiert.</>
                        : <>No steps documented for <strong>{entryOptions.find(opt => opt.value === entryMode)?.label}</strong> yet.</>
                      }
                    </div>
                    <button
                      type="button"
                      className="text-sm text-subtle hover:text-[var(--color-text)] transition-colors"
                      onClick={() => {
                        // Placeholder for future feedback form integration
                        const subject = `Suggest steps for ${migratedTechnique.name[locale]} (${entryOptions.find(opt => opt.value === entryMode)?.label})`;
                        window.open(`mailto:feedback@example.com?subject=${encodeURIComponent(subject)}`, '_blank');
                      }}
                    >
                      {copy.entrySuggestSteps}
                    </button>
                  </div>
                )}
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
