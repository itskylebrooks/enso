import { dabCurriculum } from './dab';
import type { Curriculum, CurriculumId } from './types';

export const DEFAULT_CURRICULUM_ID: CurriculumId = 'dab';

export const curricula = {
  dab: dabCurriculum,
} satisfies Record<CurriculumId, Curriculum>;

export const getCurriculum = (id: CurriculumId): Curriculum => curricula[id];

export const getDefaultCurriculum = (): Curriculum => getCurriculum(DEFAULT_CURRICULUM_ID);

export { dabCurriculum };
export type { BeltRequirement, Curriculum, CurriculumId } from './types';
