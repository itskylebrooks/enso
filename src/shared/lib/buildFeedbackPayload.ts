import type { FeedbackPayloadV1 } from '../types/feedback';

export type NewTechniqueFormState = {
  // minimal subset of fields used for the serializer
  contributorName?: string | null;
  contributorEmail?: string | null;
  name?: { en?: string | null; de?: string | null };
  summary?: { en?: string | null; de?: string | null };
  levelHint?: { en?: string | null; de?: string | null };
  steps?: { en?: string[] | null; de?: string[] | null };
  uke?: {
    role?: { en?: string | null; de?: string | null } | null;
    notes?: { en?: string[] | null; de?: string[] | null } | null;
  };
  keyPoints?: { en?: string[] | null; de?: string[] | null } | null;
  commonMistakes?: { en?: string[] | null; de?: string[] | null } | null;
  jpName?: string | null;
  taxonomy?: {
    attack?: string | null;
    category?: string | null;
    weapon?: string | null;
    entries?: string[] | null;
    hanmi?: string | null;
  } | null;
  mediaUrls?: string[] | null;
  sources?: string | null;
  creditName?: string | null;
  trainerCredit?: string | null;
  markAsBase?: boolean | null;
  consent?: boolean | null;
  honeypot?: string | null;
  // UI-specific compiled preview
  detailsPreviewMd?: string | null;
};

const sanitize = (s?: string | null) => {
  const t = (s ?? '').trim();
  return t === '' ? 'EMPTY' : t;
};

const sanitizeArr = (arr?: (string | null)[] | null) => {
  const out = (arr ?? []).map((s) => sanitize(s as string));
  return out.length ? out : ['EMPTY'];
};

export function buildFeedbackPayloadV1(
  form: NewTechniqueFormState,
  opts: { locale: 'en' | 'de'; entityId?: string },
): FeedbackPayloadV1 {
  const { locale, entityId } = opts;

  const nameVal = sanitize(form.contributorName ?? '');
  const payloadName = nameVal === 'EMPTY' ? 'Anonymous' : (form.contributorName ?? '').trim();

  const stepsEn = form.steps?.en ?? [];
  const stepsDe = form.steps?.de ?? [];

  const diffJson = {
    name: {
      en: sanitize(form.name?.en ?? ''),
      de: sanitize(form.name?.de ?? ''),
    },
    summary: {
      en: sanitize(form.summary?.en ?? ''),
      de: sanitize(form.summary?.de ?? ''),
    },
    levelHint: {
      en: sanitize(form.levelHint?.en ?? ''),
      de: sanitize(form.levelHint?.de ?? ''),
    },
    steps: {
      en: sanitizeArr(stepsEn as string[]),
      de: sanitizeArr(stepsDe as string[]),
    },
    uke: {
      role: {
        en: sanitize(form.uke?.role?.en ?? ''),
        de: sanitize(form.uke?.role?.de ?? ''),
      },
      notes: {
        en: sanitizeArr(form.uke?.notes?.en ?? []),
        de: sanitizeArr(form.uke?.notes?.de ?? []),
      },
    },
    keyPoints: {
      en: sanitizeArr(form.keyPoints?.en ?? []),
      de: sanitizeArr(form.keyPoints?.de ?? []),
    },
    commonMistakes: {
      en: sanitizeArr(form.commonMistakes?.en ?? []),
      de: sanitizeArr(form.commonMistakes?.de ?? []),
    },
    jpName: sanitize(form.jpName ?? ''),
    taxonomy: {
      attack: sanitize(form.taxonomy?.attack ?? ''),
      category: sanitize(form.taxonomy?.category ?? ''),
      weapon: sanitize(form.taxonomy?.weapon ?? ''),
      entries: sanitizeArr(form.taxonomy?.entries ?? []),
      hanmi: sanitize(form.taxonomy?.hanmi ?? ''),
    },
    media: (form.mediaUrls ?? []).map((s) => (s ?? '').trim()).filter(Boolean).length
      ? sanitizeArr(form.mediaUrls ?? [])
      : undefined,
    sources: sanitize(form.sources ?? ''),
    creditName: sanitize(form.creditName ?? ''),
    trainerCredit: sanitize(form.trainerCredit ?? ''),
    markAsBase: !!form.markAsBase,
    consent: !!form.consent,
  };

  const payload: FeedbackPayloadV1 = {
    name: payloadName,
    email: form.contributorEmail?.trim() || undefined,
    category: 'new-technique',
    entityType: 'technique',
    entityId: entityId ? entityId : undefined,
    locale: locale === 'de' ? 'de' : 'en',
    summary: sanitize((locale === 'de' ? form.summary?.de : form.summary?.en) ?? ''),
    detailsMd: form.detailsPreviewMd ?? '',
    diffJson,
    media: (form.mediaUrls ?? []).map((s) => (s ?? '').trim()).filter(Boolean).length
      ? sanitizeArr(form.mediaUrls ?? [])
      : undefined,
    honeypot: form.honeypot ?? '',
  };

  return payload;
}
