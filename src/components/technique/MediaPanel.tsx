import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { TechniqueVersion } from '../../types';
import { MediaEmbed } from '../media/MediaEmbed';
import { useMotionPreferences } from '../ui/motion';

export type MediaPanelProps = {
  media: TechniqueVersion['media'];
  copy: Copy;
};

export const MediaPanel = ({ media, copy }: MediaPanelProps): ReactElement => {
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
        {media.length === 0 && (
          <p className="text-sm text-muted leading-relaxed">{copy.mediaEmpty}</p>
        )}
        {media.map((item, index) => (
          <MediaEmbed key={`${item.url}-${index}`} media={item} />
        ))}
      </motion.div>
    </section>
  );
};
