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
  const mediaItems = media || [];
  const hasOddFinalCard = mediaItems.length % 2 === 1;

  return (
    <section>
      <motion.div
        className="grid grid-cols-1 gap-3 lg:grid-cols-4"
        variants={mediaMotion.variants}
        initial="hidden"
        animate="show"
        transition={mediaMotion.transition}
      >
        {mediaItems.length === 0 && (
          <p className="text-sm text-muted leading-relaxed">{copy.mediaEmpty}</p>
        )}
        {mediaItems.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className={`w-full lg:col-span-2 ${
              hasOddFinalCard && index === mediaItems.length - 1 ? 'lg:col-start-2' : ''
            }`}
          >
            <MediaEmbed media={item} locale={locale} />
          </div>
        ))}
      </motion.div>
    </section>
  );
};
