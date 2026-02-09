import type { Copy } from '../constants/i18n';
import type { GlossaryTerm } from '../types';

export const getCategoryStyle = (
  category: GlossaryTerm['category'],
): { backgroundColor: string; color: string } => ({
  backgroundColor: `var(--glossary-${category}-bg)`,
  color: `var(--glossary-${category}-fg)`,
});

export const getCategoryLabel = (category: GlossaryTerm['category'], copy: Copy): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: copy.categoryMovement,
    stance: copy.categoryStance,
    attack: copy.categoryAttack,
    etiquette: copy.categoryEtiquette,
    philosophy: copy.categoryPhilosophy,
    other: copy.categoryOther,
  };
  return labels[category];
};
