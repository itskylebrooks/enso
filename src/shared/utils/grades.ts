import type { Grade } from '../types';
import { DAB_GRADE_ORDER } from '../curricula/dab';

export const gradeOrder: Grade[] = DAB_GRADE_ORDER;

export {
  gradeLabel,
  gradeColor,
  gradeTextColor,
  gradePalette,
  getGradeStyle,
} from '../styles/belts';
