import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  Direction,
  WeaponKind,
  Locale,
  Progress,
  Technique,
} from '@shared/types';
import { getTaxonomyLabel, taxonomyLabels, expandWithSynonyms, normalizeTaxonomyValue } from '@shared/i18n/taxonomy';
import { stripDiacritics } from '@shared/utils/text';
import { useMotionPreferences, defaultEase } from '@shared/components/ui/motion';
import { TechniqueHeader, type CollectionOption } from './TechniqueHeader';
import { TechniqueToolbar, type TechniqueToolbarValue } from './TechniqueToolbar';
import { StepsList } from './StepsList';
import { UkePanel } from './UkePanel';
import { MediaPanel } from './MediaPanel';
import { NotesPanel } from './NotesPanel';
import { FootprintsIcon } from '@shared/components/ui/icons';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import { getActiveVariant } from '@features/technique/store';
import { parseTechniqueVariantParams, buildTechniqueUrlWithVariant } from '@shared/constants/urls';
import { NameModal } from '@shared/components/ui/modals/NameModal';

type TagItem = { label: string; kind: 'category' | 'stance' | 'attack' | 'weapon' | 'entry' };

const buildTags = (technique: Technique, locale: Locale): TagItem[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = stripDiacritics(title);

  // We'll build tags in the requested order:
  // 1) Category (canonical categories from taxonomy)
  // 2) Attack
  // 3) Weapon (if applicable and not empty-hand)
  // 4) Entry tags (irimi, tenkan, omote, ura) last

  const unique: TagItem[] = [];
  const seen = new Set<string>();

  const pushIfValid = (label: string | undefined | null, kind: TagItem['kind'], ignoreTitle = false) => {
    if (!label) return;
    const normalizedValue = stripDiacritics(label.toLowerCase());
    if (normalizedValue.length === 0) return;
    if (!ignoreTitle && normalizedTitle.includes(normalizedValue)) return;
    if (seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    unique.push({ label, kind });
  };

  // 1) Category
  pushIfValid(getTaxonomyLabel(locale, 'category', technique.category), 'category');

  // 1.5) Stance tags (hanmi) - show available hanmi values if present
  const hanmiSet = new Set<string>();
  (technique.versions || []).forEach((v) => {
    const hanmi = (v as any).hanmi as string | undefined;
    if (hanmi) hanmiSet.add(hanmi);
  });
  ['ai-hanmi', 'gyaku-hanmi'].forEach((h) => {
    if (hanmiSet.has(h)) pushIfValid(h, 'stance');
  });

  // 2) Attack
  pushIfValid(getTaxonomyLabel(locale, 'attack', technique.attack || ''), 'attack');

  // 3) Weapon (only if not empty-hand)
  if (technique.weapon && technique.weapon !== 'empty-hand') {
    pushIfValid(getTaxonomyLabel(locale, 'weapon', technique.weapon), 'weapon');
  }

  // 4) Entry type tags (irimi/tenkan/omote/ura) - add last in this order
  const entrySet = new Set<string>();
  (technique.versions || []).forEach((v) => {
    const stepsBy = (v as any).stepsByEntry as Record<string, unknown> | undefined;
    if (!stepsBy) return;
    ['irimi', 'tenkan', 'omote', 'ura'].forEach((entry) => {
      if (stepsBy[entry]) entrySet.add(entry);
    });
  });

  ['irimi', 'tenkan', 'omote', 'ura'].forEach((entry) => {
    if (entrySet.has(entry)) {
      // For entry tags, show them even if the technique title already contains the word
      pushIfValid(entry, 'entry', true);
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
  onVariantChange?: (direction: Direction, weapon: WeaponKind, versionId?: string | null) => void;
  onFeedbackClick?: () => void;
  onCreateCollection?: (name: string) => string | null;
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

// Map tag labels (possibly localized) to glossary slugs
const mapTagToGlossarySlug = (tagLabel: string, locale: Locale): string | null => {
  if (!tagLabel) return null;
  const raw = tagLabel.trim();
  const normalizedLabel = raw.toLowerCase().replace(/\s+/g, ' ').trim();

  // Common direct mappings (English forms)
  const direct: Record<string, string> = {
    'throws (nage-waza)': 'nage-waza',
    'throws': 'nage-waza',
    'controls / pins (osae-waza)': 'osae-waza',
    'controls': 'osae-waza',
    'immobilizations (katame-waza)': 'katame-waza',
    'weapons (buki-waza)': 'buki-waza',
    'shomen-uchi': 'shomen-uchi',
    'irimi': 'irimi',
    'tenkan': 'tenkan',
    'omote': 'omote',
    'ura': 'ura',
  };

  if (direct[normalizedLabel]) return direct[normalizedLabel];

  // 1) Try to detect explicit parenthetical slug: e.g. "Würfe (Nage-waza)"
  const paren = raw.match(/\(([^)]+)\)/);
  if (paren && paren[1]) {
    const candidate = normalizeTaxonomyValue(paren[1]);
    // check if it's a known category key
    if (taxonomyLabels.en?.category && taxonomyLabels.en.category[candidate as keyof typeof taxonomyLabels.en.category]) {
      return candidate;
    }
    // also allow direct candidate
    return candidate;
  }

  // 2) Reverse lookup in taxonomyLabels for both locales
  const tryReverseLookup = (lookLocale: keyof typeof taxonomyLabels) => {
    const map = taxonomyLabels[lookLocale].category || {};
    for (const [key, label] of Object.entries(map)) {
      const labelRaw = label || '';
      const labelNormalized = normalizeTaxonomyValue(labelRaw);
      const labelPrefix = normalizeTaxonomyValue(labelRaw.split('(')[0] || labelRaw);
      if (
        labelNormalized === normalizedLabel ||
        labelPrefix === normalizedLabel ||
        labelNormalized === raw.toLowerCase() ||
        labelPrefix === raw.toLowerCase()
      ) {
        return key;
      }
    }
    return null as string | null;
  };

  // Check current locale first, then fallback to English
  const fromLocale = tryReverseLookup(locale);
  if (fromLocale) return fromLocale;
  const fromEn = tryReverseLookup('en');
  if (fromEn) return fromEn;

  // 3) Try synonyms expansion: if any synonym maps to a taxonomy key, return it
  const synonyms = expandWithSynonyms(normalizedLabel);
  for (const syn of synonyms) {
    const cand = normalizeTaxonomyValue(syn);
  if (taxonomyLabels.en?.category && taxonomyLabels.en.category[cand as keyof typeof taxonomyLabels.en.category]) return cand;
  }

  // 4) Fallback: slugify the label (remove non-ascii junk first)
  const stripped = normalizedLabel.replace(/[()]/g, '').replace(/[^a-z0-9\s-_]/gi, '');
  const candidate = stripped.trim().replace(/\s+/g, '-').toLowerCase();
  return candidate.length > 0 ? candidate : null;
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
  onVariantChange,
  onFeedbackClick,
  onCreateCollection,
}: TechniquePageProps): ReactElement => {
  const tags = useMemo(() => buildTags(technique, locale), [technique, locale]);
  const summary = technique.summary[locale] || technique.summary.en;
  const { prefersReducedMotion } = useMotionPreferences();

  // Enrich technique with variants if not already present
  const enrichedTechnique = useMemo(() => enrichTechniqueWithVariants(technique), [technique]);

  // Parse URL params on mount to hydrate initial state
  const initialVariantParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return parseTechniqueVariantParams(window.location.pathname);
  }, []);

  const versionsMeta = enrichedTechnique.versionsMeta || [];

  const hasBaseVersion = (enrichedTechnique.versions || []).some(v => v.id === 'v-base');

  // Get available variant combinations to intelligently disable options
  const availableVariants = useMemo(() => {
    return enrichedTechnique.variants || [];
  }, [enrichedTechnique]);

  // Helper to check if a specific combination exists
  const variantExists = useCallback((hanmi: import('@shared/types').Hanmi, direction: Direction, weapon: WeaponKind, versionId: string | null) => {
    return availableVariants.some(v => 
      v.key.hanmi === hanmi &&
      v.key.direction === direction && 
      v.key.weapon === weapon && 
      v.key.versionId === versionId
    );
  }, [availableVariants]);

  // Initialize toolbar state from URL or defaults to first available variant
  const [toolbarValue, setToolbarValue] = useState<TechniqueToolbarValue>(() => {
    // If URL params specify a valid variant, use it
    if (initialVariantParams && variantExists(initialVariantParams.hanmi, initialVariantParams.direction, initialVariantParams.weapon, initialVariantParams.versionId || null)) {
      return {
        hanmi: initialVariantParams.hanmi,
        direction: initialVariantParams.direction,
        weapon: initialVariantParams.weapon,
        versionId: initialVariantParams.versionId || null,
      };
    }

    // Otherwise, find first available variant
    const firstVariant = availableVariants[0];
    if (firstVariant) {
      return {
        hanmi: firstVariant.key.hanmi,
        direction: firstVariant.key.direction,
        weapon: firstVariant.key.weapon,
        versionId: firstVariant.key.versionId || null,
      };
    }

    // Fallback (should not happen with required hanmi in all versions)
    return {
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: null,
    };
  });

  // Get available hanmis/directions/weapons for the CURRENTLY SELECTED version
  const availableHanmisForCurrentVersion = useMemo(() => {
    const hanmis = new Set<import('@shared/types').Hanmi>();
    availableVariants
      .filter(v => v.key.versionId === (toolbarValue.versionId || null))
      .forEach(v => {
        hanmis.add(v.key.hanmi);
      });
    return Array.from(hanmis).sort();
  }, [availableVariants, toolbarValue.versionId]);

  const availableDirectionsForCurrentVersion = useMemo(() => {
    const directions = new Set<Direction>();
    availableVariants
      .filter(v => v.key.versionId === (toolbarValue.versionId || null))
      .forEach(v => directions.add(v.key.direction));
    return Array.from(directions).sort();
  }, [availableVariants, toolbarValue.versionId]);

  const availableWeaponsForCurrentVersion = useMemo(() => {
    const weapons = new Set<WeaponKind>();
    availableVariants
      .filter(v => v.key.versionId === (toolbarValue.versionId || null))
      .forEach(v => weapons.add(v.key.weapon));
    return Array.from(weapons).sort();
  }, [availableVariants, toolbarValue.versionId]);

  // Get active variant based on current toolbar selection
  const activeVariant = useMemo(
    () => getActiveVariant(
      enrichedTechnique,
      toolbarValue.hanmi,
      toolbarValue.direction,
      toolbarValue.weapon,
      toolbarValue.versionId
    ),
    [enrichedTechnique, toolbarValue]
  );

  // Handle toolbar changes
  const handleToolbarChange = useCallback(
    (newValue: TechniqueToolbarValue) => {
      // Check if this combination exists
      const exists = variantExists(newValue.hanmi, newValue.direction, newValue.weapon, newValue.versionId || null);
      
      let finalValue = newValue;
      
      // If combination doesn't exist, find first available variant
      if (!exists) {
        // Priority: Version determines what's available
        // Find first available variant for this version (if version changed)
        // Or find first available for this direction/weapon combo (if direction/weapon changed)
        
        const previousValue = toolbarValue;
        const versionChanged = newValue.versionId !== previousValue.versionId;
        
        if (versionChanged) {
          // Version changed - find first available hanmi/direction/weapon for this version
          const firstForVersion = availableVariants.find(v => 
            v.key.versionId === (newValue.versionId || null)
          );
          
          if (firstForVersion) {
            finalValue = {
              hanmi: firstForVersion.key.hanmi,
              direction: firstForVersion.key.direction,
              weapon: firstForVersion.key.weapon,
              versionId: newValue.versionId,
            };
          }
        } else {
          // Direction, weapon, or hanmi changed - try to keep as much as possible
          // First try: keep version, adjust other parameters
          const availableForVersion = availableVariants.filter(v => 
            v.key.versionId === (newValue.versionId || null)
          );
          
          // Try to find a matching variant
          const match = availableForVersion.find(v => 
            v.key.hanmi === newValue.hanmi &&
            v.key.direction === newValue.direction &&
            v.key.weapon === newValue.weapon
          );
          
          if (match) {
            finalValue = {
              hanmi: match.key.hanmi,
              direction: match.key.direction,
              weapon: match.key.weapon,
              versionId: newValue.versionId,
            };
          } else if (availableForVersion[0]) {
            // Fallback to first available for this version
            finalValue = {
              hanmi: availableForVersion[0].key.hanmi,
              direction: availableForVersion[0].key.direction,
              weapon: availableForVersion[0].key.weapon,
              versionId: newValue.versionId,
            };
          }
        }
      }
      
      setToolbarValue(finalValue);
      
      // Update URL without full page reload - using path-based routing
      if (typeof window !== 'undefined') {
        const newPath = buildTechniqueUrlWithVariant(technique.slug, {
          hanmi: finalValue.hanmi,
          direction: finalValue.direction,
          weapon: finalValue.weapon,
          versionId: finalValue.versionId,
        });
        window.history.replaceState({}, '', newPath);
      }
      
      // Notify parent
      onVariantChange?.(finalValue.direction, finalValue.weapon, finalValue.versionId);
      
      // Preserve scroll to Steps heading
      const stepsHeading = document.querySelector('[data-steps-section]');
      if (stepsHeading) {
        stepsHeading.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [onVariantChange, variantExists, availableVariants, toolbarValue]
  );

  const bookmarkedActive = Boolean(progress?.bookmarked);
  const collectionOptions = useMemo(
    () => getCollectionOptions(collections, bookmarkCollections, technique.id),
    [collections, bookmarkCollections, technique.id],
  );

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const openCreateDialog = () => setDialogOpen(true);
  const closeCreateDialog = () => setDialogOpen(false);

  const handleCreate = (name: string) => {
    if (!onCreateCollection) return closeCreateDialog();
    const newId = onCreateCollection(name);
    closeCreateDialog();
    if (newId) {
      // Assign the current technique to the newly created collection
      onAssignToCollection(newId);
    }
  };

  const handleCollectionToggle = (collectionId: string, nextChecked: boolean) => {
    if (nextChecked) {
      onAssignToCollection(collectionId);
    } else {
      onRemoveFromCollection(collectionId);
    }
  };

  const handleTagClick = (tagLabel: string) => {
    if (!onOpenGlossary) return;
    const glossarySlug = mapTagToGlossarySlug(tagLabel, locale);
    if (glossarySlug) {
      onOpenGlossary(glossarySlug);
    }
  };

  const motionInitial = prefersReducedMotion ? undefined : { opacity: 0, y: 18 };
  const motionAnimate = prefersReducedMotion ? undefined : { opacity: 1, y: 0 };
  const motionExit = prefersReducedMotion ? undefined : { opacity: 0, y: -18 };
  const variantMotionTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.18, ease: defaultEase };

  const stepsLabel = copy.steps;

  // Toolbar labels
  const toolbarLabels = {
    hanmi: copy.toolbarHanmi,
    direction: copy.toolbarDirection,
    weapon: copy.toolbarWeapon,
    version: copy.toolbarVersion,
    aiHanmi: copy.hanmiAiHanmi,
    gyakuHanmi: copy.hanmiGyakuHanmi,
    irimi: copy.entryIrimi,
    tenkan: copy.entryTenkan,
    omote: copy.entryOmote,
    ura: copy.entryUra,
    emptyHand: copy.weaponEmptyHand,
    bokken: copy.weaponBokken,
    jo: copy.weaponJo,
    tanto: copy.weaponTanto,
    standard: copy.versionBase ?? 'Base',
  };

  return (
    <motion.main
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6"
      initial={motionInitial}
      animate={motionAnimate}
      transition={variantMotionTransition}
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
        onCreateCollection={openCreateDialog}
        onTagClick={onOpenGlossary ? handleTagClick : undefined}
      />

      {/* New Toolbar */}
      <TechniqueToolbar
        hanmisAvailable={availableHanmisForCurrentVersion}
        directionsAvailable={availableDirectionsForCurrentVersion}
        weaponsAvailable={availableWeaponsForCurrentVersion}
        versions={versionsMeta}
        value={toolbarValue}
        onChange={handleToolbarChange}
        labels={toolbarLabels}
        hasBaseVersion={hasBaseVersion}
      />

      <AnimatePresence mode="wait">
        <motion.section
    key={`${toolbarValue.hanmi}-${toolbarValue.direction}-${toolbarValue.weapon}-${toolbarValue.versionId || 'base'}`}
          initial={motionInitial}
          animate={motionAnimate}
          exit={motionExit}
          transition={variantMotionTransition}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {activeVariant && activeVariant.steps && (
                <section className="space-y-4" data-steps-section>
                  <header className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-subtle">
                    <FootprintsIcon className="w-4 h-4" />
                    <span>{stepsLabel}</span>
                  </header>
                  <StepsList
                    steps={activeVariant.steps[locale] || activeVariant.steps.en}
                    ariaLabel={`${enrichedTechnique.name[locale]} – ${copy.steps}`}
                  />
                </section>
              )}
              {activeVariant?.uke && (
                <UkePanel
                  role={activeVariant.uke.role[locale] || activeVariant.uke.role.en}
                  notes={activeVariant.uke.notes[locale] || activeVariant.uke.notes.en}
                  copy={copy}
                />
              )}
            </div>
            <div className="space-y-8">
              {activeVariant?.media && activeVariant.media.length > 0 && (
                <MediaPanel media={activeVariant.media} copy={copy} />
              )}
              {(activeVariant?.commonMistakes || activeVariant?.context) && (
                <NotesPanel
                  commonMistakes={
                    activeVariant.commonMistakes
                      ? activeVariant.commonMistakes[locale] || activeVariant.commonMistakes.en
                      : undefined
                  }
                  context={activeVariant.context ? activeVariant.context[locale] || activeVariant.context.en : undefined}
                  copy={copy}
                  onFeedbackClick={onFeedbackClick}
                />
              )}
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
      <AnimatePresence>
        {dialogOpen && (
          <NameModal
            key="technique-create-collection"
            strings={{
              title: copy.collectionsNew,
              nameLabel: copy.collectionsNameLabel,
              confirmLabel: copy.collectionsCreateAction,
              cancelLabel: copy.collectionsCancel,
            }}
            onCancel={closeCreateDialog}
            onConfirm={(name) => handleCreate(name)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
};
