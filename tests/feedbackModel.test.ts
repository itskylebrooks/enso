import { describe, expect, it } from 'vitest';
import { FeedbackSubmissionSchema } from '@shared/schemas/feedback';
import {
  applyInitialContext,
  buildFeedbackSubmission,
  createFeedbackDraft,
  migrateLegacyDraft,
  parseFeedbackDraft,
} from '@features/home/components/feedback/feedbackModel';

describe('feedback V2 model', () => {
  it('builds a minimal content contribution without EMPTY placeholders', () => {
    const draft = createFeedbackDraft();
    draft.flow = 'content';
    draft.content.contentType = 'technique';
    draft.content.mode = 'edit';
    draft.content.entityId = 'katate-tori-ikkyo';
    draft.content.details = 'The second step should mention keeping the elbow relaxed.';
    draft.content.consent = true;

    const payload = buildFeedbackSubmission(draft, 'en');

    expect(payload).toMatchObject({
      version: 2,
      kind: 'content',
      target: {
        entityType: 'technique',
        mode: 'edit',
        entityId: 'katate-tori-ikkyo',
      },
      consent: true,
    });
    expect(payload && 'structured' in payload ? payload.structured : undefined).toBeUndefined();
    expect(FeedbackSubmissionSchema.safeParse(payload).success).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('EMPTY');
  });

  it('carries the selected technique variant when supplied by page context', () => {
    const draft = applyInitialContext(createFeedbackDraft(), {
      flow: 'content',
      contentType: 'technique',
      mode: 'edit',
      entityId: 'shiho-nage',
      variantKey: {
        hanmi: 'gyaku-hanmi',
        direction: 'ura',
        weapon: 'bokken',
        versionId: 'trainer-a',
      },
    });
    draft.content.details = 'This version uses a shorter entry.';
    draft.content.consent = true;

    expect(buildFeedbackSubmission(draft, 'de')).toMatchObject({
      kind: 'content',
      target: {
        entityId: 'shiho-nage',
        variantKey: {
          hanmi: 'gyaku-hanmi',
          direction: 'ura',
          weapon: 'bokken',
          versionId: 'trainer-a',
        },
      },
    });
  });

  it('builds a structured routine proposal with an ordered exercise plan', () => {
    const draft = applyInitialContext(createFeedbackDraft(), {
      flow: 'content',
      contentType: 'routine',
      mode: 'new',
      entityId: 'warm-up',
    });
    draft.content.contentName = 'Short arrival flow';
    draft.content.details = 'A compact warm-up for classes with limited time.';
    draft.content.estimatedMinutes = '8';
    draft.content.routineExercises = [
      'wrist-circles — 90 sec',
      'tenkan-pivot-balance — 4 min — keep the head level',
    ];
    draft.content.consent = true;

    const payload = buildFeedbackSubmission(draft, 'en');

    expect(payload).toMatchObject({
      kind: 'content',
      target: { entityType: 'routine', mode: 'new' },
      structured: {
        contentName: 'Short arrival flow',
        routineCategory: 'warm-up',
        estimatedMinutes: 8,
        routineExercises: [
          'wrist-circles — 90 sec',
          'tenkan-pivot-balance — 4 min — keep the head level',
        ],
      },
    });
    expect(FeedbackSubmissionSchema.safeParse(payload).success).toBe(true);
  });

  it('migrates the useful parts of a legacy app-feedback draft', () => {
    const migrated = migrateLegacyDraft({
      selectedType: 'appFeedback',
      appFeedback: {
        area: 'library',
        feedback: 'Keep filters visible when returning from a technique.',
        screenshotUrl: 'https://example.com/screenshot.png',
      },
    });

    expect(migrated).toMatchObject({
      version: 2,
      flow: 'idea',
      idea: {
        area: 'library',
        details: 'Keep filters visible when returning from a technique.',
        mediaUrl: 'https://example.com/screenshot.png',
      },
    });
  });

  it('keeps app and bug feedback anonymous even when a content draft has a credit name', () => {
    const draft = createFeedbackDraft();
    draft.content.contributorName = 'Saved contributor';
    draft.flow = 'idea';
    draft.idea.details = 'A small navigation improvement.';

    expect(buildFeedbackSubmission(draft, 'en')).toMatchObject({
      kind: 'idea',
      name: 'Anonymous',
    });
  });

  it('sanitizes malformed saved drafts instead of trusting their shape', () => {
    const parsed = parseFeedbackDraft({
      version: 2,
      flow: 'not-a-flow',
      content: { contentType: 'not-content', steps: [1, 'valid'] },
    });

    expect(parsed.flow).toBeNull();
    expect(parsed.content.contentType).toBe('technique');
    expect(parsed.content.steps).toEqual(['valid']);
  });

  it('rejects legacy and unrecognized API payloads', () => {
    expect(
      FeedbackSubmissionSchema.safeParse({
        name: 'Anonymous',
        category: 'suggestion',
        entityType: 'exams',
        summary: 'Old payload',
        detailsMd: 'Old details',
        diffJson: {},
      }).success,
    ).toBe(false);
  });
});
