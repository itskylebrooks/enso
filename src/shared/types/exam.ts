export type AttackKey =
  | 'katate_dori'
  | 'ryote_dori'
  | 'katate_ryote_dori'
  | 'mune_dori'
  | 'yoko_kubi_shime'
  | 'ushiro_ryokata_dori'
  | 'ushiro_kakae_dori'
  | 'ushiro_ryote_dori'
  | 'ushiro_eri_dori'
  | 'ushiro_katate_dori_kubi_shime'
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
  | 'katate_dori_ai_hanmi'
  | 'katate_dori_gyaku_hanmi'
  | 'kata_dori'
  | 'ushiro_ryokata_dori'
  | 'ushiro_ryote_dori'
  | 'ushiro_eri_dori'
  | 'hanmi_hantachi_katate_dori_gyaku_hanmi'
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
  | 'jo_ryote_dori_double'
  | 'jo_ryote_dori_gyaku'
  | 'jo_katate_dori'
  | 'jo_katate_ryote_dori'
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
  | 'mune_dori_tanto_yokomen_uchi'
  | 'sode_dori_tanto_yoko_tsuki_soto';

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
