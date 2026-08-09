import type { KeyboardEvent, ReactElement } from 'react';
import { motion, type Transition, type Variants } from 'motion/react';
import { Users } from 'lucide-react';
import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGame, ChildrenGameSetting, Locale } from '@shared/types';
import { getChildrenGameSettingLabel } from '../labels';

type ChildrenGameCardProps = {
  game: ChildrenGame;
  copy: Copy;
  locale: Locale;
  onSelect: (slug: string) => void;
  motionIndex: number;
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

const cardSettings: ChildrenGameSetting[] = ['outdoor', 'indoor'];

export const ChildrenGameCard = ({
  game,
  copy,
  locale,
  onSelect,
  motionIndex,
  variants,
  getTransition,
}: ChildrenGameCardProps): ReactElement => {
  const name = game.name[locale] || game.name.de;
  const goal = game.goal[locale] || game.goal.de;
  const activeSettings = cardSettings.filter((setting) => game.settings[setting]);
  const handleActivate = () => onSelect(game.slug);
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
      className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow"
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      title={name}
      aria-label={`${name} – ${goal}`}
    >
      <h2 className="text-base font-semibold leading-tight">{name}</h2>

      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{goal}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {activeSettings.map((setting) => (
            <span
              key={setting}
              className="rounded-sm bg-black/5 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-subtle dark:bg-white/10"
            >
              {getChildrenGameSettingLabel(setting, copy)}
            </span>
          ))}
        </div>
        <span className="glossary-tag inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/5 px-2 py-1 text-xs font-medium text-subtle dark:bg-white/10">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {game.participants.min}–{game.participants.max}
        </span>
      </div>
    </motion.div>
  );
};
