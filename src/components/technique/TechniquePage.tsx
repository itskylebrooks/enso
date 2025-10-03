import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '../../shared/constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  Direction,
  WeaponKind,
  Locale,
  Progress,
  Technique,
} from '../../shared/types';
import { getTaxonomyLabel } from '../../shared/i18n/taxonomy';
import { stripDiacritics } from '../../shared/utils/text';
import { useMotionPreferences, defaultEase } from '../ui/motion';
import { TechniqueHeader, type CollectionOption } from './TechniqueHeader';
import { TechniqueToolbar, type TechniqueToolbarValue } from './TechniqueToolbar';
import { StepsList } from './StepsList';
import { UkePanel } from './UkePanel';
import { MediaPanel } from './MediaPanel';
import { NotesPanel } from './NotesPanel';
import { enrichTechniqueWithVariants } from '../../utils/variantMapping';
import { getActiveVariant } from '../../features/technique/store';
import { parseTechniqueVariantParams } from '../../utils/urls';

const buildTags = (technique: Technique, locale: Locale): string[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = stripDiacritics(title);

  const candidates: Array<{ type: 'category' | 'attack' | 'weapon'; value?: string | null }> = [
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
  onOpenGlossary?: (slug: string) => void;
  onVariantChange?: (direction: Direction, weapon: WeaponKind, versionId?: string | null) => void;
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

// Map tag labels to glossary slugs (simplified version)
const mapTagToGlossarySlug = (tagLabel: string): string | null => {
  const labelToSlugMap: Record<string, string> = {
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

  const normalizedTag = tagLabel.toLowerCase().replace(/\s+/g, ' ').trim();
  return labelToSlugMap[normalizedTag] || null;
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
}: TechniquePageProps): ReactElement => {
  const tags = useMemo(() => buildTags(technique, locale), [technique, locale]);
  const summary = technique.summary[locale] || technique.summary.en;
  const { prefersReducedMotion } = useMotionPreferences();

  // Enrich technique with variants if not already present
  const enrichedTechnique = useMemo(() => enrichTechniqueWithVariants(technique), [technique]);

  // Parse URL params on mount to hydrate initial state
  const initialVariantParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return parseTechniqueVariantParams(window.location.search);
  }, []);

  const versionsMeta = enrichedTechnique.versionsMeta || [];

  // Get available variant combinations to intelligently disable options
  const availableVariants = useMemo(() => {
    return enrichedTechnique.variants || [];
  }, [enrichedTechnique]);

  // Helper to check if a specific combination exists
  const variantExists = useCallback((direction: Direction, weapon: WeaponKind, versionId: string | null) => {
    return availableVariants.some(v => 
      v.key.direction === direction && 
      v.key.weapon === weapon && 
      v.key.versionId === versionId
    );
  }, [availableVariants]);

  // Initialize toolbar state from URL or defaults to first available variant
  const [toolbarValue, setToolbarValue] = useState<TechniqueToolbarValue>(() => {
    const urlDir = initialVariantParams?.direction;
    const urlWeapon = initialVariantParams?.weapon;
    const urlVersion = initialVariantParams?.versionId;

    // If URL params specify a valid variant, use it
    if (urlDir && urlWeapon && variantExists(urlDir, urlWeapon, urlVersion || null)) {
      return {
        direction: urlDir,
        weapon: urlWeapon,
        versionId: urlVersion || null,
      };
    }

    // Otherwise, find first available variant
    const firstVariant = availableVariants[0];
    if (firstVariant) {
      return {
        direction: firstVariant.key.direction,
        weapon: firstVariant.key.weapon,
        versionId: firstVariant.key.versionId || null,
      };
    }

    // Fallback
    return {
      direction: 'irimi',
      weapon: 'empty',
      versionId: null,
    };
  });

  // Get available directions/weapons for the CURRENTLY SELECTED version
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
      const exists = variantExists(newValue.direction, newValue.weapon, newValue.versionId || null);
      
      let finalValue = newValue;
      
      // If combination doesn't exist, find first available variant
      if (!exists) {
        // Priority: Version determines what's available
        // Find first available variant for this version (if version changed)
        // Or find first available for this direction/weapon combo (if direction/weapon changed)
        
        const previousValue = toolbarValue;
        const versionChanged = newValue.versionId !== previousValue.versionId;
        
        if (versionChanged) {
          // Version changed - find first available direction/weapon for this version
          const firstForVersion = availableVariants.find(v => 
            v.key.versionId === (newValue.versionId || null)
          );
          
          if (firstForVersion) {
            finalValue = {
              direction: firstForVersion.key.direction,
              weapon: firstForVersion.key.weapon,
              versionId: newValue.versionId,
            };
          }
        } else {
          // Direction or weapon changed - try to keep as much as possible
          // First try: keep version, adjust direction or weapon
          const availableForVersion = availableVariants.filter(v => 
            v.key.versionId === (newValue.versionId || null)
          );
          
          // Try to keep the direction if weapon changed
          if (newValue.weapon !== previousValue.weapon) {
            const keepDirection = availableForVersion.find(v => v.key.direction === newValue.direction);
            if (keepDirection) {
              finalValue = {
                direction: keepDirection.key.direction,
                weapon: keepDirection.key.weapon,
                versionId: newValue.versionId,
              };
            } else if (availableForVersion[0]) {
              finalValue = {
                direction: availableForVersion[0].key.direction,
                weapon: availableForVersion[0].key.weapon,
                versionId: newValue.versionId,
              };
            }
          }
          // Try to keep the weapon if direction changed
          else if (newValue.direction !== previousValue.direction) {
            const keepWeapon = availableForVersion.find(v => v.key.weapon === newValue.weapon);
            if (keepWeapon) {
              finalValue = {
                direction: keepWeapon.key.direction,
                weapon: keepWeapon.key.weapon,
                versionId: newValue.versionId,
              };
            } else if (availableForVersion[0]) {
              finalValue = {
                direction: availableForVersion[0].key.direction,
                weapon: availableForVersion[0].key.weapon,
                versionId: newValue.versionId,
              };
            }
          }
        }
      }
      
      setToolbarValue(finalValue);
      
      // Update URL without full page reload
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('dir', finalValue.direction);
        url.searchParams.set('wp', finalValue.weapon);
        if (finalValue.versionId) {
          url.searchParams.set('ver', finalValue.versionId);
        } else {
          url.searchParams.delete('ver');
        }
        window.history.replaceState({}, '', url.toString());
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
    direction: copy.toolbarDirection,
    weapon: copy.toolbarWeapon,
    version: copy.toolbarVersion,
    irimi: copy.entryIrimi,
    tenkan: copy.entryTenkan,
    omote: copy.entryOmote,
    ura: copy.entryUra,
    emptyHand: copy.weaponEmptyHand,
    bokken: copy.weaponBokken,
    jo: copy.weaponJo,
    tanto: copy.weaponTanto,
    standard: copy.versionStandard,
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
        onTagClick={onOpenGlossary ? handleTagClick : undefined}
      />

      {/* New Toolbar */}
      <TechniqueToolbar
        directionsAvailable={availableDirectionsForCurrentVersion}
        weaponsAvailable={availableWeaponsForCurrentVersion}
        versions={versionsMeta}
        value={toolbarValue}
        onChange={handleToolbarChange}
        labels={toolbarLabels}
      />

      <AnimatePresence mode="wait">
        <motion.section
          key={`${toolbarValue.direction}-${toolbarValue.weapon}-${toolbarValue.versionId || 'standard'}`}
          initial={motionInitial}
          animate={motionAnimate}
          exit={motionExit}
          transition={variantMotionTransition}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {activeVariant && activeVariant.steps && (
                <section className="space-y-4" data-steps-section>
                  <header className="text-xs uppercase tracking-[0.3em] text-subtle">{stepsLabel}</header>
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
              {(activeVariant?.keyPoints || activeVariant?.commonMistakes || activeVariant?.context) && (
                <NotesPanel
                  keyPoints={activeVariant.keyPoints ? activeVariant.keyPoints[locale] || activeVariant.keyPoints.en : undefined}
                  commonMistakes={
                    activeVariant.commonMistakes
                      ? activeVariant.commonMistakes[locale] || activeVariant.commonMistakes.en
                      : undefined
                  }
                  context={activeVariant.context ? activeVariant.context[locale] || activeVariant.context.en : undefined}
                  copy={copy}
                />
              )}
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </motion.main>
  );
};
