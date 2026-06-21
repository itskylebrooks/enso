import type { Grade, Localized } from '@shared/types';
import type {
  AttackColumn,
  JoColumn,
  JoRow,
  MatrixRow,
  SayaNoUchiColumn,
  SayaNoUchiRow,
  TantoColumn,
  TantoRow,
} from '@shared/types/exam';

export type CurriculumId = 'dab';

export type BeltRequirement = {
  termSlugs: string[];
  basics: Localized<string[]>;
  examDescription: Localized<string>;
  examFocus: Localized<string[]>;
};

export type Curriculum = {
  id: CurriculumId;
  label: Localized<string>;
  shortLabel: string;
  gradeOrder: Grade[];
  beltRequirements: Record<Grade, BeltRequirement>;
  examMatrix: {
    attackColumns: AttackColumn[];
    nageRows: MatrixRow[];
    katameRows: MatrixRow[];
  };
  advancedPrograms: {
    sayaNoUchi: {
      columns: SayaNoUchiColumn[];
      rows: SayaNoUchiRow[];
    };
    jo: {
      columns: JoColumn[];
      rows: JoRow[];
    };
    tanto: {
      columns: TantoColumn[];
      rows: TantoRow[];
    };
  };
};
