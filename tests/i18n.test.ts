import { describe, expect, it } from 'vitest';
import { getCopy } from '../src/shared/constants/i18n';

describe('UI i18n navigation labels', () => {
  it('uses required EN navigation labels', () => {
    const copy = getCopy('en');
    expect(copy.guideLink).toBe('Guide');
    expect(copy.library).toBe('Techniques');
    expect(copy.glossary).toBe('Terms');
    expect(copy.practice).toBe('Exercises');
  });

  it('uses required DE navigation labels', () => {
    const copy = getCopy('de');
    expect(copy.guideLink).toBe('Guide');
    expect(copy.library).toBe('Techniken');
    expect(copy.glossary).toBe('Begriffe');
    expect(copy.practice).toBe('Übungen');
  });
});
