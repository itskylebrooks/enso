import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique, Collection, BookmarkCollection } from '../../types';
import { EmphasizedName, LevelBadge } from '../common';
import { BookmarkIcon, BookmarkCheckIcon } from '../common/icons';
import { MediaEmbed } from '../media/MediaEmbed';
import { classNames } from '../../utils/classNames';
import { getTaxonomyLabel } from '../../i18n/taxonomy';
import { stripDiacritics } from '../../utils/text';
import { useMotionPreferences, defaultEase } from '../ui/motion';
import { AddToCollectionMenu } from '../bookmarks/AddToCollectionMenu';

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
  const tags = buildTags(technique, locale);
  const steps = technique.steps[locale];
  const ukeNotes = technique.ukeNotes ? technique.ukeNotes[locale] : null;
  const { mediaMotion, prefersReducedMotion, toggleTransition } = useMotionPreferences();

  const bookmarkedActive = Boolean(progress?.bookmarked);
  
  // Collection logic
  const techniqueCollectionIds = new Set(
    bookmarkCollections
      .filter((entry) => entry.techniqueId === technique.id)
      .map((entry) => entry.collectionId)
  );
  
  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon ?? null,
    checked: techniqueCollectionIds.has(collection.id),
  }));
  
  const handleCollectionToggle = (collectionId: string, nextChecked: boolean) => {
    if (nextChecked) {
      onAssignToCollection(collectionId);
    } else {
      onRemoveFromCollection(collectionId);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-10">
  <header className="z-10 border-b surface-border pb-4 bg-transparent">
        <div className="flex flex-wrap items-start justify-between gap-6">
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
              <h1 className="text-2xl font-semibold leading-tight truncate" title={technique.name[locale]}>
                <EmphasizedName name={technique.name[locale]} />
              </h1>
              {technique.jp && <div className="text-sm text-subtle truncate">{technique.jp}</div>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border surface-border bg-[var(--color-surface)] px-2 py-1 text-xs uppercase tracking-wide text-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LevelBadge locale={locale} level={technique.level} />
            <div className="flex gap-2">
              <AddToCollectionMenu
                copy={copy}
                collections={collectionOptions}
                onToggle={handleCollectionToggle}
              />
              <div className="inline-flex rounded-lg border surface-border overflow-hidden">
                <motion.button
                  type="button"
                  onClick={onToggleBookmark}
                  aria-pressed={bookmarkedActive}
                  transition={toggleTransition}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  className={classNames(
                    'px-3 py-1.5 text-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors duration-150',
                    bookmarkedActive
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <motion.span
                    aria-hidden
                    className="w-4 h-4 flex items-center justify-center"
                    animate={bookmarkedActive ? { scale: 1, opacity: 1 } : { scale: 0.86, opacity: 0.85 }}
                    transition={toggleTransition}
                  >
                    {bookmarkedActive ? <BookmarkCheckIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                  </motion.span>
                  <motion.span
                    className="overflow-hidden"
                    animate={bookmarkedActive ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                    transition={toggleTransition}
                  >
                    {copy.bookmark}
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-10">
        <section>
          <h2 className="uppercase tracking-[0.3em] text-xs text-subtle mb-6">{copy.steps}</h2>
          <div>
            {steps.map((step, index) => (
              <div key={index} className="grid grid-cols-[auto,1fr] gap-3 mb-6">
                <span className="w-7 h-7 rounded-full border surface-border flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
          {ukeNotes && (
            <motion.section
              className="mt-10 rounded-2xl border surface-border bg-[var(--color-surface)]/80 p-4"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: defaultEase }}
            >
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-subtle">
                <span aria-hidden className="text-base leading-none">🤝</span>
                <span>{copy.ukeNotes}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{ukeNotes}</p>
            </motion.section>
          )}
        </section>

        <section>
          <h2 className="uppercase tracking-[0.3em] text-xs text-subtle mb-6">{copy.media}</h2>
          <motion.div
            className="space-y-3"
            variants={mediaMotion.variants}
            initial="hidden"
            animate="show"
            transition={mediaMotion.transition}
          >
            {technique.media.length === 0 && <div className="text-sm text-muted">No media yet.</div>}
            {technique.media.map((item, index) => (
              <MediaEmbed key={`${item.url}-${index}`} media={item} />
            ))}
          </motion.div>
        </section>
      </main>

      {/* footer removed per UX request */}
    </div>
  );
};

// Bookmark toggle is rendered inline in the header.
