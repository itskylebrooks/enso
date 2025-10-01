import type { GlossaryTerm } from '../types';

// Light mode palette - good contrast on light backgrounds
const lightPalette: Record<GlossaryTerm['category'], { bg: string; fg: string }> = {
  movement: { bg: '#dbeafe', fg: '#1e40af' },      // blue-100, blue-700
  stance: { bg: '#dcfce7', fg: '#15803d' },        // green-100, green-700
  attack: { bg: '#fee2e2', fg: '#dc2626' },        // red-100, red-700
  etiquette: { bg: '#f3e8ff', fg: '#7c3aed' },     // purple-100, purple-700
  philosophy: { bg: '#fef3c7', fg: '#d97706' },    // amber-100, amber-700
  other: { bg: '#f3f4f6', fg: '#374151' },         // gray-100, gray-700
};

// Dark mode palette - good contrast on dark backgrounds
const darkPalette: Record<GlossaryTerm['category'], { bg: string; fg: string }> = {
  movement: { bg: 'rgba(30, 58, 138, 0.3)', fg: '#93c5fd' },      // blue-900/30, blue-300
  stance: { bg: 'rgba(20, 83, 45, 0.3)', fg: '#86efac' },         // green-900/30, green-300  
  attack: { bg: 'rgba(127, 29, 29, 0.3)', fg: '#fca5a5' },        // red-900/30, red-300
  etiquette: { bg: 'rgba(88, 28, 135, 0.3)', fg: '#c4b5fd' },     // purple-900/30, purple-300
  philosophy: { bg: 'rgba(120, 53, 15, 0.3)', fg: '#fcd34d' },    // amber-900/30, amber-300
  other: { bg: 'rgba(17, 24, 39, 0.5)', fg: '#d1d5db' },          // gray-900/50, gray-300
};

export const getCategoryStyle = (category: GlossaryTerm['category'], isDark?: boolean): { backgroundColor: string; color: string } => {
  const selectedPalette = isDark ? darkPalette : lightPalette;
  const entry = selectedPalette[category];
  return { backgroundColor: entry.bg, color: entry.fg };
};

export const getCategoryLabel = (category: GlossaryTerm['category'], copy: any): string => {
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