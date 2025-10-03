import type { SayaNoUchiColumn, SayaNoUchiRow } from '../types/exam';

// Column definitions for Saya no Uchi program
export const SAYA_NO_UCHI_COLUMNS: SayaNoUchiColumn[] = [
  // Tachi Waza section
  { 
    key: 'katate_dori_ai_hanmi', 
    label: { en: 'Katate-dori Ai-hanmi', de: 'Katate-dori Ai-hanmi' },
    section: 'tachi_waza'
  },
  { 
    key: 'katate_dori_gyaku_hanmi', 
    label: { en: 'Katate-dori Gyaku-hanmi', de: 'Katate-dori Gyaku-hanmi' },
    section: 'tachi_waza'
  },
  { 
    key: 'kata_dori', 
    label: { en: 'Kata-dori', de: 'Kata-dori' },
    section: 'tachi_waza'
  },
  { 
    key: 'ushiro_ryokata_dori', 
    label: { en: 'Ushiro-ryōkata-dori', de: 'Ushiro-ryōkata-dori' },
    section: 'tachi_waza'
  },
  { 
    key: 'ushiro_ryote_dori', 
    label: { en: 'Ushiro-ryōte-dori', de: 'Ushiro-ryōte-dori' },
    section: 'tachi_waza'
  },
  { 
    key: 'ushiro_eri_dori', 
    label: { en: 'Ushiro-eri-dori', de: 'Ushiro-eri-dori' },
    section: 'tachi_waza'
  },
  // Hanmi Hantachi section
  { 
    key: 'hanmi_hantachi_katate_dori_gyaku_hanmi', 
    label: { en: 'Katate-dori Gyaku-hanmi', de: 'Katate-dori Gyaku-hanmi' },
    section: 'hanmi_hantachi'
  },
  // Buki Waza section
  { 
    key: 'ken_tai_jo_saya_no_uchi', 
    label: { en: 'Ken Tai Jo Saya-no-Uchi', de: 'Ken Tai Jo Saya-no-Uchi' },
    section: 'buki_waza'
  },
];

// Row definitions for Saya no Uchi program
export const SAYA_NO_UCHI_ROWS: SayaNoUchiRow[] = [
  {
    id: 'shiho-nage',
    label: { en: 'Shiho-nage', de: 'Shiho-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'irimi-nage',
    label: { en: 'Irimi-nage', de: 'Irimi-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'kote-gaeshi',
    label: { en: 'Kote-gaeshi', de: 'Kote-gaeshi' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'kokyu-nage-naname',
    label: { en: 'Kokyu-nage (Naname)', de: 'Kokyu-nage (Naname)' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'check' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'kokyu-nage',
    label: { en: 'Kokyu-nage', de: 'Kokyu-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'check' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'check' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'check' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
  {
    id: 'koshi-nage',
    label: { en: 'Koshi-nage', de: 'Koshi-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'kaiten-nage-uchi-soto',
    label: { en: 'Kaiten-nage (Uchi & Soto)', de: 'Kaiten-nage (Uchi & Soto)' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'check' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'harai-kiri',
    label: { en: 'Harai-kiri', de: 'Harai-kiri' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'check' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'harai-tsuki',
    label: { en: 'Harai-tsuki', de: 'Harai-tsuki' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
  {
    id: 'harai-nage',
    label: { en: 'Harai-nage', de: 'Harai-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
  {
    id: 'ashi-barai',
    label: { en: 'Ashi-barai', de: 'Ashi-barai' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'check' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'ude-kime-nage',
    label: { en: 'Ude-kime-nage', de: 'Ude-kime-nage' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'check' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'sumi-otoshi',
    label: { en: 'Sumi-otoshi', de: 'Sumi-otoshi' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'check' },
      kata_dori: { kind: 'check' },
      ushiro_ryokata_dori: { kind: 'empty' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'check' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
  {
    id: 'kubi-garami',
    label: { en: 'Kubi-garami', de: 'Kubi-garami' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'empty' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'ude-osae-ikkyo',
    label: { en: 'Ude-osae (Ikkyo)', de: 'Ude-osae (Ikkyo)' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'empty' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'check' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
  {
    id: 'kote-hineri-sankyo',
    label: { en: 'Kote-hineri (Sankyo)', de: 'Kote-hineri (Sankyo)' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'check' },
      ushiro_eri_dori: { kind: 'empty' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'empty' },
      ken_tai_jo_saya_no_uchi: { kind: 'empty' },
    },
  },
  {
    id: 'kote-mawashi-nikyo',
    label: { en: 'Kote-mawashi (Nikyo)', de: 'Kote-mawashi (Nikyo)' },
    cells: {
      katate_dori_ai_hanmi: { kind: 'check' },
      katate_dori_gyaku_hanmi: { kind: 'empty' },
      kata_dori: { kind: 'empty' },
      ushiro_ryokata_dori: { kind: 'check' },
      ushiro_ryote_dori: { kind: 'check' },
      ushiro_eri_dori: { kind: 'check' },
      hanmi_hantachi_katate_dori_gyaku_hanmi: { kind: 'check' },
      ken_tai_jo_saya_no_uchi: { kind: 'check' },
    },
  },
];
