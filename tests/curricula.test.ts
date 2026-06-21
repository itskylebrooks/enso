import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CURRICULUM_ID,
  dabCurriculum,
  getCurriculum,
  getDefaultCurriculum,
} from '../src/shared/curricula';
import { gradeOrder } from '../src/shared/utils/grades';

describe('curriculum registry', () => {
  it('uses DAB as the default curriculum', () => {
    expect(DEFAULT_CURRICULUM_ID).toBe('dab');
    expect(getDefaultCurriculum()).toBe(dabCurriculum);
  });

  it('returns DAB metadata and data from the registry', () => {
    const curriculum = getCurriculum('dab');

    expect(curriculum.id).toBe('dab');
    expect(curriculum.shortLabel).toBe('DAB');
    expect(curriculum.label.en).toBe('German Aikido Federation');
    expect(curriculum.label.de).toBe('Deutscher Aikido-Bund');
  });

  it('keeps the exported grade order aligned with the DAB curriculum', () => {
    expect(getCurriculum('dab').gradeOrder).toEqual(gradeOrder);
    expect(getCurriculum('dab').gradeOrder).toEqual([
      'kyu5',
      'kyu4',
      'kyu3',
      'kyu2',
      'kyu1',
      'dan1',
      'dan2',
      'dan3',
      'dan4',
      'dan5',
    ]);
  });

  it('contains DAB belt requirements for key grades', () => {
    const { beltRequirements } = getCurriculum('dab');

    expect(beltRequirements.kyu5.termSlugs).toContain('rei');
    expect(beltRequirements.dan1.termSlugs).toContain('seika-tanden');
    expect(beltRequirements.dan5.examFocus.en.length).toBeGreaterThan(0);
  });

  it('contains DAB exam matrix and advanced program datasets', () => {
    const { examMatrix, advancedPrograms } = getCurriculum('dab');

    expect(examMatrix.attackColumns.length).toBeGreaterThan(0);
    expect(examMatrix.nageRows.length).toBeGreaterThan(0);
    expect(examMatrix.katameRows.length).toBeGreaterThan(0);
    expect(advancedPrograms.sayaNoUchi.columns.length).toBeGreaterThan(0);
    expect(advancedPrograms.sayaNoUchi.rows.length).toBeGreaterThan(0);
    expect(advancedPrograms.jo.columns.length).toBeGreaterThan(0);
    expect(advancedPrograms.jo.rows.length).toBeGreaterThan(0);
    expect(advancedPrograms.tanto.columns.length).toBeGreaterThan(0);
    expect(advancedPrograms.tanto.rows.length).toBeGreaterThan(0);
  });
});
