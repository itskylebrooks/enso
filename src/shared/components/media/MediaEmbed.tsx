import type { ReactElement } from 'react';
import type { MediaItem } from '@shared/types';

type MediaEmbedProps = {
  media: MediaItem;
};

export const MediaEmbed = ({ media }: MediaEmbedProps): ReactElement => {
  if (media.type === 'youtube' || media.type === 'vimeo') {
    const title = media.type === 'youtube' ? 'YouTube' : 'Vimeo';
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border surface-border surface">
        <iframe
          className="h-full w-full"
          src={media.url}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (media.type === 'gumlet') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border surface-border surface">
        <iframe
          className="h-full w-full"
          src={media.url}
          title="Gumlet video player"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (media.type === 'image') {
    return (
      <figure className="w-full overflow-hidden rounded-xl border surface-border surface">
        <img src={media.url} alt="Reference" className="w-full object-cover" loading="lazy" />
      </figure>
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border surface-border px-3 py-2 text-sm text-[var(--color-text)] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
    >
      <span>{media.url}</span>
      <span aria-hidden>↗</span>
    </a>
  );
};
