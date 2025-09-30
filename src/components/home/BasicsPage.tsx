import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import type { Grade, Locale } from '../../shared/types';
import { gradeOrder } from '../../shared/utils/grades';
import { gradeLabel, gradePalette } from '../../shared/styles/belts';
import { useMotionPreferences, defaultEase } from '../ui/motion';

type BasicsPageProps = {
  locale: Locale;
  onNavigateToGlossaryWithMovementFilter: () => void;
};

type TermEntry = {
  term: string;
  detail: string;
};

type BasicsContent = {
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
  beltNote: string;
  beltNames: Record<Grade, string>;

  etiquetteLead: string;
  etiquettePoints: string[];
};

const content: Record<Locale, BasicsContent> = {
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
      { term: 'kamae (hanmi)', detail: 'ready posture: relaxed shoulders, soft knees, centered' },
      { term: 'irimi', detail: 'decisive entering step that closes distance' },
      { term: 'tenkan', detail: 'pivot/turn that leads uke past your center' },
      { term: 'ukemi', detail: 'safe falling/rolling; protect neck, move with the throw' },
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
    beltNote:
      'Note: our club (WSV Walddörfer Sportverein) uses this sequence. Other dojos may differ.',
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
      { term: 'kamae (hanmi)', detail: 'Bereitschaftshaltung: Schultern weich, Knie locker, Zentrum stabil' },
      { term: 'irimi', detail: 'entschlossenes Eintreten, das Distanz schließt' },
      { term: 'tenkan', detail: 'Drehung, die Uke an deinem Zentrum vorbeiführt' },
      { term: 'ukemi', detail: 'sicheres Fallen/Rollen; Nacken schützen, mit der Technik gehen' },
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
    beltNote:
      'Hinweis: In unserem Verein (WSV Walddörfer Sportverein) gilt diese Reihenfolge. Andere Dōjōs weichen ggf. ab.',
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

export const BasicsPage = ({ locale, onNavigateToGlossaryWithMovementFilter }: BasicsPageProps): ReactElement => {
  const copy = content[locale];
  const { prefersReducedMotion } = useMotionPreferences();
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
          <dl className="space-y-3">
            {copy.movementHighlights.map(({ term, detail }) => (
              <div key={term} className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3">
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">{term}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{detail}</dd>
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
                <div key={term} className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3">
                  <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">{term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed">{detail}</dd>
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
            <p className="text-xs text-subtle">{copy.beltNote}</p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gradeOrder.map((grade) => {
              const palette = gradePalette[grade];
              return (
                <li
                  key={grade}
                  className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium">{gradeLabel(grade, locale)}</span>
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: palette.bg,
                      color: palette.fg,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                    }}
                  >
                    {copy.beltNames[grade]}
                  </span>
                </li>
              );
            })}
          </ul>
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
      </div>
    </section>
  );
};
