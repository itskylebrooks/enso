import type { KeyboardEvent, ReactElement, ReactNode, Ref } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import { getTrainerInitialsById } from '@shared/constants/versionLabels';
import type {
  EntryMode,
  Locale,
  Progress,
  StudyStatus,
  Technique,
  TechniqueVariantKey,
} from '@shared/types';
import { LevelBadge } from '@shared/components';
import { EmphasizedName } from '@shared/components';
import { getTaxonomyLabel } from '@shared/i18n/taxonomy';
import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';
import { getGradeStyle } from '@shared/styles/belts';
import { StudyStatusIndicator } from '@shared/components/ui/StudyStatusIcon';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

export type TechniqueCardProps = {
  technique: Technique;
  locale: Locale;
  progress?: Progress;
  copy: Copy;
  onSelect: (slug: string, bookmarkedVariant?: TechniqueVariantKey) => void;
  motionIndex: number;
  actionSlot?: ReactNode;
  summarySlot?: ReactNode;
  isDimmed?: boolean;
  summaryLines?: 2 | 3;
  onCardKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  cardRef?: Ref<HTMLDivElement>;
  enableLayoutAnimation?: boolean;
  openedEntry?: EntryMode;
  showJapanese?: boolean;
  showVariantMeta?: boolean;
  compactSpacing?: boolean;
  showEntryTags?: boolean;
  headerAlign?: 'start' | 'center';
  levelBadgePlacement?: 'footer' | 'header';
  levelBadgeStyle?: 'default' | 'number-circle';
  variantMetaPlacement?: 'header' | 'footer';
  studyStatus?: StudyStatus;
} & MotionProps;

export const TechniqueCard = ({
  technique,
  locale,
  progress,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  // prefersReducedMotion removed (no hover motion)
  actionSlot,
  summarySlot,
  isDimmed,
  summaryLines,
  onCardKeyDown,
  cardRef,
  enableLayoutAnimation = false,
  openedEntry,
  showJapanese = true,
  showVariantMeta = true,
  compactSpacing = false,
  showEntryTags = true,
  headerAlign = 'start',
  levelBadgePlacement = 'footer',
  levelBadgeStyle = 'default',
  variantMetaPlacement = 'header',
  studyStatus = 'none',
}: TechniqueCardProps): ReactElement => {
  const bookmarkedVariant = progress?.bookmarkedVariant;

  // Get available entry modes from the first version (assume all versions have same entries)
  const availableEntries = technique.versions[0]?.stepsByEntry || {};
  const entryLabels: string[] = [];

  const labelByMode: Record<EntryMode | 'irimi' | 'tenkan' | 'omote' | 'ura', string> = {
    irimi: copy.entryIrimi,
    omote: copy.entryOmote,
    tenkan: copy.entryTenkan,
    ura: copy.entryUra,
  };

  if (bookmarkedVariant) {
    entryLabels.push(labelByMode[bookmarkedVariant.direction]);
  } else if (openedEntry) {
    entryLabels.push(labelByMode[openedEntry]);
  } else {
    ENTRY_MODE_ORDER.forEach((mode) => {
      if (availableEntries[mode]) {
        entryLabels.push(labelByMode[mode]);
      }
    });
  }

  const weaponLabel =
    !bookmarkedVariant && technique.weapon && technique.weapon !== 'empty-hand'
      ? getTaxonomyLabel(locale, 'weapon', technique.weapon)
      : null;

  const versionTagLabel = bookmarkedVariant
    ? bookmarkedVariant.hanmi === 'ai-hanmi'
      ? copy.hanmiAiHanmi
      : copy.hanmiGyakuHanmi
    : null;
  const directionTagLabel = bookmarkedVariant ? labelByMode[bookmarkedVariant.direction] : null;

  const selectedVersion = bookmarkedVariant?.versionId
    ? technique.versions.find(
        (version) =>
          version.id === bookmarkedVariant.versionId && version.hanmi === bookmarkedVariant.hanmi,
      ) ?? technique.versions.find((version) => version.id === bookmarkedVariant.versionId)
    : undefined;

  const trainerInitials =
    selectedVersion?.trainerId && selectedVersion.id !== 'v-base'
      ? getTrainerInitialsById(selectedVersion.trainerId)
      : null;

  const weaponFullLabel = bookmarkedVariant
    ? {
        empty: copy.weaponEmptyHand,
        bokken: copy.weaponBokken,
        jo: copy.weaponJo,
        tanto: copy.weaponTanto,
      }[bookmarkedVariant.weapon]
    : null;
  const variantMetaText = [versionTagLabel, directionTagLabel, trainerInitials, weaponFullLabel]
    .filter(Boolean)
    .join(' · ');
  const showVariantMetaInline =
    !showJapanese && showVariantMeta && Boolean(bookmarkedVariant) && variantMetaText.length > 0;
  const showVariantMetaInHeader = showVariantMetaInline && variantMetaPlacement === 'header';
  const showVariantMetaInFooter = showVariantMetaInline && variantMetaPlacement === 'footer';
  const hasTagFooter =
    (showEntryTags && entryLabels.length > 0) || Boolean(weaponLabel && !showVariantMetaInFooter);

  const handleActivate = () => {
    onSelect(technique.slug, bookmarkedVariant);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onCardKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  const levelNumber = technique.level.replace(/^\D+/, '');
  const levelStyle = getGradeStyle(technique.level);
  const levelBadge =
    levelBadgeStyle === 'number-circle' ? (
      <span
        className="glossary-tag text-xs font-medium px-2 py-1 rounded-full shrink-0 border border-transparent"
        style={{
          backgroundColor: levelStyle.backgroundColor,
          color: levelStyle.color,
          borderColor: levelStyle.borderColor,
        }}
      >
        {levelNumber}
      </span>
    ) : (
      <LevelBadge locale={locale} level={technique.level} />
    );

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={
        `surface border surface-border rounded-2xl p-4 flex flex-col ${
          compactSpacing ? 'gap-2' : 'gap-3'
        } text-left card-hover-shadow` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      layout={enableLayoutAnimation}
      /* Hover and tap motion removed to disable hover effects completely */
      animate={isDimmed ? {} : {}}
      title={technique.name[locale]}
    >
      <div
        className={`flex justify-between gap-3 ${
          headerAlign === 'center' ? 'items-center' : 'items-start'
        }`}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-start gap-2">
            <div
              className="min-w-0 flex-1 text-base font-medium leading-snug line-clamp-2"
              title={technique.name[locale]}
            >
              <EmphasizedName name={technique.name[locale]} />
            </div>
            <StudyStatusIndicator
              status={studyStatus}
              practiceLabel={copy.collectionsStudyPractice}
              stableLabel={copy.collectionsStudyStable}
              className="mt-0.5"
            />
          </div>
          {showJapanese && technique.jp && (
            <div className="text-xs text-subtle truncate">{technique.jp}</div>
          )}
          {showVariantMetaInHeader && <div className="text-xs text-subtle truncate">{variantMetaText}</div>}
        </div>
        <div
          className={
            levelBadgePlacement === 'header'
              ? 'flex flex-col items-end gap-2 shrink-0'
              : 'flex items-center gap-2'
          }
        >
          {levelBadgePlacement === 'header' && levelBadge}
          {actionSlot}
        </div>
      </div>

      <div className="relative">
        <p
          className={`text-sm text-muted leading-relaxed${
            summaryLines === 3 ? ' line-clamp-3' : summaryLines === 2 ? ' line-clamp-2' : ''
          }${summarySlot ? ' opacity-0 pointer-events-none select-none' : ''}`}
          aria-hidden={Boolean(summarySlot)}
        >
          {technique.summary[locale] ?? technique.summary.en}
        </p>
        {summarySlot && <div className="absolute inset-0 flex items-center">{summarySlot}</div>}
      </div>

      <div
        className={`mt-auto flex items-end gap-4 ${compactSpacing ? '' : 'pt-1'} ${
          showVariantMetaInFooter || hasTagFooter ? 'justify-between' : 'justify-end'
        }`}
      >
        {showVariantMetaInFooter ? (
          <div className="min-w-0 text-xs text-subtle truncate">{variantMetaText}</div>
        ) : (
          hasTagFooter && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
              {showEntryTags &&
                entryLabels.map((label) => (
                  <span key={label} className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">
                    {label}
                  </span>
                ))}
              {weaponLabel && (
                <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">
                  {weaponLabel}
                </span>
              )}
            </div>
          )
        )}
        {levelBadgePlacement === 'footer' && (
          <div className="shrink-0 self-end">
            {levelBadge}
          </div>
        )}
      </div>
    </motion.div>
  );
};
