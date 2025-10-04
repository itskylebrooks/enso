import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import type { Collection, EntryMode, Grade, Locale } from '@shared/types';
import { gradeOrder } from '@shared/utils/grades';
import { gradeLabel, getGradeStyle } from '@shared/styles/belts';
import { useMotionPreferences, defaultEase } from '@shared/components/ui/motion';
import { getInitialThemeState } from '@shared/utils/theme';
import { getCopy } from '@shared/constants/i18n';
import { ExamMatrix } from '../guide/ExamMatrix';
import { SayaNoUchiMatrix } from '../guide/SayaNoUchiMatrix';
import { JoMatrix } from '../guide/JoMatrix';
import { TantoMatrix } from '../guide/TantoMatrix';

type GuidePageProps = {
  locale: Locale;
  collections: Collection[];
  onNavigateToGlossaryWithMovementFilter: () => void;
  onCreateCollectionWithGrade: (name: string, grade: Grade) => string | null;
  onNavigateToBookmarks: (collectionId: string) => void;
  onOpenTechnique: (slug: string, trainerId?: string, entry?: EntryMode, skipExistenceCheck?: boolean) => void;
};

type TermEntry = {
  term: string;
  detail: string;
};

type GuideContent = {
  headings: {
    movements: string;
    philosophy: string;
    belts: string;
    etiquette: string;
  };

  movementsLead: string;
  movementHighlights: TermEntry[];
  movementsCtaLabel: string;

  philosophyLead: string;
  philosophyPoints: string[];
  virtuesTitle: string;
  virtues: TermEntry[];

  beltsLead: string;
  beltNames: Record<Grade, string>;

  etiquetteLead: string;
  etiquettePoints: string[];
};

const content: Record<Locale, GuideContent> = {
  en: {
    headings: {
      movements: 'Basic movements & stances',
      philosophy: 'Aikidō principles & virtues',
      belts: 'Belt grades & colors',
      etiquette: 'Dōjō etiquette & safety',
    },

    movementsLead:
      'These are the movement tools you will use constantly. Practice them slowly, then smoothly.',
    movementHighlights: [
      { term: 'Kamae (hanmi)', detail: 'ready posture: relaxed shoulders, soft knees, centered' },
      { term: 'Irimi', detail: 'decisive entering step that closes distance' },
      { term: 'Tenkan', detail: 'pivot/turn that leads uke past your center' },
      { term: 'Ukemi', detail: 'safe falling/rolling; protect neck, move with the throw' },
    ],
    movementsCtaLabel: 'See all movement terms',

    philosophyLead:
      'Aikidō favors blending over collision. You cultivate center, timing, and compassion while maintaining effectiveness.',
    philosophyPoints: [
      'Blend with the line of force—move the person by moving their balance.',
      'Maintain center (hara) and upright spine; power radiates from good posture.',
      'Create kuzushi (unbalance) rather than using muscle.',
      'Triangle–Circle–Square: establish stance, move in circles, finish with stable control.',
      'Zanshin: remain aware before, during, and after technique.',
    ],
    virtuesTitle: 'Seven virtues (bushidō)',
    virtues: [
      { term: 'Gi (義)', detail: 'rectitude / righteousness' },
      { term: 'Rei (礼)', detail: 'respect / courtesy' },
      { term: 'Yū (勇)', detail: 'courage' },
      { term: 'Meiyo (名誉)', detail: 'honor' },
      { term: 'Jin (仁)', detail: 'benevolence / compassion' },
      { term: 'Makoto (誠)', detail: 'truthfulness / sincerity' },
      { term: 'Chū (忠)', detail: 'loyalty' },
    ],

    beltsLead:
      'Gradings follow the kyū → dan structure. Colors vary by school; the list below is a common reference.',
    beltNames: {
      kyu5: 'Yellow',
      kyu4: 'Orange',
      kyu3: 'Green',
      kyu2: 'Blue',
      kyu1: 'Brown',
      dan1: 'Black',
      dan2: 'Black',
      dan3: 'Black',
      dan4: 'Black',
      dan5: 'Black',
    },

    etiquetteLead:
      'Etiquette keeps everyone safe and training pleasant. The following points reflect common dōjō practice.',
    etiquettePoints: [
      // Dōjōkun-inspired
      'Bow when entering/leaving the mat; greet your partner before and after training.',
      'Be punctual; keep the training area in order and clean.',
      'Respect teachers and students; each partner is the best teacher of the moment.',
      'Be honest, polite, and modest; stay open-minded toward the taught forms.',
      'Train with concentration and discipline; develop body and mind—avoid idle talk.',
      'Always create space for ukemi when projecting; mind surrounding pairs.',
      // Safety
      'Trim nails, remove jewelry, and tie back long hair.',
      'Communicate about injuries or limits before practice; tap early and clearly.',
    ],
  },

  de: {
    headings: {
      movements: 'Grundbewegungen & Stände',
      philosophy: 'Aikidō‑Prinzipien & Tugenden',
      belts: 'Gürtelgrade & Farben',
      etiquette: 'Dōjō‑Etikette & Sicherheit',
    },

    movementsLead:
      'Diese Bewegungen nutzt du ständig. Übe sie ruhig und präzise, dann fließend.',
    movementHighlights: [
      { term: 'Kamae (hanmi)', detail: 'Bereitschaftshaltung: Schultern weich, Knie locker, Zentrum stabil' },
      { term: 'Irimi', detail: 'entschlossenes Eintreten, das Distanz schließt' },
      { term: 'Tenkan', detail: 'Drehung, die Uke an deinem Zentrum vorbeiführt' },
      { term: 'Ukemi', detail: 'sicheres Fallen/Rollen; Nacken schützen, mit der Technik gehen' },
    ],
    movementsCtaLabel: 'Alle Bewegungen im Glossar',

    philosophyLead:
      'Aikidō bevorzugt das Führen statt das Kollisionen. Entwickle Zentrum, Timing und Mitgefühl – bei voller Wirksamkeit.',
    philosophyPoints: [
      'Mit der Kraftlinie verbinden – das Gleichgewicht bewegen statt zu kämpfen.',
      'Zentrum (hara) und aufrechte Wirbelsäule halten; Kraft entsteht aus guter Haltung.',
      'Kuzushi: Gleichgewicht brechen statt Muskelkraft einsetzen.',
      'Dreieck–Kreis–Quadrat: Stand finden, kreisförmig führen, stabil abschließen.',
      'Zanshin: vor, während und nach der Technik aufmerksam bleiben.',
    ],
    virtuesTitle: 'Die sieben Tugenden (Bushidō)',
    virtues: [
      { term: 'Gi (義)', detail: 'Aufrichtigkeit, Rechtschaffenheit' },
      { term: 'Rei (礼)', detail: 'Höflichkeit, Respekt' },
      { term: 'Yū (勇)', detail: 'Mut' },
      { term: 'Meiyo (名誉)', detail: 'Ehre' },
      { term: 'Jin (仁)', detail: 'Mitgefühl, Menschlichkeit' },
      { term: 'Makoto (誠)', detail: 'Wahrhaftigkeit, Aufrichtigkeit' },
      { term: 'Chū (忠)', detail: 'Loyalität' },
    ],

    beltsLead:
      'Graduierungen folgen der Reihenfolge Kyū → Dan. Die Farben unterscheiden sich je nach Schule.',
    beltNames: {
      kyu5: 'Gelb',
      kyu4: 'Orange',
      kyu3: 'Grün',
      kyu2: 'Blau',
      kyu1: 'Braun',
      dan1: 'Schwarz',
      dan2: 'Schwarz',
      dan3: 'Schwarz',
      dan4: 'Schwarz',
      dan5: 'Schwarz',
    },

    etiquetteLead:
      'Etikette schafft Sicherheit und eine gute Trainingsatmosphäre. Die folgenden Punkte sind weit verbreitet.',
    etiquettePoints: [
      'Beim Betreten/Verlassen der Matte verbeugen; den Partner vor und nach dem Üben grüßen.',
      'Pünktlich erscheinen; Ordnung und Sauberkeit wahren.',
      'Meister und Schüler achten; jeder Partner ist gerade „der Beste“ für dich.',
      'Ehrlich, höflich, bescheiden üben; den gelehrten Formen unvoreingenommen begegnen.',
      'Konzentriert und diszipliniert trainieren; Körper und Geist bilden – nicht den Mund.',
      'Beim Werfen stets Raum für Ukemi schaffen; auf umliegende Paare achten.',
      'Nägel kurz halten, Schmuck ablegen, lange Haare binden.',
      'Verletzungen/ Grenzen vorher mitteilen; früh und deutlich abklopfen.',
    ],
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export const GuidePage = ({ 
  locale, 
  collections,
  onNavigateToGlossaryWithMovementFilter,
  onCreateCollectionWithGrade,
  onNavigateToBookmarks,
  onOpenTechnique,
}: GuidePageProps): ReactElement => {
  const copy = content[locale];
  const i18nCopy = getCopy(locale);
  const { prefersReducedMotion } = useMotionPreferences();
  const [isDark, setIsDark] = useState(getInitialThemeState);

  // Adaptive colors for highlighted external links (bg + text)
  const externalColors = {
    dab: {
      light: { bg: 'rgba(249, 220, 4, 0.12)', fg: '#1f1f1f' }, // #f9dc04
      dark: { bg: 'rgba(249, 220, 4, 0.16)', fg: '#f9dc04' },
    },
    wsv: {
      light: { bg: 'rgba(2, 130, 53, 0.12)', fg: '#042d14' }, // #028235
      dark: { bg: 'rgba(2, 130, 53, 0.2)', fg: '#bff7d1' },
    },
    bsv: {
      light: { bg: 'rgba(178, 1, 0, 0.12)', fg: '#3b0000' }, // #b20100
      dark: { bg: 'rgba(178, 1, 0, 0.18)', fg: '#ffd6d6' },
    },
  } as const;

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const html = document.documentElement;
      setIsDark(html.classList.contains('dark'));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleBeltClick = (grade: Grade) => {
    const label = gradeLabel(grade, locale);
    const collectionName = locale === 'en' 
      ? `Exam Program – ${label}`
      : `Prüfungsprogramm – ${label}`;

    // Check if collection already exists
    const existingCollection = collections.find(
      (c) => c.name.toLowerCase() === collectionName.toLowerCase()
    );

    if (existingCollection) {
      // Navigate to existing collection
      onNavigateToBookmarks(existingCollection.id);
    } else {
      // Create new collection with all techniques of this grade and navigate to it
      const newCollectionId = onCreateCollectionWithGrade(collectionName, grade);
      if (newCollectionId) {
        onNavigateToBookmarks(newCollectionId);
      }
    }
  };
  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: sectionVariants,
        transition: { duration: 0.24, ease: defaultEase },
      };

  return (
    <section className="py-12 px-5 md:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Movements & Stances */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.movements}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.movementsLead}</p>
          </header>
          <dl className="flex flex-col gap-3">
            {copy.movementHighlights.map(({ term, detail }) => (
              <div key={term} className="flex flex-col">
                <dt className="text-neutral-100 font-semibold text-base leading-tight">{term}</dt>
                <dd className="text-neutral-400 text-sm mt-1 leading-relaxed">{detail}</dd>
              </div>
            ))}
          </dl>
          <div>
            <button
              type="button"
              onClick={onNavigateToGlossaryWithMovementFilter}
              className="inline-flex items-center rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.movementsCtaLabel} →
            </button>
          </div>
        </motion.article>

        {/* Philosophy */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.philosophy}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.philosophyLead}</p>
          </header>
          <ul className="space-y-3 text-sm leading-relaxed">
            {copy.philosophyPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="mt-1 text-base">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-subtle">{copy.virtuesTitle}</h3>
            <dl className="space-y-3">
                {copy.virtues.map(({ term, detail }) => (
                  <div key={term} className="flex flex-col">
                    <dt className="text-neutral-100 font-semibold text-base leading-tight">{term}</dt>
                    <dd className="text-neutral-400 text-sm mt-1 leading-relaxed">{detail}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </motion.article>

        {/* Belts */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.belts}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.beltsLead}</p>
            <p className="text-sm bg-[var(--color-surface)] border surface-border rounded-lg px-4 py-3 leading-relaxed text-center">
              {i18nCopy.beltExamProgramNote}
            </p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gradeOrder.map((grade) => {
              const style = getGradeStyle(grade, isDark);
              const borderColor = style.color === '#FFFFFF' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';
              return (
                <li key={grade}>
                  <button
                    type="button"
                    onClick={() => handleBeltClick(grade)}
                    className="w-full rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    <span className="text-sm font-medium">{gradeLabel(grade, locale)}</span>
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        boxShadow: `inset 0 0 0 1px ${borderColor}`,
                      }}
                    >
                      {copy.beltNames[grade]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.article>

        {/* Exam Program Matrix */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.examMatrixTitle}</h2>
          </header>
          <ExamMatrix
            locale={locale}
            copy={i18nCopy}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              // Create combined technique slug: e.g., "katate-dori-ude-osae-ikkyo-omote"
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        {/* Saya no Uchi Program */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.sayaNoUchiTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.sayaNoUchiLead}</p>
          </header>
          <SayaNoUchiMatrix
            locale={locale}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              // Create combined technique slug, removing ai_hanmi, gyaku_hanmi, and hanmi_hantachi
              // e.g., "katate_dori_ai_hanmi" -> "katate-dori"
              let attackSlug = attackKey
                .replace(/_ai_hanmi$/, '')
                .replace(/_gyaku_hanmi$/, '')
                .replace(/^hanmi_hantachi_/, '')
                .replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        {/* Jō Techniques Program */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.joTechniquesTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.joTechniquesLead}</p>
          </header>
          <JoMatrix
            locale={locale}
            isDark={isDark}
            copy={i18nCopy}
            onCellClick={(slug, attackKey) => {
              // Create combined technique slug for jō techniques
              // e.g., "jo_tsuki" -> "jo-tsuki"
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        {/* Tantō Techniques Program */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.tantoTechniquesTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.tantoTechniquesLead}</p>
          </header>
          <TantoMatrix
            locale={locale}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              // Create combined technique slug for tantō techniques
              // e.g., "tanto_tsuki" -> "tanto-tsuki"
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        {/* Etiquette */}
        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.etiquette}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.etiquetteLead}</p>
          </header>
          <ul className="space-y-3 text-sm leading-relaxed">
            {copy.etiquettePoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="mt-1 text-base">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.article>
        {/* Further Study / Weiterführende Ressourcen */}
        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{locale === 'de' ? 'Weiterführende Ressourcen' : 'Further Study'}</h2>
          </header>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.aikido-bund.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive"
              style={{
                '--pill-bg': isDark ? externalColors.dab.dark.bg : externalColors.dab.light.bg,
                '--pill-bg-hover': isDark ? 'rgba(249, 220, 4, 0.22)' : 'rgba(249, 220, 4, 0.18)',
                color: isDark ? externalColors.dab.dark.fg : externalColors.dab.light.fg,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
              } as any}
              aria-label="Deutscher Aikido-Bund (opens in new tab)"
            >
              Deutscher Aikido-Bund
            </a>

            <a
              href="https://www.aikido-hamburg.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text)' }}
              aria-label="AV Hamburg (opens in new tab)"
            >
              AV Hamburg
            </a>

            <a
              href="https://www.aikido-bayern.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text)' }}
              aria-label="AV Bayern (opens in new tab)"
            >
              AV Bayern
            </a>

            <a
              href="https://www.aikidoverein-wattenbek.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text)' }}
              aria-label="AV Wattenbeck (opens in new tab)"
            >
              AV Wattenbeck
            </a>

            <a
              href="https://theaikidowarrior.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text)' }}
              aria-label="Aikido Warrior Dojo (opens in new tab)"
            >
              Aikido Warrior Dojo
            </a>
            <a
              href="https://walddoerfer-sv.de/sportangebot/aikido/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive"
              style={{
                '--pill-bg': isDark ? externalColors.wsv.dark.bg : externalColors.wsv.light.bg,
                '--pill-bg-hover': isDark ? 'rgba(2, 130, 53, 0.28)' : 'rgba(2, 130, 53, 0.18)',
                color: isDark ? externalColors.wsv.dark.fg : externalColors.wsv.light.fg,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
              } as any}
              aria-label="Walddörfer SV (opens in new tab)"
            >
              WSV
            </a>

            <a
              href="https://www.aikido-bsv.de/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive"
              style={{
                '--pill-bg': isDark ? externalColors.bsv.dark.bg : externalColors.bsv.light.bg,
                '--pill-bg-hover': isDark ? 'rgba(178, 1, 0, 0.28)' : 'rgba(178, 1, 0, 0.18)',
                color: isDark ? externalColors.bsv.dark.fg : externalColors.bsv.light.fg,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
              } as any}
              aria-label="Aikido BSV (opens in new tab)"
            >
              BSV
            </a>
          </div>
        </motion.article>
      </div>
    </section>
  );
};
