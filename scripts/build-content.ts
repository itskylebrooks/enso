import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { parseTechnique } from '../src/shared/types/content';

const techniquesDir = join(process.cwd(), 'content', 'techniques');

async function loadTechniqueFiles(): Promise<string[]> {
  const entries = await readdir(techniquesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => join(techniquesDir, entry.name))
    .sort();
}

async function validateTechniques(): Promise<void> {
  const files = await loadTechniqueFiles();
  const errors: Array<{ file: string; error: unknown }> = [];

  await Promise.all(
    files.map(async (filePath) => {
      try {
        const raw = await readFile(filePath, 'utf8');
        const json = JSON.parse(raw);
        const slug = json?.slug ?? filePath.split('/').pop()?.replace(/\.json$/i, '');
        if (typeof slug !== 'string' || slug.length === 0) {
          throw new Error('Missing slug');
        }
        parseTechnique(json, slug);
      } catch (error) {
        errors.push({ file: filePath, error });
      }
    }),
  );

  if (errors.length > 0) {
    errors.forEach(({ file, error }) => {
      console.error(`Failed to validate ${file}`);
      console.error(error);
      console.error('');
    });
    throw new Error('Content validation failed');
  }

  console.log(`Validated ${files.length} technique file(s).`);
}

validateTechniques().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
