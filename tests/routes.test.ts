import { describe, expect, it } from 'vitest';
import {
  buildTechniqueUrl,
  buildTechniqueUrlWithVariant,
  parseTechniquePath,
  parseTechniqueVariantParams,
} from '../src/shared/constants/urls';

describe('technique route helpers', () => {
  it('builds canonical technique detail URLs under /techniques', () => {
    expect(buildTechniqueUrl('katate-tori-irimi-nage')).toBe('/techniques/katate-tori-irimi-nage');
  });

  it('parses canonical and legacy paths', () => {
    expect(parseTechniquePath('/techniques/katate-tori-irimi-nage')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: undefined,
      entry: undefined,
    });

    expect(parseTechniquePath('/library/katate-tori-irimi-nage')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: undefined,
      entry: undefined,
    });

    expect(parseTechniquePath('/technique/katate-tori-irimi-nage/alfred-haase/irimi')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: 'alfred-haase',
      entry: 'irimi',
    });
  });

  it('encodes and parses variant state via query params', () => {
    const url = buildTechniqueUrlWithVariant('katate-tori-irimi-nage', {
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: 'v-base',
    });

    const parsed = new URL(url, 'https://enso.local');
    expect(parsed.pathname).toBe('/techniques/katate-tori-irimi-nage');

    expect(parseTechniqueVariantParams(parsed.pathname, parsed.search)).toEqual({
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: null,
    });
  });
});
