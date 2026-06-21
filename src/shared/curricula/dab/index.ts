import type { Curriculum } from '../types';
import { beltRequirements } from './beltRequirements';
import { ATTACK_COLUMNS, KATAME_ROWS, MATRIX_ROWS } from './examMatrixData';
import { DAB_GRADE_ORDER } from './gradeOrder';
import { JO_COLUMNS, JO_ROWS } from './joTechniquesData';
import { SAYA_NO_UCHI_COLUMNS, SAYA_NO_UCHI_ROWS } from './sayaNoUchiData';
import { TANTO_COLUMNS, TANTO_ROWS } from './tantoTechniquesData';

export const dabCurriculum: Curriculum = {
  id: 'dab',
  label: {
    en: 'German Aikido Federation',
    de: 'Deutscher Aikido-Bund',
  },
  shortLabel: 'DAB',
  gradeOrder: DAB_GRADE_ORDER,
  beltRequirements,
  examMatrix: {
    attackColumns: ATTACK_COLUMNS,
    nageRows: MATRIX_ROWS,
    katameRows: KATAME_ROWS,
  },
  advancedPrograms: {
    sayaNoUchi: {
      columns: SAYA_NO_UCHI_COLUMNS,
      rows: SAYA_NO_UCHI_ROWS,
    },
    jo: {
      columns: JO_COLUMNS,
      rows: JO_ROWS,
    },
    tanto: {
      columns: TANTO_COLUMNS,
      rows: TANTO_ROWS,
    },
  },
};

export { DAB_GRADE_ORDER };
