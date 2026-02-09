import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import { getTrainerInitialsById } from '@shared/constants/versionLabels';
import type { EntryMode, Locale, Progress, Technique, TechniqueVariantKey } from '@shared/types';
import { LevelBadge } from '@shared/components';
import { EmphasizedName } from '@shared/components';
import { getTaxonomyLabel } from '@shared/i18n/taxonomy';
import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';

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
  isDimmed?: boolean;
  summaryLines?: 2 | 3;
  openedEntry?: EntryMode;
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
  isDimmed,
  summaryLines,
  openedEntry,
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

  const selectedVersion = bookmarkedVariant?.versionId
    ? technique.versions.find(
        (version) =>
          version.id === bookmarkedVariant.versionId && version.hanmi === bookmarkedVariant.hanmi,
      ) ?? technique.versions.find((version) => version.id === bookmarkedVariant.versionId)
    : undefined;

  const trainerInitials = selectedVersion?.trainerId
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

  const handleActivate = () => {
    onSelect(technique.slug, bookmarkedVariant);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={
        `surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      /* Hover and tap motion removed to disable hover effects completely */
      animate={isDimmed ? {} : {}}
      title={technique.name[locale]}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div
            className="text-base font-medium leading-snug line-clamp-2"
            title={technique.name[locale]}
          >
            <EmphasizedName name={technique.name[locale]} />
          </div>
          {bookmarkedVariant && (
            <div className="text-xs text-subtle truncate">
              {[versionTagLabel, trainerInitials, weaponFullLabel].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">{actionSlot}</div>
      </div>

      <p
        className={`text-sm text-muted leading-relaxed${
          summaryLines === 2 ? ' line-clamp-2' : ' line-clamp-3'
        }`}
      >
        {technique.summary[locale] ?? technique.summary.en}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
          {entryLabels.map((label) => (
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
        <div className="shrink-0 self-end">
          <LevelBadge locale={locale} level={technique.level} />
        </div>
      </div>
    </motion.div>
  );
};
