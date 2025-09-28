import { useEffect, useRef } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique } from '../../types';
import { gradeLabel } from '../../utils/grades';
import { EmphasizedName, LevelBadge, SectionTitle } from '../common';

const noop = (): void => undefined;

type DetailDrawerProps = {
  copy: Copy;
  locale: Locale;
  technique: Technique;
  progress: Progress;
  onClose: () => void;
  onToggleFocus?: () => void;
  onToggleNotNow?: () => void;
  onToggleConfident?: () => void;
  onSetNote?: (note: string) => void;
};

export const DetailDrawer = ({
  copy,
  locale,
  technique,
  progress,
  onClose,
  onToggleFocus = noop,
  onToggleNotNow = noop,
  onToggleConfident = noop,
  onSetNote = noop,
}: DetailDrawerProps): JSX.Element => {
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-30 bg-black/30 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="surface w-full md:w-[760px] max-h-[90vh] rounded-t-2xl md:rounded-2xl border surface-border shadow-lg overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b surface-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-lg truncate" title={technique.name[locale]}>
              <EmphasizedName name={technique.name[locale]} />
            </div>
            <div className="text-xs text-subtle truncate">{technique.jp}</div>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge locale={locale} level={technique.level} />
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded-lg border btn-tonal surface-hover"
            >
              Close
            </button>
          </div>
        </div>
        <div className="p-4 grid md:grid-cols-2 gap-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <SectionTitle>{copy.status}</SectionTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={Boolean(progress.focus)} onChange={onToggleFocus} /> {copy.focus}
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={Boolean(progress.notNow)} onChange={onToggleNotNow} /> {copy.notNow}
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={Boolean(progress.confident)} onChange={onToggleConfident} /> {copy.confident}
                </label>
              </div>
            </div>
            <div>
              <SectionTitle>{copy.steps}</SectionTitle>
              <ol className="list-decimal pl-4 mt-2 space-y-1 text-sm">
                {technique.steps[locale].map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <SectionTitle>{copy.note}</SectionTitle>
              <textarea
                id="enso-note"
                ref={noteRef}
                value={progress.personalNote ?? ''}
                onChange={(event) => onSetNote(event.target.value)}
                placeholder={
                  locale === 'en'
                    ? 'Timing of entry feels off…'
                    : 'Einstieg fühlt sich noch unsicher an…'
                }
                className="w-full mt-2 px-3 py-2 rounded-xl border surface surface-border focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] text-sm"
                rows={4}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <SectionTitle>{copy.media}</SectionTitle>
              <div className="mt-2 space-y-2">
                {technique.media.length === 0 && (
                  <div className="text-sm text-muted">No media yet.</div>
                )}
                {technique.media.map((media, index) => (
                  <MediaEmbed key={index} media={media} />
                ))}
              </div>
            </div>
            <div>
              <SectionTitle>Meta</SectionTitle>
              <div className="mt-2 text-sm text-muted space-y-1">
                {technique.category && (
                  <div>
                    <strong>Category:</strong> {technique.category}
                  </div>
                )}
                {technique.attack && (
                  <div>
                    <strong>Attack:</strong> {technique.attack}
                  </div>
                )}
                {technique.stance && (
                  <div>
                    <strong>Stance:</strong> {technique.stance}
                  </div>
                )}
                {technique.weapon && (
                  <div>
                    <strong>Weapon:</strong> {technique.weapon}
                  </div>
                )}
                <div>
                  <strong>Level:</strong> {gradeLabel(technique.level, locale)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t surface-border text-xs text-muted flex items-center justify-between">
          <div>
            {copy.lastPracticed}: {new Date(progress.updatedAt).toLocaleString()}
          </div>
          <div>Keys: ⌘K or / to search</div>
        </div>
      </div>
    </div>
  );
};

type MediaEmbedProps = {
  media: Technique['media'][number];
};

const MediaEmbed = ({ media }: MediaEmbedProps): JSX.Element => {
  if (media.type === 'youtube') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border surface-border surface">
        <iframe
          className="w-full h-full"
          src={media.url}
          title={media.title ?? 'YouTube'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt={media.title ?? 'Image'}
        className="w-full rounded-xl border surface-border"
      />
    );
  }

  return (
    <a href={media.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
      {media.title ?? media.url}
    </a>
  );
};
