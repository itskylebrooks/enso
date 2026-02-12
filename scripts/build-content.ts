import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import { z } from 'zod';
import { validateAllContent } from '../src/lib/content/validate-all';
import { loadAllGlossaryTerms } from '../src/lib/content/loaders/glossary';
import { loadAllPracticeExercises } from '../src/lib/content/loaders/practice';
import { loadAllTechniques } from '../src/lib/content/loaders/techniques';

const rootDir = process.cwd();
const generatedDir = path.join(rootDir, 'src', 'generated', 'content');
const contentDir = path.join(rootDir, 'content');
const publicImagesDir = path.join(rootDir, 'public', 'images');
const authorImageName = 'Lehrgang-November-2025.jpeg';

const quoteSchema = z.array(
  z.object({
    quote: z.string().min(1),
    author: z.string().min(1),
  }),
);

const readAndParseQuotes = async (fileName: string) => {
  const filePath = path.join(contentDir, fileName);
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const result = quoteSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid quotes file: ${fileName}\n${result.error.message}`);
  }

  return result.data;
};

const writeJsonFile = async (fileName: string, value: unknown) => {
  const destination = path.join(generatedDir, fileName);
  const resolvedConfig = (await prettier.resolveConfig(destination)) ?? {};
  const formatted = await prettier.format(JSON.stringify(value), {
    ...resolvedConfig,
    parser: 'json',
    filepath: destination,
  });
  await writeFile(destination, formatted, 'utf8');
};

const copyAuthorImage = async () => {
  const source = path.join(contentDir, authorImageName);
  const destination = path.join(publicImagesDir, authorImageName);
  await mkdir(publicImagesDir, { recursive: true });
  await copyFile(source, destination);
};

async function run(): Promise<void> {
  const summary = await validateAllContent();
  const [techniques, glossaryTerms, practiceExercises, quotesEn, quotesDe] = await Promise.all([
    loadAllTechniques(),
    loadAllGlossaryTerms(),
    loadAllPracticeExercises(),
    readAndParseQuotes('quotes.json'),
    readAndParseQuotes('quotes-de.json'),
  ]);

  await mkdir(generatedDir, { recursive: true });

  await Promise.all([
    writeJsonFile('techniques.json', techniques),
    writeJsonFile('glossary.json', glossaryTerms),
    writeJsonFile('practice.json', practiceExercises),
    writeJsonFile('quotes-en.json', quotesEn),
    writeJsonFile('quotes-de.json', quotesDe),
    copyAuthorImage(),
  ]);

  console.log(
    `Validated content: techniques=${summary.techniques}, glossary=${summary.glossaryTerms}, practice=${summary.practiceExercises}`,
  );
  console.log(`Generated content artifacts in ${generatedDir}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
