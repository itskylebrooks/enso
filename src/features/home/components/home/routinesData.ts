import type { GuideRoutine, Localized, Locale } from '@shared/types';

export type RoutineExercisePlan = {
  slug: string;
  duration: Localized<string>;
  cue?: Localized<string>;
};

export type RoutinePreset = {
  id: string;
  title: Localized<string>;
  description: Localized<string>;
  estimatedMinutes: number;
  exercises: RoutineExercisePlan[];
};

export type RoutineCollection = {
  presets: RoutinePreset[];
};

export const routineCollections: Record<GuideRoutine, RoutineCollection> = {
  'warm-up': {
    presets: [
      {
        id: 'dojo-arrival-flow',
        title: { en: 'Dojo arrival flow', de: 'Dojo-Arrival-Flow' },
        description: {
          en: 'Joint prep and directional footwork before partner work.',
          de: 'Gelenkvorbereitung und Richtungsfussarbeit vor Partnerarbeit.',
        },
        estimatedMinutes: 12,
        exercises: [
          {
            slug: 'wrist-circles',
            duration: { en: '90 sec', de: '90 Sek.' },
          },
          {
            slug: 'hip-figure-eights',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'shoulder-thread-flow',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'ankle-knee-line-rocks',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'tenkan-pivot-balance',
            duration: { en: '4 min', de: '4 Min.' },
          },
        ],
      },
      {
        id: 'entry-readiness-sequence',
        title: { en: 'Entry readiness sequence', de: 'Entry-Readiness-Sequenz' },
        description: {
          en: 'Raise heat and posture quality for committed irimi entries.',
          de: 'Erhoeht Aktivierung und Haltungsqualitaet fuer entschlossene irimi-Eintritte.',
        },
        estimatedMinutes: 15,
        exercises: [
          {
            slug: 'split-stance-hold',
            duration: { en: '2 x 25 sec each side', de: '2 x 25 Sek. je Seite' },
          },
          {
            slug: 'cross-body-steps',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'line-walk-pause-turn',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'irimi-step-drive',
            duration: { en: '3 sets of 6 reps each side', de: '3 Saetze mit 6 Wdh. je Seite' },
          },
        ],
      },
    ],
  },
  cooldown: {
    presets: [
      {
        id: 'post-class-reset',
        title: { en: 'Post-class reset', de: 'Post-Training-Reset' },
        description: {
          en: 'Bring breath and heart rate down while keeping joints moving.',
          de: 'Bringt Atem und Puls herunter und haelt die Gelenke in Bewegung.',
        },
        estimatedMinutes: 10,
        exercises: [
          {
            slug: 'box-breathing',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'extended-exhale-reset',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'nasal-walkdown-breath',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'hip-figure-eights',
            duration: { en: '2 min', de: '2 Min.' },
          },
        ],
      },
      {
        id: 'joint-release-downshift',
        title: { en: 'Joint release downshift', de: 'Gelenk-Release-Downshift' },
        description: {
          en: 'Light release flow to leave the mat with relaxed structure.',
          de: 'Leichter Release-Flow, um mit entspannter Struktur von der Matte zu gehen.',
        },
        estimatedMinutes: 14,
        exercises: [
          {
            slug: 'wrist-circles',
            duration: { en: '90 sec', de: '90 Sek.' },
          },
          {
            slug: 'shoulder-thread-flow',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'ankle-knee-line-rocks',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'extended-exhale-reset',
            duration: { en: '4 min', de: '4 Min.' },
          },
        ],
      },
    ],
  },
  mobility: {
    presets: [
      {
        id: 'rotation-foundation',
        title: { en: 'Rotation foundation', de: 'Rotations-Basis' },
        description: {
          en: 'Longer mobility work for hips, ankles, and shoulder spirals.',
          de: 'Laengere Mobilitaetsarbeit fuer Hueften, Sprunggelenke und Schultern.',
        },
        estimatedMinutes: 20,
        exercises: [
          {
            slug: 'wrist-circles',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'hip-figure-eights',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'shoulder-thread-flow',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'ankle-knee-line-rocks',
            duration: { en: '4 min', de: '4 Min.' },
          },
          {
            slug: 'tenkan-pivot-balance',
            duration: { en: '4 min', de: '4 Min.' },
          },
        ],
      },
      {
        id: 'mat-mobility-restore',
        title: { en: 'Mat mobility restore', de: 'Matten-Mobility-Restore' },
        description: {
          en: 'Restore range and control after dense technical sessions.',
          de: 'Stellt Bewegungsumfang und Kontrolle nach dichten Technik-Einheiten wieder her.',
        },
        estimatedMinutes: 18,
        exercises: [
          {
            slug: 'seiza-knee-hover',
            duration: { en: '3 sets of 6 reps', de: '3 Saetze mit 6 Wdh.' },
          },
          {
            slug: 'hip-figure-eights',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'line-walk-pause-turn',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'shoulder-thread-flow',
            duration: { en: '3 min', de: '3 Min.' },
          },
        ],
      },
    ],
  },
  strength: {
    presets: [
      {
        id: 'center-posture-builder',
        title: { en: 'Center posture builder', de: 'Zentrum-Haltungs-Builder' },
        description: {
          en: 'Connected strength through stance, trunk, and shoulder line.',
          de: 'Verbundene Kraft durch Stand, Rumpf und Schulterlinie.',
        },
        estimatedMinutes: 22,
        exercises: [
          {
            slug: 'band-kokyu-pulls',
            duration: { en: '3 sets of 10 reps', de: '3 Saetze mit 10 Wdh.' },
          },
          {
            slug: 'hanmi-wall-press',
            duration: { en: '3 x 20 sec each side', de: '3 x 20 Sek. je Seite' },
          },
          {
            slug: 'split-stance-hold',
            duration: { en: '3 x 25 sec each side', de: '3 x 25 Sek. je Seite' },
          },
          {
            slug: 'side-plank-knee-drive',
            duration: { en: '2 sets of 8 reps each side', de: '2 Saetze mit 8 Wdh. je Seite' },
          },
          {
            slug: 'seiza-knee-hover',
            duration: { en: '2 sets of 6 reps', de: '2 Saetze mit 6 Wdh.' },
          },
        ],
      },
      {
        id: 'leg-drive-structure',
        title: { en: 'Leg drive structure', de: 'Beinantrieb-Struktur' },
        description: {
          en: 'Lower-body capacity for entering with control, not collapse.',
          de: 'Unterkoerperkapazitaet fuer kontrolliertes Eintreten statt Einknicken.',
        },
        estimatedMinutes: 20,
        exercises: [
          {
            slug: 'split-stance-hold',
            duration: { en: '2 x 25 sec each side', de: '2 x 25 Sek. je Seite' },
          },
          {
            slug: 'hanmi-wall-press',
            duration: { en: '2 x 20 sec each side', de: '2 x 20 Sek. je Seite' },
          },
          {
            slug: 'squat-hops',
            duration: { en: '3 sets of 6 reps', de: '3 Saetze mit 6 Wdh.' },
          },
          {
            slug: 'irimi-step-drive',
            duration: { en: '3 sets of 8 reps each side', de: '3 Saetze mit 8 Wdh. je Seite' },
          },
        ],
      },
    ],
  },
  skill: {
    presets: [
      {
        id: 'tai-sabaki-quality',
        title: { en: 'Tai sabaki quality', de: 'Tai-Sabaki-Qualitaet' },
        description: {
          en: 'Movement quality block for clean lines and timing.',
          de: 'Bewegungsqualitaets-Block fuer saubere Linien und Timing.',
        },
        estimatedMinutes: 16,
        exercises: [
          {
            slug: 'tenkan-pivot-balance',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'four-corner-irimi-tenkan',
            duration: { en: '3 min each direction', de: '3 Min. je Richtung' },
          },
          {
            slug: 'cross-body-steps',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'line-walk-pause-turn',
            duration: { en: '3 min', de: '3 Min.' },
          },
        ],
      },
      {
        id: 'weapon-hand-transition',
        title: { en: 'Weapon-hand transition', de: 'Waffen-Hand-Transition' },
        description: {
          en: 'Coordination sequence to clean up grip and directional exchange.',
          de: 'Koordinationssequenz fuer sauberen Griff- und Richtungswechsel.',
        },
        estimatedMinutes: 18,
        exercises: [
          {
            slug: 'jo-grip-switches',
            duration: { en: '3 sets of 60 sec', de: '3 Saetze mit 60 Sek.' },
          },
          {
            slug: 'single-leg-stance',
            duration: { en: '2 x 30 sec each side', de: '2 x 30 Sek. je Seite' },
          },
          {
            slug: 'tenkan-burst-step',
            duration: { en: '3 sets of 6 reps each side', de: '3 Saetze mit 6 Wdh. je Seite' },
          },
          {
            slug: 'irimi-step-drive',
            duration: { en: '2 sets of 6 reps each side', de: '2 Saetze mit 6 Wdh. je Seite' },
          },
        ],
      },
    ],
  },
  recovery: {
    presets: [
      {
        id: 'evening-downshift',
        title: { en: 'Evening downshift', de: 'Abend-Downshift' },
        description: {
          en: 'Reset breath and tone after long training days.',
          de: 'Setzt Atmung und Grundspannung nach langen Trainingstagen zurueck.',
        },
        estimatedMinutes: 12,
        exercises: [
          {
            slug: 'box-breathing',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'extended-exhale-reset',
            duration: { en: '4 min', de: '4 Min.' },
          },
          {
            slug: 'nasal-walkdown-breath',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'hip-figure-eights',
            duration: { en: '2 min', de: '2 Min.' },
          },
        ],
      },
      {
        id: 'breath-and-center-reset',
        title: { en: 'Breath and center reset', de: 'Atem-und-Zentrum-Reset' },
        description: {
          en: 'Low-load session to recover while reinforcing center awareness.',
          de: 'Niedrig belastende Einheit zur Erholung bei gleichzeitigem Zentrum-Fokus.',
        },
        estimatedMinutes: 15,
        exercises: [
          {
            slug: 'seiza-knee-hover',
            duration: { en: '2 sets of 5 reps', de: '2 Saetze mit 5 Wdh.' },
          },
          {
            slug: 'wrist-circles',
            duration: { en: '2 min', de: '2 Min.' },
          },
          {
            slug: 'box-breathing',
            duration: { en: '3 min', de: '3 Min.' },
          },
          {
            slug: 'extended-exhale-reset',
            duration: { en: '4 min', de: '4 Min.' },
          },
        ],
      },
    ],
  },
};

export const getLocalized = <T>(value: Localized<T>, locale: Locale): T => value[locale] ?? value.en;

