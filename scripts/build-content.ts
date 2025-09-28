import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Technique } from '../src/types';
import { parseTechnique } from '../src/content/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.resolve(__dirname, '..', 'content', 'techniques');
const outputFile = path.resolve(__dirname, '..', 'src', 'data', 'seed.index.json');

const normalizeOptional = (value: string | undefined | null): string | undefined => {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeTechnique = (technique: Technique): Technique => {
  const notes = technique.ukeNotes
    ? {
        en: technique.ukeNotes.en.trim(),
        de: technique.ukeNotes.de.trim(),
      }
    : null;

  const variations = Array.from(new Set(technique.variations.map((entry) => entry.trim()).filter(Boolean)));

  return {
    ...technique,
    jp: normalizeOptional(technique.jp ?? undefined),
    attack: normalizeOptional(technique.attack ?? undefined),
    stance: normalizeOptional(technique.stance ?? undefined),
    weapon: normalizeOptional(technique.weapon ?? undefined),
    ukeNotes: notes && (notes.en.length > 0 || notes.de.length > 0) ? notes : null,
    variations,
  };
};

const stanceCriticalAttacks = new Set([
  'shomen-uchi',
  'yokomen-uchi',
  'shomen-tsuki',
  'tsuki',
  'katate-dori',
  'katate-ryote-dori',
  'morote-dori',
  'ryote-dori',
  'ushiro-ryote-dori',
  'ushiro-ryokata-dori',
  'ushiro-eri-dori',
  'ushiro-kakae-dori',
  'ushiro-katate-dori-kubi-shime',
  'yoko-kubi-shime',
]);

async function build(): Promise<void> {
  const entries = await fs.readdir(contentDir);
  const techniques: Technique[] = [];
  for (const entry of entries.filter((file) => file.endsWith('.json'))) {
    const slug = entry.replace(/\.json$/i, '');
    const filePath = path.join(contentDir, entry);
    const raw = await fs.readFile(filePath, 'utf8');
    let parsedJSON: unknown;
    try {
      parsedJSON = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse JSON for ${entry}: ${(error as Error).message}`);
    }

    let technique: Technique;
    try {
      technique = normalizeTechnique(parseTechnique(parsedJSON, slug));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Validation failed for ${entry}: ${error.message}`);
      }
      throw error;
    }

    if (technique.tags) {
      const lowerTags = new Set(technique.tags.map((tag) => tag.toLowerCase()));
      const checks: Array<[label: string, value: string | undefined]> = [
        ['category', technique.category],
        ['attack', technique.attack],
      ];
      for (const [label, value] of checks) {
        if (value && lowerTags.has(value.toLowerCase())) {
          console.warn(`Warning: ${entry} tag list duplicates ${label} value "${value}".`);
        }
      }
    }

    if (!technique.stance && technique.attack && stanceCriticalAttacks.has(technique.attack)) {
      console.warn(`Warning: ${entry} is missing a stance for attack "${technique.attack}".`);
    }

    techniques.push(technique);
  }

  techniques.sort((a, b) => a.name.en.localeCompare(b.name.en));

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(techniques, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${techniques.length} techniques to ${path.relative(path.resolve(__dirname, '..'), outputFile)}`);
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
