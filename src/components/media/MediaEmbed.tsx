import type { ReactElement } from 'react';
import type { Technique } from '../../types';

type MediaEmbedProps = {
  media: Technique['media'][number];
};

export const MediaEmbed = ({ media }: MediaEmbedProps): ReactElement => {
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
        className="w-full rounded-xl border surface-border object-cover"
      />
    );
  }

  return (
    <a href={media.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
      {media.title ?? media.url}
    </a>
  );
};
