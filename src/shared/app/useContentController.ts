import { loadAllExercises } from '@features/exercises';
import { loadAllTerms } from '@features/terms';
import { getExerciseCategoryLabel } from '@shared/styles/exercises';
import type {
  AppRoute,
  DB,
  Exercise,
  Filters,
  GlossaryTerm,
  Locale,
  PracticeCategory,
} from '@shared/types';
import { getStudyStatusForItem } from '@shared/utils/studyStatus';
import { useEffect, useMemo, useState } from 'react';
import type { Copy } from '@shared/constants/i18n';
import { getCopy } from '@shared/constants/i18n';
import { applyFilters, getSelectableValues, getTrainerValues, stances } from './appModel';

type GlossaryFilters = {
  category?: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
};

type UseContentControllerParams = {
  db: DB;
  route: AppRoute;
  activeSlug: string | null;
  filters: Filters;
  locale: Locale;
  copy: Copy;
};

export const useContentController = ({
  db,
  route,
  activeSlug,
  filters,
  locale,
  copy,
}: UseContentControllerParams) => {
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [practiceExercises, setPracticeExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadAllTerms().then(setGlossaryTerms);
    loadAllExercises().then(setPracticeExercises);
  }, []);

  const categories = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.category),
    [db.techniques],
  );
  const attacks = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.attack),
    [db.techniques],
  );
  const weapons = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.weapon),
    [db.techniques],
  );
  const trainers = useMemo(() => getTrainerValues(db.techniques), [db.techniques]);

  const glossaryCategories: NonNullable<GlossaryFilters['category']>[] = useMemo(() => {
    const allCategories: NonNullable<GlossaryFilters['category']>[] = [
      'movement',
      'stance',
      'attack',
      'etiquette',
      'philosophy',
      'other',
    ];

    const localizedCopy = getCopy(locale);
    const getCategoryLabel = (category: NonNullable<GlossaryFilters['category']>): string => {
      const labels = {
        movement: localizedCopy.categoryMovement,
        stance: localizedCopy.categoryStance,
        attack: localizedCopy.categoryAttack,
        etiquette: localizedCopy.categoryEtiquette,
        philosophy: localizedCopy.categoryPhilosophy,
        other: localizedCopy.categoryOther,
      };
      return labels[category];
    };

    return allCategories.sort((a, b) =>
      getCategoryLabel(a).localeCompare(getCategoryLabel(b), locale, {
        sensitivity: 'accent',
        caseFirst: 'upper',
      }),
    );
  }, [locale]);

  const practiceCategories: PracticeCategory[] = useMemo(() => {
    const allCategories: PracticeCategory[] = [
      'mobility',
      'strength',
      'core',
      'balance',
      'coordination',
      'power',
      'recovery',
    ];

    return allCategories.sort((a, b) =>
      getExerciseCategoryLabel(a, copy).localeCompare(getExerciseCategoryLabel(b, copy), locale, {
        sensitivity: 'accent',
        caseFirst: 'upper',
      }),
    );
  }, [copy, locale]);

  const filteredTechniques = useMemo(
    () => applyFilters(db.techniques, filters),
    [db.techniques, filters],
  );

  const currentTechnique = useMemo(
    () =>
      activeSlug
        ? (db.techniques.find((technique) => technique.slug === activeSlug) ?? null)
        : null,
    [db.techniques, activeSlug],
  );

  const currentProgress = useMemo(
    () =>
      currentTechnique
        ? (db.progress.find((entry) => entry.techniqueId === currentTechnique.id) ?? null)
        : null,
    [db.progress, currentTechnique],
  );

  const currentGlossaryTerm = useMemo(
    () => (activeSlug ? (glossaryTerms.find((term) => term.slug === activeSlug) ?? null) : null),
    [glossaryTerms, activeSlug],
  );

  const currentGlossaryProgress = useMemo(() => {
    if (!activeSlug || !currentGlossaryTerm) return null;
    return db.glossaryProgress.find((entry) => entry.termId === activeSlug) ?? null;
  }, [db.glossaryProgress, activeSlug, currentGlossaryTerm]);

  const currentGlossaryStudyStatus = useMemo(
    () =>
      currentGlossaryTerm
        ? getStudyStatusForItem(db.studyStatus, 'term', currentGlossaryTerm.slug)
        : 'none',
    [currentGlossaryTerm, db.studyStatus],
  );

  const currentExerciseStudyStatus = useMemo(
    () =>
      route === 'exercises' && activeSlug
        ? getStudyStatusForItem(db.studyStatus, 'exercise', activeSlug)
        : 'none',
    [activeSlug, db.studyStatus, route],
  );

  return {
    glossaryTerms,
    practiceExercises,
    categories,
    attacks,
    stances,
    weapons,
    trainers,
    glossaryCategories,
    practiceCategories,
    filteredTechniques,
    currentTechnique,
    currentProgress,
    currentGlossaryTerm,
    currentGlossaryProgress,
    currentGlossaryStudyStatus,
    currentExerciseStudyStatus,
  };
};

export type { GlossaryFilters };
