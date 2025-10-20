import type { AttackColumn, MatrixRow } from '../types/exam';

// Attack columns in exact left-to-right order
export const ATTACK_COLUMNS: AttackColumn[] = [
  { key: 'katate_dori', label: { en: 'Katate-tori', de: 'Katate-tori' } },
  { key: 'ryote_dori', label: { en: 'Ryōte-tori', de: 'Ryōte-tori' } },
  { key: 'katate_ryote_dori', label: { en: 'Katate-ryōte-tori', de: 'Katate-ryōte-tori' } },
  { key: 'mune_dori', label: { en: 'Mune-tori', de: 'Mune-tori' } },
  { key: 'yoko_kubi_shime', label: { en: 'Yoko-kubi-shime', de: 'Yoko-kubi-shime' } },
  { key: 'ushiro_ryokata_dori', label: { en: 'Ushiro-ryokata-tori', de: 'Ushiro-ryokata-tori' } },
  { key: 'ushiro_kakae_dori', label: { en: 'Ushiro-kakae-tori', de: 'Ushiro-kakae-tori' } },
  { key: 'ushiro_ryote_dori', label: { en: 'Ushiro-ryōte-tori', de: 'Ushiro-ryōte-tori' } },
  { key: 'ushiro_eri_dori', label: { en: 'Ushiro-eri-tori', de: 'Ushiro-eri-tori' } },
  { key: 'ushiro_katate_dori_kubi_shime', label: { en: 'Ushiro-katate-tori / kubi-shime', de: 'Ushiro-katate-tori / kubi-shime' } },
  { key: 'ushiro_kubi_shime', label: { en: 'Ushiro-kubi-shime', de: 'Ushiro-kubi-shime' } },
  { key: 'yokomen_uchi', label: { en: 'Yokomen-uchi', de: 'Yokomen-uchi' } },
  { key: 'shomen_uchi', label: { en: 'Shōmen-uchi', de: 'Shōmen-uchi' } },
  { key: 'shomen_tsuki', label: { en: 'Shōmen-tsuki', de: 'Shōmen-tsuki' } },
  { key: 'yoko_tsuki_soto', label: { en: 'Yoko-tsuki (soto)', de: 'Yoko-tsuki (soto)' } },
];

// Matrix rows - Partial dataset for demonstration
// TODO: Complete all cells based on the exam chart image
export const MATRIX_ROWS: MatrixRow[] = [
  // Nage-waza section
  {
    id: 'shiho-nage',
    label: { en: '1. Shiho-nage', de: '1. Shiho-nage' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 5 },
      ryote_dori: { kind: 'kyu', kyu: 5 },
      katate_ryote_dori: { kind: 'kyu', kyu: 5 },
      mune_dori: { kind: 'kyu', kyu: 5 },
      ushiro_ryote_dori: { kind: 'kyu', kyu: 4 },
      yokomen_uchi: { kind: 'kyu', kyu: 4 },
    },
  },
  {
    id: 'kaiten-nage-uchi',
    label: { en: '2. Kaiten-nage (uchi)', de: '2. Kaiten-nage (uchi)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 4 },
      yokomen_uchi: { kind: 'kyu', kyu: 4 },
      shomen_uchi: { kind: 'kyu', kyu: 4 },
      shomen_tsuki: { kind: 'kyu', kyu: 4 },
    },
  },
  {
    id: 'irimi-nage',
    label: { en: '3. Irimi-nage', de: '3. Irimi-nage' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 4 },
      ryote_dori: { kind: 'kyu', kyu: 4 },
      katate_ryote_dori: { kind: 'kyu', kyu: 4 },
      ushiro_ryote_dori: { kind: 'kyu', kyu: 3 },
      yokomen_uchi: { kind: 'kyu', kyu: 3 },
      shomen_uchi: { kind: 'kyu', kyu: 3 },
      shomen_tsuki: { kind: 'kyu', kyu: 3 },
    },
  },
  {
    id: 'kaiten-nage-soto',
    label: { en: '4. Kaiten-nage (soto)', de: '4. Kaiten-nage (soto)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 3 },
      shomen_uchi: { kind: 'kyu', kyu: 3 },
      shomen_tsuki: { kind: 'kyu', kyu: 3 },
    },
  },
  {
    id: 'aiki-otoshi',
    label: { en: '5. Aiki-otoshi', de: '5. Aiki-otoshi' },
    cells: {
      yoko_kubi_shime: { kind: 'kyu', kyu: 2 },
      ushiro_ryokata_dori: { kind: 'kyu', kyu: 2 },
      ushiro_kakae_dori: { kind: 'kyu', kyu: 2 },
    },
  },
  {
    id: 'koshi-nage',
    label: { en: '6. Koshi-nage', de: '6. Koshi-nage' },
    cells: {
      ryote_dori: { kind: 'kyu', kyu: 2 },
      mune_dori: { kind: 'kyu', kyu: 2 },
      yoko_kubi_shime: { kind: 'kyu', kyu: 2 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 2 },
      ushiro_kubi_shime: { kind: 'kyu', kyu: 2 },
      yokomen_uchi: { kind: 'kyu', kyu: 2 },
      shomen_uchi: { kind: 'kyu', kyu: 2 },
      shomen_tsuki: { kind: 'kyu', kyu: 2 },
    },
  },
  {
    id: 'kote-gaeshi',
    label: { en: '7. Kote-gaeshi', de: '7. Kote-gaeshi' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 1 },
      ryote_dori: { kind: 'kyu', kyu: 1 },
      katate_ryote_dori: { kind: 'kyu', kyu: 1 },
      ushiro_ryote_dori: { kind: 'kyu', kyu: 1 },
      yokomen_uchi: { kind: 'kyu', kyu: 1 },
      shomen_uchi: { kind: 'kyu', kyu: 1 },
      shomen_tsuki: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'koshi-nage-hiji-garami',
    label: { en: '8. Koshi-nage-hiji-garami', de: '8. Koshi-nage-hiji-garami' },
    cells: {
      ushiro_ryote_dori: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'koshi-nage-kote-hineri',
    label: { en: '9. Koshi-nage-kote-hineri', de: '9. Koshi-nage-kote-hineri' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 1 },
      ushiro_ryote_dori: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'juji-garami',
    label: { en: '10. Juji-garami', de: '10. Juji-garami' },
    cells: {
      ushiro_ryote_dori: { kind: 'kyu', kyu: 1 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'tenchi-nage',
    label: { en: '11. Tenchi-nage', de: '11. Tenchi-nage' },
    cells: {
      ryote_dori: { kind: 'dan', dan: 1 },
      yokomen_uchi: { kind: 'dan', dan: 1 },
      shomen_tsuki: { kind: 'dan', dan: 1 },
    },
  },
  {
    id: 'sumi-otoshi',
    label: { en: '12. Sumi-otoshi', de: '12. Sumi-otoshi' },
    cells: {
      katate_dori: { kind: 'dan', dan: 1 },
      ryote_dori: { kind: 'dan', dan: 1 },
    },
  },
  {
    id: 'kokyu-nage',
    label: { en: '13. Kokyu-nage', de: '13. Kokyu-nage' },
    cells: {
      ryote_dori: { kind: 'dan', dan: 1 },
      katate_ryote_dori: { kind: 'dan', dan: 1 },
      ushiro_ryokata_dori: { kind: 'dan', dan: 1 },
      ushiro_kakae_dori: { kind: 'dan', dan: 1 },
      yokomen_uchi: { kind: 'dan', dan: 1 },
    },
  },
  {
    id: 'ude-kime-nage',
    label: { en: '14. Ude-kime-nage', de: '14. Ude-kime-nage' },
    cells: {
      katate_ryote_dori: { kind: 'dan', dan: 1 },
      yokomen_uchi: { kind: 'dan', dan: 1 },
      shomen_tsuki: { kind: 'dan', dan: 1 },
    },
  },
];

// Katame-waza section
export const KATAME_ROWS: MatrixRow[] = [
  {
    id: 'ude-osae-ikkyo',
    label: { en: 'I. Ude-osae (ikkyo)', de: 'I. Ude-osae (ikkyo)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 5 },
      ryote_dori: { kind: 'kyu', kyu: 5 },
      katate_ryote_dori: { kind: 'kyu', kyu: 5 },
      mune_dori: { kind: 'kyu', kyu: 5 },
      ushiro_kakae_dori: { kind: 'kyu', kyu: 4 },
      ushiro_eri_dori: { kind: 'kyu', kyu: 4 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 4 },
      yokomen_uchi: { kind: 'kyu', kyu: 4 },
      shomen_uchi: { kind: 'kyu', kyu: 4 },
      shomen_tsuki: { kind: 'kyu', kyu: 4 },
    },
  },
  {
    id: 'kote-mawashi-nikyo',
    label: { en: 'II. Kote-mawashi (nikyo)', de: 'II. Kote-mawashi (nikyo)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 3 },
      ryote_dori: { kind: 'kyu', kyu: 3 },
      katate_ryote_dori: { kind: 'kyu', kyu: 3 },
      mune_dori: { kind: 'kyu', kyu: 3 },
      ushiro_kakae_dori: { kind: 'kyu', kyu: 3 },
      ushiro_eri_dori: { kind: 'kyu', kyu: 3 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 3 },
      yokomen_uchi: { kind: 'kyu', kyu: 3 },
      shomen_uchi: { kind: 'kyu', kyu: 3 },
      shomen_tsuki: { kind: 'kyu', kyu: 3 },
    },
  },
  {
    id: 'kote-hineri-sankyo',
    label: { en: 'III. Kote-hineri (sankyo)', de: 'III. Kote-hineri (sankyo)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 2 },
      ryote_dori: { kind: 'kyu', kyu: 2 },
      katate_ryote_dori: { kind: 'kyu', kyu: 2 },
      mune_dori: { kind: 'kyu', kyu: 2 },
      ushiro_kakae_dori: { kind: 'kyu', kyu: 2 },
      ushiro_eri_dori: { kind: 'kyu', kyu: 2 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 2 },
      yokomen_uchi: { kind: 'kyu', kyu: 2 },
      shomen_uchi: { kind: 'kyu', kyu: 2 },
      shomen_tsuki: { kind: 'kyu', kyu: 2 },
    },
  },
  {
    id: 'tekubi-osae-yonkyo',
    label: { en: 'IV. Tekubi-osae (yonkyo)', de: 'IV. Tekubi-osae (yonkyo)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 1 },
      ryote_dori: { kind: 'kyu', kyu: 1 },
      katate_ryote_dori: { kind: 'kyu', kyu: 1 },
      mune_dori: { kind: 'kyu', kyu: 1 },
      ushiro_kakae_dori: { kind: 'kyu', kyu: 1 },
      ushiro_eri_dori: { kind: 'kyu', kyu: 1 },
      ushiro_katate_dori_kubi_shime: { kind: 'kyu', kyu: 1 },
      yokomen_uchi: { kind: 'kyu', kyu: 1 },
      shomen_uchi: { kind: 'kyu', kyu: 1 },
      shomen_tsuki: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'ude-nobashi',
    label: { en: 'V. Ude-nobashi (gokyo)', de: 'V. Ude-nobashi (gokyo)' },
    cells: {
      katate_dori: { kind: 'kyu', kyu: 1 },
      yokomen_uchi: { kind: 'kyu', kyu: 1 },
    },
  },
  {
    id: 'ude-kime-osae-rokkyo',
    label: { en: 'VI. Ude-kime-osae (rokkyo)', de: 'VI. Ude-kime-osae (rokkyo)' },
    cells: {
      katate_dori: { kind: 'dan', dan: 1 },
      yokomen_uchi: { kind: 'dan', dan: 1 },
      shomen_tsuki: { kind: 'dan', dan: 1 },
    },
  },
  {
    id: 'ude-garami',
    label: { en: 'VII. Ude-garami', de: 'VII. Ude-garami' },
    cells: {
      katate_dori: { kind: 'dan', dan: 1 },
      shomen_uchi: { kind: 'dan', dan: 1 },
      yoko_tsuki_soto: { kind: 'dan', dan: 1 },
    },
  },
];
