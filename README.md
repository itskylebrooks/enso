# Enso — Aikidō study companion (v0.9.0)

*A clean, bilingual (EN/DE) catalog of Aikidō techniques with fast search, versions by trainer, and personal study tools.*

> “Your personal Aikidō library and study companion.”

---

#> **Why this shape?** It scales to many trainers and weapon contexts without duplicating whole techniques, and it keeps steps as concise cues rather than long essays.

---

## Adding New Techniques

Techniques are stored as JSON files in `/content/techniques/`. Each file represents one technique with all its possible variations.

### Template Structure

Create a new file: `/content/techniques/your-technique-name.json`

```json
{
  "id": "unique-id-here",
  "slug": "technique-url-slug",
  "name": {
    "en": "English Technique Name",
    "de": "German Technique Name"
  },
  "jp": "日本語名 (Optional romaji)",
  "category": "throw",
  "attack": "katate-dori",
  "level": "5kyu",
  "summary": {
    "en": "Brief English description of what this technique is and its purpose.",
    "de": "Kurze deutsche Beschreibung der Technik und ihres Zwecks."
  },
  "tags": ["alternative-name", "searchable-alias"],
  "versions": [
    {
      "id": "standard",
      "label": "Standard"
    },
    {
      "id": "haase-bsv",
      "label": "Alfred Haase (BSV)",
      "dojo": "BSV Berlin",
      "trainerId": "alfred-haase"
    }
  ],
  "variants": [
    {
      "key": {
        "direction": "irimi",
        "hanmi": "ai",
        "weapon": "empty",
        "versionId": "standard"
      },
      "steps": {
        "en": [
          "Step 1: Enter and blend with partner's energy",
          "Step 2: Establish proper grip and posture",
          "Step 3: Execute the technique",
          "Step 4: Complete with safe ukemi"
        ],
        "de": [
          "Schritt 1: Eintreten und mit Energie verschmelzen",
          "Schritt 2: Richtigen Griff und Haltung etablieren",
          "Schritt 3: Technik ausführen",
          "Schritt 4: Mit sicherem Ukemi abschließen"
        ]
      },
      "keyPoints": {
        "en": [
          "Maintain proper ma-ai (distance)",
          "Keep your center low and stable",
          "Blend rather than oppose"
        ],
        "de": [
          "Richtiges Ma-ai (Abstand) beibehalten",
          "Zentrum tief und stabil halten",
          "Verschmelzen statt widerstehen"
        ]
      },
      "commonMistakes": {
        "en": [
          "Using too much upper body strength",
          "Breaking posture during entry",
          "Losing connection with partner"
        ],
        "de": [
          "Zu viel Oberkörperkraft verwenden",
          "Haltung beim Eintreten verlieren",
          "Verbindung zum Partner verlieren"
        ]
      },
      "context": {
        "en": "This variation is typically practiced from static grab. Focus on smooth entry and maintaining connection throughout.",
        "de": "Diese Variation wird typischerweise aus statischem Griff geübt. Fokus auf fließenden Eintritt und durchgehende Verbindung."
      },
      "uke": {
        "role": {
          "en": "Attack with committed forward energy",
          "de": "Mit entschlossener Vorwärtsenergie angreifen"
        },
        "notes": {
          "en": [
            "Maintain realistic attack energy",
            "Take safe ukemi when thrown"
          ],
          "de": [
            "Realistische Angriffsenergie beibehalten",
            "Sicheres Ukemi beim Wurf nehmen"
          ]
        }
      },
      "media": [
        {
          "type": "youtube",
          "url": "https://www.youtube.com/watch?v=example",
          "title": "Demonstration by [Sensei Name]"
        }
      ]
    }
  ]
}
```

### Field Explanations

#### Core Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (e.g., "irimi-nage-001") |
| `slug` | string | ✅ | URL-friendly name (e.g., "irimi-nage") |
| `name` | Localized | ✅ | Technique name in EN/DE |
| `jp` | string | ❌ | Japanese name (romaji or kanji) |
| `category` | enum | ✅ | One of: `throw`, `control`, `pin`, `other` |
| `attack` | string | ✅ | Attack type (e.g., "katate-dori", "shomen-uchi") |
| `level` | string | ❌ | Belt level for filtering (e.g., "5kyu", "4kyu") |
| `summary` | Localized | ✅ | Brief description of the technique |
| `tags` | string[] | ❌ | Alternative names for search |

#### Versions

The `versions` array catalogs different interpretations of the technique:

```json
"versions": [
  {
    "id": "standard",          // Always include "standard"
    "label": "Standard"
  },
  {
    "id": "haase-bsv",        // Trainer-specific version
    "label": "Alfred Haase (BSV)",
    "dojo": "BSV Berlin",     // Optional: dojo affiliation
    "trainerId": "alfred-haase" // Optional: links to trainer profile
  }
]
```

**First version must be "standard"** — this is the default shown to users.

#### Variant Keys

Each variant has a `key` that defines its specific combination:

##### **Direction** (required)
- `irimi` — Entering movement
- `tenkan` — Turning movement
- `omote` — Front/outside variation
- `ura` — Back/inside variation

##### **Hanmi** (required)
- `ai` — Ai-hanmi (same stance)
- `gyaku` — Gyaku-hanmi (opposite stance)

##### **Weapon** (required)
- `empty` — Empty-handed (no weapon)
- `bokken` — Wooden sword
- `jo` — Staff
- `tanto` — Knife

##### **Version** (optional)
- `"standard"` or `null` — Standard version
- `"haase-bsv"` — Specific trainer's version (must match `versions[].id`)

### Variant Content

Each variant can include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `steps` | Localized<string[]> | ✅ | 4-6 concise step-by-step cues |
| `keyPoints` | Localized<string[]> | ❌ | Important principles to remember |
| `commonMistakes` | Localized<string[]> | ❌ | Things to avoid |
| `context` | Localized<string> | ❌ | When/how to use this variation |
| `uke` | Object | ❌ | Guidance for the attacking partner |
| `media` | Array | ❌ | Video/image references |

### Complete Example: Multiple Variations

```json
{
  "id": "shiho-nage-001",
  "slug": "shiho-nage",
  "name": {
    "en": "Four-Direction Throw",
    "de": "Vier-Richtungen-Wurf"
  },
  "jp": "四方投げ",
  "category": "throw",
  "attack": "katate-dori",
  "level": "5kyu",
  "summary": {
    "en": "A fundamental throw that leads uke's energy in four directions.",
    "de": "Ein fundamentaler Wurf, der Ukes Energie in vier Richtungen führt."
  },
  "tags": ["shiho-nage", "4-direction-throw"],
  "versions": [
    {
      "id": "standard",
      "label": "Standard"
    },
    {
      "id": "haase-bsv",
      "label": "Alfred Haase (BSV)",
      "dojo": "BSV Berlin"
    }
  ],
  "variants": [
    {
      "key": {
        "direction": "omote",
        "hanmi": "ai",
        "weapon": "empty",
        "versionId": "standard"
      },
      "steps": {
        "en": [
          "Receive ai-hanmi katate-dori attack",
          "Step forward while raising partner's arm",
          "Pivot 180° bringing arm overhead",
          "Guide partner down with shiho-nage"
        ],
        "de": [
          "Ai-Hanmi Katate-Dori Angriff empfangen",
          "Vorwärts treten während Partner-Arm angehoben wird",
          "180° drehen und Arm über Kopf führen",
          "Partner mit Shiho-Nage nach unten führen"
        ]
      },
      "keyPoints": {
        "en": [
          "Raise arm smoothly without forcing",
          "Maintain connection throughout pivot",
          "Control descent angle for safety"
        ],
        "de": [
          "Arm sanft ohne Zwang anheben",
          "Verbindung während Drehung beibehalten",
          "Abstiegswinkel für Sicherheit kontrollieren"
        ]
      }
    },
    {
      "key": {
        "direction": "ura",
        "hanmi": "ai",
        "weapon": "empty",
        "versionId": "standard"
      },
      "steps": {
        "en": [
          "Receive ai-hanmi katate-dori attack",
          "Step back and tenkan behind partner",
          "Raise arm while pivoting",
          "Complete with shiho-nage entry"
        ],
        "de": [
          "Ai-Hanmi Katate-Dori Angriff empfangen",
          "Zurücktreten und Tenkan hinter Partner",
          "Arm während Drehung anheben",
          "Mit Shiho-Nage Eintritt abschließen"
        ]
      }
    },
    {
      "key": {
        "direction": "omote",
        "hanmi": "gyaku",
        "weapon": "empty",
        "versionId": "standard"
      },
      "steps": {
        "en": [
          "Receive gyaku-hanmi katate-dori attack",
          "Cross-step and blend with forward energy",
          "Raise and guide arm overhead",
          "Execute throw maintaining control"
        ],
        "de": [
          "Gyaku-Hanmi Katate-Dori Angriff empfangen",
          "Kreuzschritt und mit Vorwärtsenergie verschmelzen",
          "Arm über Kopf anheben und führen",
          "Wurf ausführen und Kontrolle behalten"
        ]
      }
    },
    {
      "key": {
        "direction": "omote",
        "hanmi": "ai",
        "weapon": "bokken",
        "versionId": "standard"
      },
      "steps": {
        "en": [
          "Partner strikes shomen-uchi with bokken",
          "Enter and deflect with your bokken",
          "Control weapon arm and establish shiho-nage grip",
          "Complete technique disarming if needed"
        ],
        "de": [
          "Partner schlägt Shomen-Uchi mit Bokken",
          "Eintreten und mit Bokken abwehren",
          "Waffenarm kontrollieren und Shiho-Nage Griff etablieren",
          "Technik abschließen, bei Bedarf entwaffnen"
        ]
      }
    },
    {
      "key": {
        "direction": "omote",
        "hanmi": "ai",
        "weapon": "empty",
        "versionId": "haase-bsv"
      },
      "steps": {
        "en": [
          "Receive attack with soft hand",
          "Lead with hip rotation rather than arm",
          "Emphasize circular movement",
          "Finish with gentle control"
        ],
        "de": [
          "Angriff mit weicher Hand empfangen",
          "Mit Hüftrotation statt Arm führen",
          "Kreisförmige Bewegung betonen",
          "Mit sanfter Kontrolle abschließen"
        ]
      },
      "keyPoints": {
        "en": [
          "Haase style emphasizes hip-led movement",
          "Less tension in arms and shoulders",
          "Focus on whole-body coordination"
        ],
        "de": [
          "Haase-Stil betont hüftgeführte Bewegung",
          "Weniger Spannung in Armen und Schultern",
          "Fokus auf Ganzkörper-Koordination"
        ]
      }
    }
  ]
}
```

### Validation

After creating your JSON file, run the content validator:

```bash
pnpm run build:content
```

This will check:
- ✅ Valid JSON syntax
- ✅ Required fields present
- ✅ Correct field types
- ✅ Valid enum values
- ✅ Unique IDs and slugs

### Tips for Writing Techniques

1. **Steps**: Keep to 4-6 clear, actionable cues — not essays
2. **Key Points**: Focus on principles, not repetition of steps
3. **Common Mistakes**: Help students avoid typical errors
4. **Context**: When would you use this specific variation?
5. **Uke guidance**: Include notes for the attacking partner's role
6. **Media**: Add video links only if high quality and relevant

### Naming Conventions

- **IDs**: `technique-name-###` (e.g., `ikkyo-001`, `kote-gaeshi-002`)
- **Slugs**: `kebab-case` matching common usage (e.g., `shiho-nage`, `irimi-nage`)
- **Version IDs**: `trainer-dojo` format (e.g., `haase-bsv`, `yamada-nyai`)

---

## UX Conventionstus

**v0.9.0 (Beta)** — Core experience is stable and usable. Some features are placeholders (feedback page). Content currently focuses on a curated set of techniques to demonstrate depth (variations, versions) rather than breadth.

---

## Highlights

- **Library** — Filterable, searchable list of techniques.
- **Technique pages** — Concise *Summary*, *Key Points*, *Common Mistakes*, *Context*, and *Steps*.
- **Variations toolbar** — Choose **Direction** (Irimi / Tenkan / Omote / Ura), **Hanmi** (Ai / Gyaku), **Weapon** (Empty / Bokken / Jō / Tantō), and **Version** (trainer/dojo) from a single, scalable toolbar.
- **Bookmarks & Collections** — Save techniques and organize them into belt-oriented or custom collections.
- **Guide** — Movements, stances, etiquette, principles, and **exam program** (exam tables complete; more techniques coming).
- **Glossary** — Core Aikidō terms with EN/DE definitions (clickable from tags).
- **Search** — Diacritic-insensitive, field-weighted ranking; grouped results (Terms / Techniques / Collections).
- **Bilingual UI** — **English** and **Deutsch** toggle.
- **Theme** — Light/Dark mode.
- **Privacy** — Local-first storage; export/import available for bookmarks/collections.

---

## Roadmap (next)

- **1.0**
  - Complete **all 5th kyū techniques** with full variations (direction, hanmi, weapon, version).
  - **Exam program tables** (Saya-no-Uchi and weapon tables) with clickable cells → technique pages.
  - **Feedback page** form (email works now; in-app form later).
  - Share/print **Collections** (read-only link; clean print layout).
- **Later**
  - Advanced search chips (Exact / Close / Fuzzy).
  - Optional PWA/offline.
  - Optional trainer pages and contribution flow.

---

## Tech Stack

- **React + TypeScript + Vite**
- **Tailwind CSS**
- **Zustand** (client state)
- **Local-first storage** (via app storage service; export/import for bookmarks)
- **Framer Motion (Motion)** for subtle animations
- Simple **i18n dictionaries** (no heavy framework)

> Fonts: **IBM Plex Sans** (SIL Open Font License 1.1).

---

## Getting Started

### Prerequisites
- Node 18+ (or 20+)
- **pnpm** recommended

### Setup
```bash
pnpm i
pnpm dev
# open http://localhost:5173
```

### Build & Preview
```bash
pnpm build
pnpm preview
```

### Lint (optional)
```bash
pnpm lint
```

---

## Project Structure (high level)

```
src/
├─ App.tsx
├─ main.tsx
├─ index.css
├─ ErrorBoundary.tsx
├─ features/
│  ├─ bookmarks/
│  │  ├─ components/
│  │  │  ├─ AddToCollectionMenu.tsx
│  │  │  ├─ BookmarksView.tsx
│  │  │  ├─ CollectionsSidebar.tsx
│  │  │  ├─ GlossaryBookmarkCard.tsx
│  │  │  └─ progress/
│  │  └─ store.ts
│  ├─ glossary/
│  │  ├─ components/
│  │  ├─ loader.ts
│  │  └─ store.ts
│  ├─ home/
│  │  ├─ components/
│  │  │  ├─ feedback/
│  │  │  ├─ guide/
│  │  │  ├─ home/
│  │  │  ├─ settings/
│  │  │  ├─ HomePage.tsx
│  │  │  └─ QuoteRotator.tsx
│  │  └─ index.ts
│  ├─ search/
│  │  ├─ components/
│  │  ├─ indexer.ts
│  │  ├─ lib.ts
│  │  ├─ scorer.ts
│  │  └─ store.ts
│  └─ technique/
│     ├─ components/
│     │  ├─ Library.tsx
│     │  ├─ TechniqueCard.tsx
│     │  ├─ TechniquePage.tsx
│     │  ├─ TechniqueToolbar.tsx
│     │  └─ ...
│     ├─ entryPref.ts
│     └─ store.ts
├─ generated/
│  └─ (build outputs: compiled JSON → TS)
└─ shared/
   ├─ components/
   │  ├─ dialogs/
   │  ├─ layout/
   │  ├─ media/
   │  ├─ ui/
   │  │  ├─ icons.tsx
   │  │  ├─ motion.ts
   │  │  ├─ modals/
   │  │  ├─ Chip.tsx
   │  │  ├─ Segmented.tsx
   │  │  ├─ Select.tsx
   │  │  └─ ...
   │  ├─ EmphasizedName.tsx
   │  ├─ LevelBadge.tsx
   │  ├─ Logo.tsx
   │  └─ SectionTitle.tsx
   ├─ constants/
   │  ├─ i18n.ts
   │  ├─ storage.ts
   │  ├─ urls.ts
   │  ├─ variantMapping.ts
   │  └─ versionLabels.ts
   ├─ data/
   │  ├─ belts.ts
   │  └─ quotes.ts
   ├─ hooks/
   ├─ i18n/
   ├─ services/
   ├─ store/
   ├─ styles/
   ├─ types/
   │  └─ content.ts (was schema.ts)
   └─ utils/
      ├─ migrations/
      ├─ array.ts
      ├─ classNames.ts
      ├─ format.ts
      └─ text.ts
```

**Path aliases** (`@features/*`, `@shared/*`, `@generated/*`, `@content/*`) are configured in `tsconfig.app.json` and `vite.config.ts` for cleaner imports.

---

## Data Model (techniques) — v2 (overview)

Each technique contains core metadata, a catalog of available **versions** (trainers/dojo), and **variants** (content for a specific combination of direction/weapon/hanmi/version).

```ts
type Direction = 'irimi' | 'tenkan' | 'omote' | 'ura';
type Hanmi = 'ai' | 'gyaku';
type Weapon = 'empty' | 'bokken' | 'jo' | 'tanto';

type VersionMeta = {
  id: string;           // "haase-bsv"
  label: string;        // "Alfred Haase (BSV)"
  dojo?: string;        // optional
  trainerId?: string;   // optional
};

type VariantKey = {
  direction: Direction;
  hanmi: Hanmi;
  weapon: Weapon;
  versionId?: string | null;  // null/undefined => Standard
};

type Localized<T> = { en: T; de: T };

type TechniqueVariant = {
  key: VariantKey;
  steps: Localized<string[]>;           // concise skeleton (4–6 cues)
  keyPoints?: Localized<string[]>;
  commonMistakes?: Localized<string[]>;
  context?: Localized<string>;
  uke?: {
    role: Localized<string>;
    notes?: Localized<string[]>;
  };
  media?: Array<{ type: 'youtube'|'vimeo'|'url'; url: string; title?: string }>;
};

type Technique = {
  id: string;
  slug: string;
  name: Localized<string>;
  jp?: string;
  category: 'throw'|'control'|'pin'|'other';
  attack: string;               // e.g. 'katate-dori'
  level?: string;               // belt tag for filtering (display-only)
  summary: Localized<string>;
  tags: string[];               // searchable aliases
  versions: VersionMeta[];      // catalog of trainers/lines
  variants: TechniqueVariant[]; // content per combination
};
```

> **Why this shape?** It scales to many trainers and weapon contexts without duplicating whole techniques, and it keeps steps as concise cues rather than long essays.

---

## UX Conventions

- **Toolbar** over technique content with four selectors:
  - **Direction** (segmented)
  - **Hanmi** (select)
  - **Weapon** (select)
  - **Version** (select; searchable; grouped by dojo)
- **URL params** reflect the active selection (shareable deep links).
- **Empty combination** → gentle “no content yet” message (notes/media may still show).
- **Search** highlights matches and groups by entity (Glossary / Techniques / Collections).
- **Accessibility**: keyboard-navigable controls, visible focus states, readable contrast.

---

## Content & Legal

- **Unofficial**: This site is an **unofficial study aid**. Requirements vary by dojo/federation.
- **Accuracy**: *All mistakes are mine; trainers have not formally approved the descriptions yet.*
- **Exam programs**: Tables in Enso are **reformatted** from public curricula in a new design; we do **not** republish copyrighted PDFs/images.
- **Logos/marks**: Dojo/federation logos remain trademarks of their owners.
- **Fonts**: IBM Plex Sans — SIL Open Font License 1.1.

### German (Kurzfassung)
- **Inoffiziell**: Enso ist eine **inoffizielle Lernhilfe**. Prüfungsinhalte können je nach Dojo/Verband abweichen.  
- **Hinweis**: *Alle Fehler liegen bei mir; Trainer:innen haben die Inhalte noch nicht offiziell freigegeben.*  
- **Prüfungstabellen**: Neu gestaltet, keine Weiterveröffentlichung von fremden PDFs/Bildern.  

---

## Contributing

Right now we’re prioritizing stability and content quality.  
- **Bugs / suggestions**: Settings → Feedback (Email works; in-app form planned).  
- Pull requests are welcome once v1.0 lands and the content model is frozen.

---

## License

The entire project (code and content) is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).  
See: https://creativecommons.org/licenses/by-nc/4.0/
 
Fonts: IBM Plex Sans — SIL Open Font License 1.1.
