import { describe, expect, it } from 'vitest';
import { getCopy } from '../src/shared/constants/i18n';

describe('UI i18n navigation labels', () => {
  it('uses required EN navigation labels', () => {
    const copy = getCopy('en');
    expect(copy.examsLink).toBe('Exams');
    expect(copy.library).toBe('Library');
    expect(copy.techniques).toBe('Techniques');
    expect(copy.forms).toBe('Forms');
    expect(copy.culture).toBe('Culture');
    expect(copy.glossary).toBe('Terms');
    expect(copy.exercises).toBe('Exercises');
    expect(copy.libraryLanding.techniques).toBeTruthy();
    expect(copy.study).toBe('Study');
    expect(copy.teach).toBe('Teach');
    expect(copy.teachLanding.classPlanner.title).toBeTruthy();
    expect(copy.teachLanding.safetyNotes.title).toBeTruthy();
    expect(copy.teachLanding.ukemiProgression.title).toBeTruthy();
    expect(copy.formsPage.items).toHaveLength(6);
  });

  it('uses required DE navigation labels', () => {
    const copy = getCopy('de');
    expect(copy.examsLink).toBe('Prüfungen');
    expect(copy.library).toBe('Bibliothek');
    expect(copy.techniques).toBe('Techniken');
    expect(copy.forms).toBe('Formen');
    expect(copy.culture).toBe('Kultur');
    expect(copy.glossary).toBe('Begriffe');
    expect(copy.exercises).toBe('Übungen');
    expect(copy.libraryLanding.techniques).toContain('Formen');
    expect(copy.study).toBe('Lernen');
    expect(copy.teach).toBe('Trainer');
    expect(copy.teachLanding.classPlanner.title).toBe('Trainingsplaner');
    expect(copy.teachLanding.safetyNotes.title).toBe('Sicherheitshinweise');
    expect(copy.teachLanding.ukemiProgression.title).toBe('Ukemi-Aufbau');
    expect(copy.teachLanding.attendance.title).toBe('Anwesenheit');
    expect(copy.formsPage.items).toHaveLength(6);
  });

  it('defines onboarding copy for EN and DE', () => {
    const copyEn = getCopy('en');
    const copyDe = getCopy('de');

    expect(copyEn.onboarding.homeCard.title).toBeTruthy();
    expect(copyDe.onboarding.homeCard.title).toBeTruthy();
    expect(copyEn.onboarding.tour.segments['exams-tab'].description).toBeTruthy();
    expect(copyDe.onboarding.tour.segments['exams-tab'].description).toBeTruthy();
    expect(copyEn.onboarding.tour.segments['search-input'].title).toBeTruthy();
    expect(copyDe.onboarding.tour.segments['search-input'].title).toBeTruthy();
  });
});
