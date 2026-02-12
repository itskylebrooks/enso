import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { GlossaryTerm, Grade, Locale, StudyStatus, Technique } from '@shared/types';
import { EmphasizedName } from '@shared/components';
import { LevelBadge } from '@shared/components';
import { AddToCollectionMenu } from '@features/bookmarks/components/AddToCollectionMenu';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { classNames } from '@shared/utils/classNames';
import { getCategoryStyle } from '@shared/styles/terms';
import { gradeLabel } from '@shared/utils/grades';
import { StudyStatusButton } from '@shared/components/ui/StudyStatusButton';

export type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  checked: boolean;
};

export type TagItem = {
  label: string;
  kind: 'category' | 'stance' | 'attack' | 'weapon' | 'entry';
};

export type TechniqueHeaderProps = {
  technique: Technique;
  locale: Locale;
  copy: Copy;
  backLabel: string;
  onBack: () => void;
  summary: string;
  tags: TagItem[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  studyStatus: StudyStatus;
  onToggleStudyStatus: () => void;
  collections: CollectionOption[];
  onToggleCollection: (collectionId: string, nextChecked: boolean) => void;
  onCreateCollection?: () => void;
  onTagClick?: (tag: string) => void;
  onLevelClick?: (level: Grade) => void;
};

export const TechniqueHeader = ({
  technique,
  locale,
  copy,
  backLabel,
  onBack,
  summary,
  tags,
  isBookmarked,
  onToggleBookmark,
  studyStatus,
  onToggleStudyStatus,
  collections,
  onToggleCollection,
  onCreateCollection,
  onTagClick,
  onLevelClick,
}: TechniqueHeaderProps): ReactElement => {
  const { toggleTransition, prefersReducedMotion } = useMotionPreferences();
  const levelLabel = gradeLabel(technique.level, locale);
  const studyLabel =
    studyStatus === 'none'
      ? copy.studyMarkPractice
      : studyStatus === 'practice'
        ? copy.studyMarkStable
        : copy.studyClearStatus;

  // Map tag to glossary category for appropriate styling
  const getTagCategory = (tag: string): GlossaryTerm['category'] => {
    const lowerTag = tag.toLowerCase();

    // Movement/technique category tags
    if (
      lowerTag.includes('nage') ||
      lowerTag.includes('throw') ||
      lowerTag.includes('irimi') ||
      lowerTag.includes('kaiten') ||
      lowerTag.includes('kokyu')
    ) {
      return 'movement';
    }

    // Stance category tags
    if (lowerTag.includes('kamae') || lowerTag.includes('hanmi') || lowerTag.includes('seiza')) {
      return 'stance';
    }

    // Attack category tags
    if (
      lowerTag.includes('tori') ||
      lowerTag.includes('uchi') ||
      lowerTag.includes('tsuki') ||
      lowerTag.includes('grab') ||
      lowerTag.includes('strike') ||
      lowerTag.includes('punch') ||
      lowerTag.includes('shomen') ||
      lowerTag.includes('yokomen') ||
      lowerTag.includes('katate') ||
      lowerTag.includes('ryote') ||
      lowerTag.includes('morote') ||
      lowerTag.includes('mune')
    ) {
      return 'attack';
    }

    // Control/technique family tags (nikyo, ikkyo, etc.)
    if (
      lowerTag.includes('kyo') ||
      lowerTag.includes('control') ||
      lowerTag.includes('pin') ||
      lowerTag.includes('osae') ||
      lowerTag.includes('katame')
    ) {
      return 'other';
    }

    // Default to movement for general technique terms
    return 'movement';
  };

  return (
    <header className="z-10 border-b surface-border pb-4 bg-transparent space-y-6">
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-3">
          <a
            href="/"
            aria-label={backLabel}
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
            className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
          >
            <span aria-hidden>←</span>
            <span>{backLabel}</span>
          </a>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold leading-tight" title={technique.name[locale]}>
              <EmphasizedName name={technique.name[locale]} />
            </h1>
            {technique.jp && <div className="text-sm text-subtle">{technique.jp}</div>}
          </div>
        </div>
        <div className="hidden sm:flex sm:col-start-2 sm:row-start-1 sm:justify-end sm:items-start sm:self-start">
          {onLevelClick ? (
            <button
              type="button"
              onClick={() => onLevelClick(technique.level)}
              aria-label={levelLabel}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-opacity hover:opacity-80"
            >
              <LevelBadge locale={locale} level={technique.level} />
            </button>
          ) : (
            <LevelBadge locale={locale} level={technique.level} />
          )}
        </div>
        <div className="min-w-0 sm:col-start-1 sm:row-start-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => {
                // tag is TagItem { label, kind }
                const lowerTagKey = tag.kind === 'entry' ? tag.label.toLowerCase() : '';
                let displayLabel = tag.label;
                if (
                  tag.kind === 'entry' &&
                  ['irimi', 'tenkan', 'omote', 'ura'].includes(lowerTagKey)
                ) {
                  const map: Record<string, string> = {
                    irimi: copy.entryIrimi,
                    tenkan: copy.entryTenkan,
                    omote: copy.entryOmote,
                    ura: copy.entryUra,
                  };
                  displayLabel = map[lowerTagKey] || tag.label;
                }

                // Category tags should use the 'other' / grey palette in glossary
                // Stance tags should use the 'stance' (green) palette
                const tagCategory =
                  tag.kind === 'category'
                    ? 'other'
                    : tag.kind === 'stance'
                      ? 'stance'
                      : getTagCategory(displayLabel);
                const categoryStyle = getCategoryStyle(tagCategory);

                return onTagClick ? (
                  <button
                    key={`${tag.label}-${tag.kind}`}
                    type="button"
                    onClick={() => onTagClick(displayLabel)}
                    className="glossary-tag glossary-tag--interactive max-w-full truncate rounded-lg px-2 py-1 text-xs uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                    style={{
                      backgroundColor: categoryStyle.backgroundColor,
                      color: categoryStyle.color,
                    }}
                  >
                    {displayLabel}
                  </button>
                ) : (
                  <span
                    key={`${tag.label}-${tag.kind}`}
                    className="glossary-tag max-w-full truncate rounded-lg px-2 py-1 text-xs uppercase tracking-wide"
                    style={{
                      backgroundColor: categoryStyle.backgroundColor,
                      color: categoryStyle.color,
                    }}
                  >
                    {displayLabel}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:col-start-2 sm:row-start-2 sm:w-auto sm:justify-end sm:self-center sm:shrink-0">
          <div className="sm:hidden">
            {onLevelClick ? (
              <button
                type="button"
                onClick={() => onLevelClick(technique.level)}
                aria-label={levelLabel}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-opacity hover:opacity-80"
              >
                <LevelBadge locale={locale} level={technique.level} />
              </button>
            ) : (
              <LevelBadge locale={locale} level={technique.level} />
            )}
          </div>
          <div className="flex gap-2">
            <div data-tour-target="detail-study-status">
              <StudyStatusButton
                status={studyStatus}
                label={studyLabel}
                onClick={onToggleStudyStatus}
                popupTrigger="click"
                popupTextByStatus={{
                  none: copy.toastStudyCleared,
                  practice: copy.toastStudyPractice,
                  stable: copy.toastStudyStable,
                }}
              />
            </div>
            <div className="flex gap-2" data-tour-target="detail-bookmarks-collections">
              <AddToCollectionMenu
                copy={copy}
                collections={collections}
                onToggle={(collectionId, nextChecked) =>
                  onToggleCollection(collectionId, nextChecked)
                }
                onCreate={onCreateCollection}
                size="header"
              />
              <div className="inline-flex rounded-lg border surface-border overflow-hidden">
                <motion.button
                  type="button"
                  onClick={onToggleBookmark}
                  aria-pressed={isBookmarked}
                  aria-label={copy.bookmark}
                  transition={toggleTransition}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  className={classNames(
                    'px-3 py-2 text-sm inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors duration-150',
                    isBookmarked
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <motion.span
                    aria-hidden
                    className="w-5 h-5 flex items-center justify-center md:h-4 md:w-4"
                    animate={
                      isBookmarked ? { scale: 1, opacity: 1 } : { scale: 0.86, opacity: 0.85 }
                    }
                    transition={toggleTransition}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 md:h-4 md:w-4" />
                    ) : (
                      <Bookmark className="w-5 h-5 md:h-4 md:w-4" />
                    )}
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-base text-muted leading-relaxed max-w-3xl">{summary}</p>
    </header>
  );
};
