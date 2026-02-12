import { useMemo, type ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { GlossaryTerm, Grade, Locale, Technique } from '@shared/types';
import { gradeLabel } from '@shared/utils/grades';
import { beltRequirements, pickLocalized } from './beltRequirements';
import { getCategoryLabel, getCategoryStyle } from '@shared/styles/terms';
import { getGradeStyle } from '@shared/styles/belts';

type GuideGradePageProps = {
  copy: Copy;
  locale: Locale;
  grade: Grade;
  techniques: Technique[];
  glossaryTerms: GlossaryTerm[];
  onBack: () => void;
  backLabel?: string;
  pinnedBeltGrade: Grade | null;
  onTogglePin: (grade: Grade) => void;
  onOpenTechnique: (slug: string) => void;
  onOpenTerm: (slug: string) => void;
};

export const GuideGradePage = ({
  copy,
  locale,
  grade,
  techniques,
  glossaryTerms,
  onBack,
  backLabel,
  pinnedBeltGrade,
  onTogglePin,
  onOpenTechnique,
  onOpenTerm,
}: GuideGradePageProps): ReactElement => {
  const isPinned = pinnedBeltGrade === grade;
  const pinLabel = isPinned ? copy.homeUnpinFromHome : copy.homePinToHome;
  const requirement = beltRequirements[grade];
  const beltStyle = getGradeStyle(grade);

  const requiredTechniques = useMemo(
    () =>
      techniques
        .filter((technique) => technique.level === grade)
        .sort((a, b) =>
          (a.name[locale] || a.name.en).localeCompare(b.name[locale] || b.name.en, locale, {
            sensitivity: 'accent',
            caseFirst: 'lower',
          }),
        ),
    [grade, locale, techniques],
  );

  const requiredTerms = useMemo(
    () =>
      requirement.termSlugs
        .map((slug) => glossaryTerms.find((term) => term.slug === slug))
        .filter((term): term is GlossaryTerm => Boolean(term)),
    [glossaryTerms, requirement.termSlugs],
  );

  const techniquesTitle = locale === 'de' ? 'Techniken' : 'Techniques';
  const techniquesLead =
    locale === 'de'
      ? 'Techniken, die du fuer diese Pruefungsstufe sicher zeigen solltest.'
      : 'Techniques you should demonstrate confidently for this exam level.';
  const termsTitle = locale === 'de' ? 'Noetige Begriffe' : 'Required Terms';
  const termsLead =
    locale === 'de'
      ? 'Wichtige Begriffe, die fuer diese Pruefung erwartet werden.'
      : 'Key terms expected as part of this exam.';
  const basicsTitle = locale === 'de' ? 'Basics, Etikette & Sicherheit' : 'Basics, Etiquette & Safety';
  const examTitle = locale === 'de' ? 'Pruefungsbeschreibung' : 'Exam Description';
  const focusTitle = locale === 'de' ? 'Pruefungsfokus' : 'Exam Focus';
  const emptyTechniques =
    locale === 'de'
      ? 'Fuer diesen Grad sind noch keine Techniken hinterlegt.'
      : 'No techniques are mapped for this grade yet.';
  const emptyTerms =
    locale === 'de'
      ? 'Fuer diesen Grad sind noch keine Begriffe hinterlegt.'
      : 'No terms are mapped for this grade yet.';

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
        >
          <span aria-hidden>←</span>
          <span>{backLabel ?? copy.backToGuide}</span>
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(grade)}
          className="inline-flex items-center justify-center rounded-lg border btn-tonal surface-hover px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {pinLabel}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border border-transparent"
            style={{
              backgroundColor: beltStyle.backgroundColor,
              color: beltStyle.color,
              borderColor: beltStyle.borderColor,
            }}
          >
            {gradeLabel(grade, locale)}
          </span>
        </div>
        <h1 className="text-2xl font-semibold">{examTitle}</h1>
        <p className="text-base text-muted leading-relaxed">
          {pickLocalized(requirement.examDescription, locale)}
        </p>
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">{techniquesTitle}</h2>
          <p className="text-sm text-subtle">{techniquesLead}</p>
        </header>
        {requiredTechniques.length === 0 ? (
          <p className="text-sm text-subtle">{emptyTechniques}</p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {requiredTechniques.map((technique) => (
              <li key={technique.id}>
                <button
                  type="button"
                  onClick={() => onOpenTechnique(technique.slug)}
                  className="w-full rounded-2xl border surface-border surface p-4 text-left card-hover-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] space-y-2"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold leading-tight">
                      {technique.name[locale] || technique.name.en}
                    </h3>
                    {technique.jp && <p className="text-xs text-subtle">{technique.jp}</p>}
                  </div>
                  <p className="text-sm text-muted leading-relaxed line-clamp-3">
                    {technique.summary[locale] || technique.summary.en}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">{termsTitle}</h2>
          <p className="text-sm text-subtle">{termsLead}</p>
        </header>
        {requiredTerms.length === 0 ? (
          <p className="text-sm text-subtle">{emptyTerms}</p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {requiredTerms.map((term) => {
              const categoryStyle = getCategoryStyle(term.category);
              const categoryLabel = getCategoryLabel(term.category, copy);
              return (
                <li key={term.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTerm(term.slug)}
                    className="w-full rounded-2xl border surface-border surface p-4 text-left card-hover-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base font-semibold leading-tight">{term.romaji}</h3>
                        {term.jp && <p className="text-xs text-subtle truncate">{term.jp}</p>}
                      </div>
                      <span
                        className="glossary-tag text-xs font-medium px-2 py-1 rounded-full shrink-0"
                        style={{
                          backgroundColor: categoryStyle.backgroundColor,
                          color: categoryStyle.color,
                        }}
                      >
                        {categoryLabel}
                      </span>
                    </div>
                    <p className="text-sm text-muted leading-relaxed line-clamp-3">
                      {term.def[locale] || term.def.en}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">{basicsTitle}</h2>
        </header>
        <ul className="space-y-2 text-base text-muted leading-relaxed">
          {pickLocalized(requirement.basics, locale).map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="shrink-0">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">{focusTitle}</h2>
        </header>
        <ul className="space-y-2 text-base text-muted leading-relaxed">
          {pickLocalized(requirement.examFocus, locale).map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="shrink-0">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};
