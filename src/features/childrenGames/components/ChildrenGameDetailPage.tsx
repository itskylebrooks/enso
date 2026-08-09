import type { ReactElement } from 'react';
import { ExternalLink, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGame, ChildrenGameSetting, Locale } from '@shared/types';
import { useMotionPreferences } from '@shared/components/ui/motion';
import {
  formatChildrenGameParticipants,
  getChildrenGameMaterialLabel,
  getChildrenGameSettingLabel,
} from '../labels';

type ChildrenGameDetailPageProps = {
  game: ChildrenGame;
  copy: Copy;
  locale: Locale;
  onBack: () => void;
};

const settings: ChildrenGameSetting[] = ['indoor', 'outdoor', 'evening'];

const BulletList = ({ items }: { items: string[] }): ReactElement => (
  <ul className="space-y-2 text-base leading-relaxed text-muted">
    {items.map((item, index) => (
      <li key={`${index}-${item}`} className="flex gap-2">
        <span className="shrink-0 text-subtle" aria-hidden>
          •
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const ChildrenGameDetailPage = ({
  game,
  copy,
  locale,
  onBack,
}: ChildrenGameDetailPageProps): ReactElement => {
  const { pageMotion } = useMotionPreferences();
  const name = game.name[locale] || game.name.de;
  const goal = game.goal[locale] || game.goal.de;
  const rules = game.rules[locale] || game.rules.de;
  const sequence = game.sequence[locale] || game.sequence.de;
  const activeSettings = settings.filter((setting) => game.settings[setting]);
  const accessedAt = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${game.source.accessedAt}T00:00:00Z`));

  return (
    <motion.main
      className="mx-auto max-w-4xl space-y-6 px-4 pb-6 pt-0 sm:px-6"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      <header className="space-y-4 border-b surface-border pb-4">
        <a
          href="/teach/children-games"
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
          className="flex items-center gap-2 text-sm text-subtle transition hover:text-[var(--color-text)]"
        >
          <span aria-hidden>←</span>
          <span>{copy.childrenGames.backToGames}</span>
        </a>
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold leading-tight">{name}</h1>
            <span className="glossary-tag inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1.5 text-sm font-medium text-subtle dark:bg-white/10">
              <Users className="h-4 w-4" aria-hidden />
              {formatChildrenGameParticipants(game.participants.min, game.participants.max, copy)}
            </span>
          </div>
          <p className="text-base leading-relaxed text-muted">{goal}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.22em] text-subtle">
              {copy.childrenGames.rules}
            </h2>
            <BulletList items={rules} />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.22em] text-subtle">
              {copy.childrenGames.sequence}
            </h2>
            <BulletList items={sequence} />
          </section>
        </div>

        <aside className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.22em] text-subtle">
              {copy.childrenGames.materials}
            </h2>
            <div className="flex flex-wrap gap-2">
              {game.materials.map((material) => (
                <span
                  key={material}
                  className="glossary-tag rounded-lg bg-black/5 px-2 py-1 text-xs uppercase tracking-wide text-subtle dark:bg-white/10"
                >
                  {getChildrenGameMaterialLabel(material, copy)}
                </span>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.22em] text-subtle">
              {copy.childrenGames.settings}
            </h2>
            <div className="flex flex-wrap gap-2">
              {activeSettings.map((setting) => (
                <span
                  key={setting}
                  className="glossary-tag rounded-lg border surface-border px-2 py-1 text-xs uppercase tracking-wide text-subtle"
                >
                  {getChildrenGameSettingLabel(setting, copy)}
                </span>
              ))}
            </div>
          </section>
          <section className="space-y-2 border-t surface-border pt-4 text-sm text-subtle">
            <p>{copy.childrenGames.sourceNote}</p>
            <a
              href={game.source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              {game.source.name}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <p>{copy.childrenGames.sourceAccessed.replace('{date}', accessedAt)}</p>
          </section>
        </aside>
      </div>
    </motion.main>
  );
};
