import type { JoColumn, JoRow } from '../types/exam';

// Column definitions for Jō Techniques program
export const JO_COLUMNS: JoColumn[] = [
  // Jo Nage Waza section
  { 
    key: 'jo_ryote_dori_double', 
    label: { 
      en: 'Jō Ryōte-dori (1)', 
      de: 'Jō Ryōte-dori (1)' 
    },
    section: 'jo_nage_waza'
  },
  { 
    key: 'jo_ryote_dori_gyaku', 
    label: { 
      en: 'Jō Ryōte-dori (2)', 
      de: 'Jō Ryōte-dori (2)' 
    },
    section: 'jo_nage_waza'
  },
  { 
    key: 'jo_katate_dori', 
    label: { 
      en: 'Jō Katate-dori (3)', 
      de: 'Jō Katate-dori (3)' 
    },
    section: 'jo_nage_waza'
  },
  { 
    key: 'jo_katate_ryote_dori', 
    label: { 
      en: 'Jō Katate Ryōte-dori (4)', 
      de: 'Jō Katate Ryōte-dori (4)' 
    },
    section: 'jo_nage_waza'
  },
  // Jo Tori section
  { 
    key: 'jo_tsuki', 
    label: { 
      en: 'Jō Tsuki', 
      de: 'Jō Tsuki' 
    },
    section: 'jo_tori'
  },
  { 
    key: 'jo_yokomen_uchi', 
    label: { 
      en: 'Jō Yokomen-uchi', 
      de: 'Jō Yokomen-uchi' 
    },
    section: 'jo_tori'
  },
  { 
    key: 'jo_shomen_uchi', 
    label: { 
      en: 'Jō Shōmen-uchi', 
      de: 'Jō Shōmen-uchi' 
    },
    section: 'jo_tori'
  },
  { 
    key: 'jo_morote_awase_tsuki', 
    label: { 
      en: 'Jō Morote Awase Tsuki', 
      de: 'Jō Morote Awase Tsuki' 
    },
    section: 'jo_tori'
  },
];

// Row definitions for Jō Techniques program
export const JO_ROWS: JoRow[] = [
  {
    id: 'shiho-nage',
    label: { en: 'Shiho-nage', de: 'Shiho-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ashi-fumi',
    label: { en: 'Ashi-fumi', de: 'Ashi-fumi' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'irimi-nage',
    label: { en: 'Irimi-nage', de: 'Irimi-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'check' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'mae-ashi-barai',
    label: { en: 'Mae Ashi-barai', de: 'Mae Ashi-barai' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ushiro-ashi-barai',
    label: { en: 'Ushiro Ashi-barai', de: 'Ushiro Ashi-barai' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'koshi-nage',
    label: { en: 'Koshi-nage', de: 'Koshi-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'check' },
    },
  },
  {
    id: 'kote-gaeshi',
    label: { en: 'Kote-gaeshi', de: 'Kote-gaeshi' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'koshi-nage-kote-hineri',
    label: { en: 'Koshi-nage Kote-hineri', de: 'Koshi-nage Kote-hineri' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'kokyu-nage',
    label: { en: 'Kokyu-nage', de: 'Kokyu-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'check' },
    },
  },
  {
    id: 'katate-dori-ushiro-kubi-shime',
    label: { en: 'Katate-dori Ushiro Kubi-shime', de: 'Katate-dori Ushiro Kubi-shime' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'kaiten-nage',
    label: { en: 'Kaiten-nage', de: 'Kaiten-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ude-kime-nage',
    label: { en: 'Ude-kime-nage', de: 'Ude-kime-nage' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'juji-garami',
    label: { en: 'Juji-garami', de: 'Juji-garami' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ushiro-kiri-otoshi',
    label: { en: 'Ushiro Kiri-otoshi', de: 'Ushiro Kiri-otoshi' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'check' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'empty' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ude-osae-ikkyo',
    label: { en: 'Ude-osae (Ikkyo)', de: 'Ude-osae (Ikkyo)' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'kote-hineri-sankyo',
    label: { en: 'Kote-hineri (Sankyo)', de: 'Kote-hineri (Sankyo)' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'kote-mawashi-nikyo',
    label: { en: 'Kote-mawashi (Nikyo)', de: 'Kote-mawashi (Nikyo)' },
    cells: {
      jo_ryote_dori_double: { kind: 'check' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ude-garami',
    label: { en: 'Ude-garami', de: 'Ude-garami' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'check' },
      jo_katate_dori: { kind: 'check' },
      jo_katate_ryote_dori: { kind: 'check' },
      jo_tsuki: { kind: 'empty' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'empty' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
  {
    id: 'ude-hiji-kime-osae',
    label: { en: '(Ude) Hiji-kime-osae', de: '(Ude) Hiji-kime-osae' },
    cells: {
      jo_ryote_dori_double: { kind: 'empty' },
      jo_ryote_dori_gyaku: { kind: 'empty' },
      jo_katate_dori: { kind: 'empty' },
      jo_katate_ryote_dori: { kind: 'empty' },
      jo_tsuki: { kind: 'check' },
      jo_yokomen_uchi: { kind: 'check' },
      jo_shomen_uchi: { kind: 'check' },
      jo_morote_awase_tsuki: { kind: 'empty' },
    },
  },
];
