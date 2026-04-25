import type { ReactElement } from 'react';
import type { MediaItem, Locale } from '@shared/types';
import { getCopy } from '@shared/constants/i18n';

type MediaEmbedProps = {
  media: MediaItem;
  locale?: Locale;
};

const buildYouTubeEmbedUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('iv_load_policy', '3');
    return url.toString();
  } catch {
    return rawUrl;
  }
};

export const MediaEmbed = ({ media, locale = 'en' }: MediaEmbedProps): ReactElement => {
  const copy = getCopy(locale);
  if (media.type === 'youtube') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border surface-border surface">
        <iframe
          className="block h-full w-full"
          src={buildYouTubeEmbedUrl(media.url)}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
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

  if (media.type === 'gumlet-dab') {
    return (
      <div className="space-y-2">
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
        <p className="text-xs text-subtle text-center">
          {copy.mediaDabAttribution}
          <a
            href="https://creativecommons.org/licenses/by/3.0/de/"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2 hover:text-[var(--color-text)]"
          >
            {copy.mediaDabLicense}
          </a>
        </p>
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
