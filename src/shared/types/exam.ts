export type AttackKey =
  | 'katate_tori'
  | 'ryote_tori'
  | 'katate_ryote_tori'
  | 'mune_tori'
  | 'yoko_kubi_shime'
  | 'ushiro_ryokata_tori'
  | 'ushiro_kakae_tori'
  | 'ushiro_ryote_tori'
  | 'ushiro_eri_tori'
  | 'ushiro_katate_tori_kubi_shime'
  | 'ushiro_kubi_shime'
  | 'yokomen_uchi'
  | 'shomen_uchi'
  | 'shomen_tsuki'
  | 'yoko_tsuki_soto';

export type GradeCell =
  | { kind: 'kyu'; kyu: 5 | 4 | 3 | 2 | 1 }       // shows 5, 4, 3, 2, 1
  | { kind: 'dan'; dan: 1 }                        // shows '1.D.'
  | { kind: 'count'; value: 1 | 2 | 3 | 4 }        // cyan count cells
  | { kind: 'dot' }                                // small brown dot
  | { kind: 'empty' };                             // empty cell

export type MatrixRow = {
  id: string;                                      // slug for technique
  label: { en: string; de: string };               // row header text
  cells: Partial<Record<AttackKey, GradeCell>>;
};

export type AttackColumn = {
  key: AttackKey;
  label: { en: string; de: string };
  short?: string;                                  // optional short label for mobile
};

// Saya no Uchi Program types
export type SayaNoUchiAttackKey =
  | 'katate_tori_ai_hanmi'
  | 'katate_tori_gyaku_hanmi'
  | 'kata_tori'
  | 'ushiro_ryokata_tori'
  | 'ushiro_ryote_tori'
  | 'ushiro_eri_tori'
  | 'hanmi_hantachi_katate_tori_gyaku_hanmi'
  | 'ken_tai_jo_saya_no_uchi';

export type SayaNoUchiSection = 'tachi_waza' | 'hanmi_hantachi' | 'buki_waza';

export type SayaNoUchiCell =
  | { kind: 'check' }                              // checkmark icon
  | { kind: 'empty' };                             // empty cell

export type SayaNoUchiRow = {
  id: string;                                      // slug for technique
  label: { en: string; de: string };               // row header text
  cells: Record<SayaNoUchiAttackKey, SayaNoUchiCell>;
};

export type SayaNoUchiColumn = {
  key: SayaNoUchiAttackKey;
  label: { en: string; de: string };
  section: SayaNoUchiSection;
};

// Jo Techniques Program types
export type JoAttackKey =
  | 'jo_ryote_tori_double'
  | 'jo_ryote_tori_gyaku'
  | 'jo_katate_tori'
  | 'jo_katate_ryote_tori'
  | 'jo_tsuki'
  | 'jo_yokomen_uchi'
  | 'jo_shomen_uchi'
  | 'jo_morote_awase_tsuki';

export type JoSection = 'jo_nage_waza' | 'jo_tori';

export type JoCell =
  | { kind: 'check' }                              // checkmark icon
  | { kind: 'empty' };                             // empty cell

export type JoRow = {
  id: string;                                      // slug for technique
  label: { en: string; de: string };               // row header text
  cells: Record<JoAttackKey, JoCell>;
};

export type JoColumn = {
  key: JoAttackKey;
  label: { en: string; de: string };
  section: JoSection;
};

// Tantō Techniques Program types
export type TantoAttackKey =
  | 'tanto_tsuki'
  | 'tanto_shomen_uchi'
  | 'tanto_yokomen_uchi'
  | 'tanto_yokomen_soto'
  | 'tanto_yoko_tsuki_soto'
  | 'tanto_yoko_tsuki_uchi'
  | 'mune_tori_tanto_yokomen_uchi'
  | 'sode_tori_tanto_yoko_tsuki_soto';

export type TantoCell =
  | { kind: 'check' }                              // checkmark icon
  | { kind: 'empty' };                             // empty cell

export type TantoRow = {
  id: string;                                      // slug for technique
  label: { en: string; de: string };               // row header text
  cells: Record<TantoAttackKey, TantoCell>;
};

export type TantoColumn = {
  key: TantoAttackKey;
  label: { en: string; de: string };
};
