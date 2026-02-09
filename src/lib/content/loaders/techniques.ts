import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Technique } from '../../../shared/types';
import { parseTechnique } from '../schemas/technique';

const techniquesDir = path.join(process.cwd(), 'content', 'techniques');

const readTechniqueFiles = async (): Promise<string[]> => {
  const entries = await readdir(techniquesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => path.join(techniquesDir, entry.name))
    .sort();
};

export const loadAllTechniques = async (): Promise<Technique[]> => {
  const files = await readTechniqueFiles();
  const techniques: Technique[] = [];

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    const json = JSON.parse(raw) as unknown;
    const expectedSlug = path.basename(filePath, '.json');
    techniques.push(parseTechnique(json, expectedSlug));
  }

  techniques.sort((a, b) => a.name.en.localeCompare(b.name.en, 'en', { sensitivity: 'base' }));
  return techniques;
};

export const loadTechniqueBySlug = async (slug: string): Promise<Technique | undefined> => {
  const techniques = await loadAllTechniques();
  return techniques.find((technique) => technique.slug === slug);
};
