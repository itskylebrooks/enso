import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import type { Grade, Locale } from '../../types';
import { gradeOrder } from '../../utils/grades';
import { gradeLabel, gradePalette } from '../../styles/belts';
import { useMotionPreferences, defaultEase } from '../ui/motion';

type BasicsPageProps = {
  locale: Locale;
};

type TermEntry = {
  term: string;
  detail: string;
};

type BasicsContent = {
  headings: {
    naming: string;
    terms: string;
    belts: string;
    etiquette: string;
  };
  namingLead: string;
  namingPoints: string[];
  terms: TermEntry[];
  termsLead: string;
  beltsLead: string;
  beltNames: Record<Grade, string>;
  etiquettePoints: string[];
};

const content: Record<Locale, BasicsContent> = {
  en: {
    headings: {
      naming: 'Naming system',
      terms: 'Common Japanese terms',
      belts: 'Belt grades & colors',
      etiquette: 'Dojo etiquette & safety notes',
    },
    namingLead: 'Technique names combine the attack from uke, your response, and any direction or variation.',
    namingPoints: [
      'Attack — the initial grab or strike from uke (e.g., “katate-dori”, “shōmen-uchi”).',
      'Technique — the core response from tori (e.g., “ikkyo”, “irimi-nage”).',
      'Direction or variation — clarifies the entry or path (e.g., “omote”, “ura”, “uchi”, “soto”).',
    ],
    terms: [
      { term: 'omote', detail: 'front entry; tori advances past uke’s front edge.' },
      { term: 'ura', detail: 'rear entry; tori turns behind uke’s line.' },
      { term: 'irimi', detail: 'entering step that closes distance decisively.' },
      { term: 'tenkan', detail: 'pivoting turn that leads uke past your center.' },
      { term: 'ukemi', detail: 'receiving the technique safely through rolling or falling.' },
      { term: 'ma-ai', detail: 'dynamic distance and timing between partners.' },
      { term: 'kamae', detail: 'ready posture or stance that keeps balance and intent.' },
    ],
    termsLead: 'These vocabulary pieces appear across the curriculum. Learn them early to follow instructions smoothly.',
    beltsLead: 'Gradings follow the kyū → dan structure. Colors vary by dojo; this sequence is a common reference:',
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
    etiquettePoints: [
      'Bow when stepping on or off the mat; acknowledge your partner before and after training.',
      'Keep nails trimmed, remove jewelry, and secure long hair for safety.',
      'Communicate early about injuries or limits; tap clearly if a lock or pin is uncomfortable.',
      'Maintain awareness of nearby pairs and keep a safe mat space when throwing.',
    ],
  },
  de: {
    headings: {
      naming: 'Benennungssystem',
      terms: 'Häufige japanische Begriffe',
      belts: 'Gürtelgrade & Farben',
      etiquette: 'Dōjō-Etikette & Sicherheitshinweise',
    },
    namingLead: 'Techniknamen kombinieren den Angriff des Uke, deine Antwort und eine mögliche Richtung oder Variation.',
    namingPoints: [
      'Angriff – der erste Griff oder Schlag von Uke (z. B. „katate-dori“, „shōmen-uchi“).',
      'Technik – die zentrale Antwort von Tori (z. B. „ikkyo“, „irimi-nage“).',
      'Richtung oder Variation – präzisiert den Einstieg oder die Linie (z. B. „omote“, „ura“, „uchi“, „soto“).',
    ],
    terms: [
      { term: 'omote', detail: 'vorderer Einstieg; Tori geht vor Uke vorbei.' },
      { term: 'ura', detail: 'hinterer Einstieg; Tori dreht sich hinter Ukes Linie.' },
      { term: 'irimi', detail: 'Eintreten, das die Distanz entschlossen schließt.' },
      { term: 'tenkan', detail: 'Drehung, die Uke an deinem Zentrum vorbeileitet.' },
      { term: 'ukemi', detail: 'das sichere Aufnehmen einer Technik durch Rollen oder Fallen.' },
      { term: 'ma-ai', detail: 'dynamische Distanz und das Timing zwischen den Partnern.' },
      { term: 'kamae', detail: 'bereitstehende Haltung, die Balance und Intention bewahrt.' },
    ],
    termsLead: 'Diese Vokabeln tauchen im gesamten Curriculum auf. Lerne sie früh, um Anweisungen flüssig zu folgen.',
    beltsLead: 'Graduierungen folgen der Reihenfolge Kyū → Dan. Farben variieren je nach Dōjō; diese Abfolge dient als Orientierung:',
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
    etiquettePoints: [
      'Verbeuge dich beim Betreten und Verlassen der Matte; grüße deinen Partner vor und nach dem Üben.',
      'Halte Nägel kurz, lege Schmuck ab und binde lange Haare zusammen.',
      'Sprich Verletzungen oder Grenzen früh an; klopfe deutlich ab, wenn ein Hebel oder Haltegriff unangenehm wird.',
      'Achte auf umliegende Paare und halte beim Werfen genügend Sicherheitsabstand.',
    ],
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export const BasicsPage = ({ locale }: BasicsPageProps): ReactElement => {
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
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight">{copy.headings.naming}</h1>
            <p className="text-sm text-subtle leading-relaxed">{copy.namingLead}</p>
          </header>
          <ul className="space-y-3 text-sm leading-relaxed">
            {copy.namingPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="mt-1 text-base">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.terms}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.termsLead}</p>
          </header>
          <dl className="space-y-3">
            {copy.terms.map(({ term, detail }) => (
              <div key={term} className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3">
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">{term}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{detail}</dd>
              </div>
            ))}
          </dl>
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.belts}</h2>
            <p className="text-sm text-subtle leading-relaxed">{copy.beltsLead}</p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gradeOrder.map((grade) => {
              const palette = gradePalette[grade];
              return (
                <li key={grade} className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3">
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

        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{copy.headings.etiquette}</h2>
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
