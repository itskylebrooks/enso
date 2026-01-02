import type { Locale, Grade } from '../types';
import { gradeLabel } from '../styles/belts';
import { gradeOrder } from '../utils/grades';
import { stripDiacritics } from '../utils/text';

export type TaxonomyType = 'category' | 'attack' | 'weapon';

type TaxonomyMap = Record<TaxonomyType, Record<string, string>>;

type TaxonomyLabels = Record<Locale, Partial<TaxonomyMap>>;

const fallbackTitle = (value: string): string =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const taxonomyLabels: TaxonomyLabels = {
  en: {
    category: {
      throw: 'Throws (Nage-waza)',
      control: 'Controls / Pins (Osae-waza)',
      immobilization: 'Immobilizations (Katame-waza)',
      weapon: 'Weapons (Buki-waza)',
      ukemi: 'Ukemi',
    },
  },
  de: {
    category: {
      throw: 'Würfe (Nage-waza)',
      control: 'Kontrollen / Haltegriffe (Osae-waza)',
      immobilization: 'Immobilisationen (Katame-waza)',
      weapon: 'Waffen (Buki-waza)',
      ukemi: 'Ukemi',
    },
  },
};

const taxonomyOrder: Record<TaxonomyType, string[]> = {
  category: ['throw', 'control', 'immobilization', 'weapon'],
  attack: [
    'katate-tori',
    'ryote-tori',
    'katate-ryote-tori',
    'morote-tori',
    'mune-tori',
    'shomen-uchi',
    'yokomen-uchi',
    'shomen-tsuki',
    'yoko-tsuki-soto',
    'tsuki',
    'ushiro-ryote-tori',
    'ushiro-ryokata-tori',
    'ushiro-eri-tori',
    'ushiro-kakae-tori',
    'ushiro-katate-tori-kubi-shime',
    'ushiro-kubi-shime',
    'yoko-kubi-shime',
  ],
  weapon: ['empty-hand', 'tanto', 'jo', 'bokken'],
};

const buildLevelLabels = (): Record<Locale, Record<Grade, string>> => {
  const result = { en: {} as Record<Grade, string>, de: {} as Record<Grade, string> };
  for (const grade of gradeOrder) {
    result.en[grade] = gradeLabel(grade, 'en');
    result.de[grade] = gradeLabel(grade, 'de');
  }
  return result;
};

export const levelLabels = buildLevelLabels();

export const getTaxonomyLabel = (locale: Locale, type: TaxonomyType, value: string): string => {
  const localized = taxonomyLabels[locale]?.[type]?.[value];
  if (localized) return localized;
  const fallback = taxonomyLabels.en[type]?.[value];
  if (fallback) return fallback;
  return fallbackTitle(value);
};

export const getLevelLabel = (locale: Locale, grade: Grade): string => levelLabels[locale][grade];

export const getOrderedTaxonomyValues = (type: TaxonomyType): string[] => taxonomyOrder[type] ?? [];

const addSynonyms = (value: string, variants: string[]): [string, string[]] => [value, variants];

export const searchSynonyms: Record<string, string[]> = Object.fromEntries([
  addSynonyms('irimi-nage', ['iriminage', '入り身投げ']),
  addSynonyms('kaiten-nage', ['kaiten nage', '回転投げ']),
  addSynonyms('kaiten-nage-soto', ['kaiten-nage soto', '回転投げ 外']),
  addSynonyms('kote-mawashi-nikyo', ['nikyo', 'nikkyo', '小手回し二教', 'nikyō']),
  addSynonyms('katate-tori', ['katate tori', '片手取り']),
  addSynonyms('katate-ryote-tori', ['katate ryote tori', '片手両手取り', 'katate-ryōte-tori']),
  addSynonyms('morote-tori', ['morote tori', '諸手取り']),
  addSynonyms('ryote-tori', ['ryote tori', '両手取り', 'ryōte-tori']),
  addSynonyms('mune-tori', ['胸取り', 'mune tori']),
  addSynonyms('shomen-uchi', ['shōmen-uchi', 'shomen uchi', '正面打ち', 'shomen']),
  addSynonyms('shomen-tsuki', ['shōmen-tsuki', 'shomen tsuki', '正面突き', 'tsuki']),
  addSynonyms('yokomen-uchi', ['yokomen uchi', '横面打ち', 'yokomen']),
  addSynonyms('ushiro-ryote-tori', ['ushiro ryote tori', '後ろ両手取り', 'ushiro-ryōte-tori']),
  addSynonyms('ushiro-ryokata-tori', [
    'ushiro ryokata tori',
    '後ろ両肩取り',
    'ushiro-ryōkata-tori',
  ]),
  addSynonyms('ushiro-eri-tori', ['ushiro eri tori', '後ろ襟取り']),
  addSynonyms('ushiro-katate-tori-kubi-shime', [
    'ushiro katate tori kubishime',
    '後ろ片手取り首絞め',
  ]),
  addSynonyms('irimi', ['入身', 'omote', '表', 'front stance', 'omote waza', 'irimi waza']),
  addSynonyms('tenkan', ['転換', 'ura', '裏', 'rear stance', 'ura waza', 'turning', 'tenkan waza']),
  addSynonyms('empty-hand', ['empty hand', 'taijutsu', '体術']),
]);

export const expandWithSynonyms = (value: string): string[] => {
  const normalized = value.toLowerCase();
  const base = [normalized];
  const synonymList = searchSynonyms[normalized];
  if (!synonymList) return base;
  return [...base, ...synonymList.map((entry) => entry.toLowerCase())];
};

export const normalizeTaxonomyValue = (value: string): string =>
  stripDiacritics(value.toLowerCase());
