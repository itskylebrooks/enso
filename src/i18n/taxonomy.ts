import type { Locale, Grade } from '../types';
import { gradeLabel } from '../styles/belts';
import { gradeOrder } from '../utils/grades';
import { stripDiacritics } from '../utils/text';

export type TaxonomyType = 'category' | 'attack' | 'stance' | 'weapon';

type TaxonomyMap = Record<TaxonomyType, Record<string, string>>;

type TaxonomyLabels = Record<Locale, TaxonomyMap>;

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
    attack: {
      'katate-dori': 'Katate-dori (Single-hand grab)',
      'ryote-dori': 'Ryōte-dori (Two-hand grab)',
      'katate-ryote-dori': 'Katate-ryōte-dori',
      'morote-dori': 'Morote-dori (Two-on-one)',
      'mune-dori': 'Mune-dori (Chest grab)',
      'yokomen-uchi': 'Yokomen-uchi (Diagonal strike)',
      'shomen-uchi': 'Shōmen-uchi (Frontal strike)',
      'shomen-tsuki': 'Shōmen-tsuki (Frontal thrust)',
      'yoko-tsuki-soto': 'Yoko-tsuki (Outer thrust)',
      tsuki: 'Tsuki (Thrust)',
      'yoko-kubi-shime': 'Yoko-kubi-shime (Side choke)',
      'ushiro-ryote-dori': 'Ushiro-ryōte-dori (Rear two-hand grab)',
      'ushiro-ryokata-dori': 'Ushiro-ryōkata-dori (Rear shoulder grab)',
      'ushiro-eri-dori': 'Ushiro-eri-dori (Rear collar grab)',
      'ushiro-kakae-dori': 'Ushiro-kakae-dori (Bear hug)',
      'ushiro-katate-dori-kubi-shime': 'Ushiro-katate-dori kubi-shime',
      'ushiro-kubi-shime': 'Ushiro-kubi-shime (Rear choke)',
    },
    stance: {
      omote: 'Omote (Front entry)',
      ura: 'Ura (Turning entry)',
    },
    weapon: {
      'empty-hand': 'Empty hand',
      tanto: 'Tantō',
      jo: 'Jō',
      bokken: 'Bokken',
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
    attack: {
      'katate-dori': 'Katate-dori (Einhandgriff)',
      'ryote-dori': 'Ryōte-dori (Zweihandgriff)',
      'katate-ryote-dori': 'Katate-ryōte-dori',
      'morote-dori': 'Morote-dori (Zwei-zu-eins-Griff)',
      'mune-dori': 'Mune-dori (Brustgriff)',
      'yokomen-uchi': 'Yokomen-uchi (Seitschlag)',
      'shomen-uchi': 'Shōmen-uchi (Frontalschlag)',
      'shomen-tsuki': 'Shōmen-tsuki (Frontstoß)',
      'yoko-tsuki-soto': 'Yoko-tsuki (äußerer Stoß)',
      tsuki: 'Tsuki (Stoß)',
      'yoko-kubi-shime': 'Yoko-kubi-shime (Seitlicher Würgegriff)',
      'ushiro-ryote-dori': 'Ushiro-ryōte-dori (Griff von hinten, beide Hände)',
      'ushiro-ryokata-dori': 'Ushiro-ryōkata-dori (Griff von hinten, Schultern)',
      'ushiro-eri-dori': 'Ushiro-eri-dori (Kragengriff von hinten)',
      'ushiro-kakae-dori': 'Ushiro-kakae-dori (Umklammerung)',
      'ushiro-katate-dori-kubi-shime': 'Ushiro-katate-dori kubi-shime',
      'ushiro-kubi-shime': 'Ushiro-kubi-shime (Würgegriff von hinten)',
    },
    stance: {
      omote: 'Omote (Vorderseite)',
      ura: 'Ura (Rückseite)',
    },
    weapon: {
      'empty-hand': 'Ohne Waffe',
      tanto: 'Tantō',
      jo: 'Jō',
      bokken: 'Bokken',
    },
  },
};

const taxonomyOrder: Record<TaxonomyType, string[]> = {
  category: ['throw', 'control', 'immobilization', 'weapon', 'ukemi'],
  attack: [
    'katate-dori',
    'ryote-dori',
    'katate-ryote-dori',
    'morote-dori',
    'mune-dori',
    'shomen-uchi',
    'yokomen-uchi',
    'shomen-tsuki',
    'yoko-tsuki-soto',
    'tsuki',
    'ushiro-ryote-dori',
    'ushiro-ryokata-dori',
    'ushiro-eri-dori',
    'ushiro-kakae-dori',
    'ushiro-katate-dori-kubi-shime',
    'ushiro-kubi-shime',
    'yoko-kubi-shime',
  ],
  stance: ['omote', 'ura'],
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
  addSynonyms('katate-dori', ['katate dori', '片手取り']),
  addSynonyms('katate-ryote-dori', ['katate ryote dori', '片手両手取り', 'katate-ryōte-dori']),
  addSynonyms('morote-dori', ['morote dori', '諸手取り']),
  addSynonyms('ryote-dori', ['ryote dori', '両手取り', 'ryōte-dori']),
  addSynonyms('mune-dori', ['胸取り', 'mune dori']),
  addSynonyms('shomen-uchi', ['shōmen-uchi', 'shomen uchi', '正面打ち', 'shomen']),
  addSynonyms('shomen-tsuki', ['shōmen-tsuki', 'shomen tsuki', '正面突き', 'tsuki']),
  addSynonyms('yokomen-uchi', ['yokomen uchi', '横面打ち', 'yokomen']),
  addSynonyms('ushiro-ryote-dori', ['ushiro ryote dori', '後ろ両手取り', 'ushiro-ryōte-dori']),
  addSynonyms('ushiro-ryokata-dori', ['ushiro ryokata dori', '後ろ両肩取り', 'ushiro-ryōkata-dori']),
  addSynonyms('ushiro-eri-dori', ['ushiro eri dori', '後ろ襟取り']),
  addSynonyms('ushiro-katate-dori-kubi-shime', ['ushiro katate dori kubishime', '後ろ片手取り首絞め']),
  addSynonyms('omote', ['表', 'front stance', 'omote waza']),
  addSynonyms('ura', ['裏', 'rear stance', 'ura waza', 'turning']),
  addSynonyms('empty-hand', ['empty hand', 'taijutsu', '体術']),
]);

export const expandWithSynonyms = (value: string): string[] => {
  const normalized = value.toLowerCase();
  const base = [normalized];
  const synonymList = searchSynonyms[normalized];
  if (!synonymList) return base;
  return [...base, ...synonymList.map((entry) => entry.toLowerCase())];
};

export const normalizeTaxonomyValue = (value: string): string => stripDiacritics(value.toLowerCase());
