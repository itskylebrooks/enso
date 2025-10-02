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
