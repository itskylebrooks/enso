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
    id: "alfred-haase",
    name: "Alfred Haase", 
    dojoId: "bsv"
  }
];

const DOJOS: Dojo[] = [
  {
    id: "bsv",
    name: "BSV",
    city: "Hamburg",
    country: "DE"
  }
];

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
    const trainer = TRAINERS.find(t => t.id === version.trainerId);
    const dojo = DOJOS.find(d => d.id === version.dojoId);
    
    if (trainer && dojo) {
      return `${trainer.name} (${dojo.name})`;
    }
  }

  // If only trainerId exists
  if (version.trainerId) {
    const trainer = TRAINERS.find(t => t.id === version.trainerId);
    if (trainer) {
      return trainer.name;
    }
  }

  // Default to "Standard"
  return "Standard";
}