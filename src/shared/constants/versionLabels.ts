import type { TechniqueVersion } from '@shared/types';

// Types for registry data
type Trainer = {
  id: string;
  name: string;
  dojoId: string;
};

type Dojo = {
  id: string;
  name: string;
  city: string;
  country: string;
};

// In a real app, these would be loaded from the JSON files
// For now, hardcode the data from our registry files
const TRAINERS: Trainer[] = [
  {
    id: 'alfred-haase',
    name: 'Alfred Haase',
    dojoId: 'bsv',
  },
  {
    id: 'hubert-luhmann',
    name: 'Hubert Luhmann',
    dojoId: 'dab',
  },
];

const DOJOS: Dojo[] = [
  {
    id: 'bsv',
    name: 'BSV',
    city: 'Hamburg',
    country: 'DE',
  },
  {
    id: 'dab',
    name: 'DAB',
    city: 'Hamburg',
    country: 'DE',
  },
];

export function getTrainerNameById(trainerId: string | undefined): string | null {
  if (!trainerId) return null;
  const trainer = TRAINERS.find((item) => item.id === trainerId);
  return trainer?.name ?? null;
}

export function getTrainerInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, ''))
    .filter((part) => part.length > 0);

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('.');
}

export function getTrainerInitialsById(trainerId: string | undefined): string | null {
  const name = getTrainerNameById(trainerId);
  if (!name) return null;
  const initials = getTrainerInitials(name);
  return initials.length > 0 ? initials : null;
}

/**
 * Generate a display label for a technique version based on v2 schema rules:
 * - If label exists, use it
 * - Else if trainerId + dojoId, show "Trainer (Dojo)"
 * - Else "Standard"
 */
export function generateVersionLabel(version: TechniqueVersion): string {
  // If explicit label exists, use it
  if (version.label && version.label.trim().length > 0) {
    return version.label;
  }

  // If both trainerId and dojoId exist, generate "Trainer (Dojo)" format
  if (version.trainerId && version.dojoId) {
    const trainer = TRAINERS.find((t) => t.id === version.trainerId);
    const dojo = DOJOS.find((d) => d.id === version.dojoId);

    if (trainer && dojo) {
      return `${trainer.name} (${dojo.name})`;
    }
  }

  // If only trainerId exists
  if (version.trainerId) {
    const trainer = TRAINERS.find((t) => t.id === version.trainerId);
    if (trainer) {
      return trainer.name;
    }
  }

  // Default to "Base"
  return 'Base';
}
