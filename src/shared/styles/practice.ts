import type { Copy } from '../constants/i18n';
import type { PracticeCategory } from '../types';
import { getCategoryStyle } from './glossary';

type GlossaryCategory = 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';

const PRACTICE_CATEGORY_STYLES: Record<PracticeCategory, GlossaryCategory> = {
  mobility: 'movement',
  strength: 'stance',
  core: 'philosophy',
  balance: 'attack',
  coordination: 'etiquette',
  power: 'other',
  recovery: 'philosophy',
};

export const getPracticeCategoryStyle = (
  category: PracticeCategory,
): { backgroundColor: string; color: string } => {
  const mapped = PRACTICE_CATEGORY_STYLES[category];
  return getCategoryStyle(mapped);
};

export const getPracticeCategoryLabel = (category: PracticeCategory, copy: Copy): string => {
  const labels: Record<PracticeCategory, string> = {
    mobility: copy.practiceCategoryMobility,
    strength: copy.practiceCategoryStrength,
    core: copy.practiceCategoryCore,
    balance: copy.practiceCategoryBalance,
    coordination: copy.practiceCategoryCoordination,
    power: copy.practiceCategoryPower,
    recovery: copy.practiceCategoryRecovery,
  };
  return labels[category];
};
