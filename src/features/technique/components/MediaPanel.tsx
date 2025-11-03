import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { MediaItem } from '@shared/types';
import { MediaEmbed } from '@shared/components/media/MediaEmbed';
import { useMotionPreferences } from '@shared/components/ui/motion';

export type MediaPanelProps = {
  media?: MediaItem[] | null;
  copy: Copy;
  locale?: 'en' | 'de';
};

export const MediaPanel = ({ media, copy, locale = 'en' }: MediaPanelProps): ReactElement => {
  const { mediaMotion } = useMotionPreferences();

  return (
    <section className="space-y-4">
      <header className="text-xs uppercase tracking-[0.3em] text-subtle">{copy.media}</header>
      <motion.div
        className="space-y-3"
        variants={mediaMotion.variants}
        initial="hidden"
        animate="show"
        transition={mediaMotion.transition}
      >
        {(!media || media.length === 0) && (
          <p className="text-sm text-muted leading-relaxed">{copy.mediaEmpty}</p>
        )}
        {(media || []).map((item, index) => (
          <MediaEmbed key={`${item.url}-${index}`} media={item} locale={locale} />
        ))}
      </motion.div>
    </section>
  );
};
