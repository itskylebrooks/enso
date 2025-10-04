# Enso — Aikidō study companion (v0.9.0)

*A clean, bilingual (EN/DE) catalog of Aikidō techniques with fast search, versions by trainer, and personal study tools.*

> “Your personal Aikidō library and study companion.”

---

#> **Why this shape?** It scales to many trainers and weapon contexts without duplicating whole techniques, and it keeps steps as concise cues rather than long essays.

---

## Adding New Techniques

Techniques are stored as JSON files in `/content/techniques/`. Each file represents one technique with multiple versions (Standard, trainer-specific) and entry variations (irimi/tenkan).

### Template Structure

Create a new file: `/content/techniques/attack-technique-direction.json`

```json
{
  "id": "t-unique-id",
  "slug": "attack-technique-direction",
  "name": {
    "en": "Attack Technique Name (Direction)",
    "de": "Attack Technique Name (Direction)"
  },
  "jp": "日本語名",
  "category": "throw",
  "attack": "katate-dori",
  "weapon": "empty-hand",
  "level": "kyu5",
  "summary": {
    "en": "Brief English description of what this technique is and its purpose.",
    "de": "Kurze deutsche Beschreibung der Technik und ihres Zwecks."
  },
  "tags": [
    "technique-name",
    "direction",
    "category",
    "attack"
  ],
  "versions": [
    {
      "id": "v-standard",
      "hanmi": "ai-hanmi",
      "stepsByEntry": {
        "irimi": {
          "en": [
            "Receive the attack softly; align posture.",
            "Step off-line (irimi) and establish connection.",
            "Guide partner's energy through the technique.",
            "Complete movement maintaining control.",
            "Finish with safe ukemi and zanshin."
          ],
          "de": [
            "Nimm den Angriff weich an; richte die Haltung aus.",
            "Tritt von der Linie (Irimi) und etabliere Verbindung.",
            "Führe die Energie des Partners durch die Technik.",
            "Vollende die Bewegung mit Kontrolle.",
            "Beende mit sicherem Ukemi und Zanshin."
          ]
        },
        "tenkan": {
          "en": [
            "Receive the attack softly; align posture.",
            "Turn (tenkan) and blend with partner's energy.",
            "Maintain connection while pivoting.",
            "Execute the technique from the new angle.",
            "Guide to safe ukemi and maintain zanshin."
          ],
          "de": [
            "Nimm den Angriff weich an; richte die Haltung aus.",
            "Drehe (Tenkan) und verschmelze mit der Energie.",
            "Halte Verbindung beim Drehen.",
            "Führe die Technik aus dem neuen Winkel aus.",
            "Führe in sicheres Ukemi und halte Zanshin."
          ]
        }
      },
      "uke": {
        "role": {
          "en": "Provide a committed attack and follow the lead with appropriate resistance.",
          "de": "Greife engagiert an und folge der Führung mit angemessenem Widerstand."
        },
        "notes": {
          "en": [
            "Maintain realistic attack energy",
            "Stay connected throughout the movement",
            "Take safe ukemi when balance is broken"
          ],
          "de": [
            "Realistische Angriffsenergie beibehalten",
            "Verbindung während der Bewegung halten",
            "Sicheres Ukemi nehmen wenn Gleichgewicht bricht"
          ]
        }
      },
      "media": [],
      "commonMistakes": {
        "en": [
          "Using upper body strength instead of whole body movement",
          "Breaking posture during execution",
          "Losing connection with partner"
        ],
        "de": [
          "Oberkörperkraft statt Ganzkörperbewegung verwenden",
          "Haltung während Ausführung verlieren",
          "Verbindung zum Partner verlieren"
        ]
      },
      "context": {
        "en": "Context about when and how this variation is practiced, important principles to remember.",
        "de": "Kontext darüber, wann und wie diese Variation geübt wird, wichtige Prinzipien zum Merken."
      }
    },
    {
      "id": "v-mustermann",
      "trainerId": "max-mustermann",
      "dojoId": "example-dojo",
      "hanmi": "ai-hanmi",
      "stepsByEntry": {
        "irimi": {
          "en": [
            "Start in ai-hanmi; receive the attack.",
            "Enter with strong irimi emphasizing hip rotation.",
            "Control partner's center throughout movement.",
            "Execute technique with whole body power.",
            "Guide to completion with precision and zanshin."
          ],
          "de": [
            "Beginne in Ai-Hanmi; empfange den Angriff.",
            "Trete mit starkem Irimi ein, betone Hüftrotation.",
            "Kontrolliere das Zentrum des Partners während der Bewegung.",
            "Führe Technik mit Ganzkörperkraft aus.",
            "Führe zur Vollendung mit Präzision und Zanshin."
          ]
        }
      },
      "uke": {
        "role": {
          "en": "Grab with intent from ai-hanmi. Follow the entry without resistance and receive the throw safely.",
          "de": "Greife entschlossen aus Ai-Hanmi. Folge dem Eintritt ohne Widerstand und nimm den Wurf sicher an."
        },
        "notes": {
          "en": [
            "Maintain firm but not rigid grip",
            "Move with the technique",
            "Prepare for appropriate ukemi"
          ],
          "de": [
            "Festen aber nicht starren Griff halten",
            "Mit der Technik mitgehen",
            "Auf passendes Ukemi vorbereiten"
          ]
        }
      },
      "commonMistakes": {
        "en": [
          "Weak entry creating too much distance",
          "Relying on arm strength",
          "Losing postural control"
        ],
        "de": [
          "Schwacher Eintritt erzeugt zu viel Abstand",
          "Sich auf Armkraft verlassen",
          "Haltungskontrolle verlieren"
        ]
      },
      "context": {
        "en": "Max Mustermann's interpretation emphasizes strong entry and hip-driven movement, maintaining center control throughout.",
        "de": "Max Mustermanns Interpretation betont starken Eintritt und hüftgetriebene Bewegung, Zentrumskontrolle durchgehend beibehaltend."
      },
      "media": [
        {
          "type": "youtube",
          "url": "https://www.youtube-nocookie.com/embed/VIDEO_ID",
          "title": "Technique Name - Max Mustermann"
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
| `id` | string | ✅ | Unique identifier (e.g., "t-shn-katatedori-omote") |
| `slug` | string | ✅ | URL-friendly name (e.g., "katate-dori-shiho-nage-omote") |
| `name` | Localized | ✅ | Technique name in EN/DE |
| `jp` | string | ❌ | Japanese name (romaji or kanji) |
| `category` | enum | ✅ | One of: `throw`, `control`, `pin`, `other` |
| `attack` | string | ✅ | Attack type (e.g., "katate-dori", "shomen-uchi") |
| `weapon` | string | ✅ | Weapon context: `empty-hand`, `bokken`, `jo`, `tanto` |
| `level` | string | ❌ | Belt level for filtering (e.g., "kyu5", "kyu4", "kyu3") |
| `summary` | Localized | ✅ | Brief description of the technique |
| `tags` | string[] | ✅ | Alternative names for search |

#### Versions Structure

Each technique has multiple **versions** - different interpretations by trainers or dojos. The first version should always be the standard one:

```json
"versions": [
  {
    "id": "v-standard",        // Required: Always start with standard version
    "hanmi": "ai-hanmi",       // Required: "ai-hanmi" or "gyaku-hanmi"
    "stepsByEntry": { ... },   // Required: Steps for irimi and/or tenkan
    "uke": { ... },           // Required: Uke's role and notes
    "media": [],              // Optional: Video/image references
    "commonMistakes": { ... },// Optional: Things to avoid
    "context": { ... }        // Optional: When/how to use
  },
  {
    "id": "v-mustermann",     // Trainer-specific version
    "trainerId": "max-mustermann",  // Links to trainer profile
    "dojoId": "example-dojo",       // Links to dojo
    "hanmi": "ai-hanmi",
    // ... same structure as above
  }
]
```

**Important**: Version IDs must start with `v-` prefix (e.g., `v-standard`, `v-mustermann`, `v-haase`).

#### Steps By Entry

Each version contains `stepsByEntry` - an object with steps for different entry types:

```json
"stepsByEntry": {
  "irimi": {              // Entering/direct entry
    "en": [ "step 1", "step 2", ... ],
    "de": [ "Schritt 1", "Schritt 2", ... ]
  },
  "tenkan": {             // Turning/pivoting entry
    "en": [ "step 1", "step 2", ... ],
    "de": [ "Schritt 1", "Schritt 2", ... ]
  }
}
```

**Entry Types:**
- `irimi` — Direct entering movement
- `tenkan` — Turning/pivoting movement

You can include one or both entry types. Each should have 4-8 clear, actionable steps.

#### Hanmi (Stance)

Each version specifies the **hanmi** (stance relationship):
- `ai-hanmi` — Same stance (both partners have same foot forward)
- `gyaku-hanmi` — Opposite stance (opposite feet forward)

#### Additional Content

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uke` | Object | ✅ | Guidance for the attacking partner |
| `uke.role` | Localized<string> | ✅ | Brief description of uke's role |
| `uke.notes` | Localized<string[]> | ✅ | Specific tips for uke (can be empty array) |
| `media` | Array | ✅ | Video/image references (can be empty array) |
| `commonMistakes` | Localized<string[]> | ✅ | Things to avoid (can be empty) |
| `context` | Localized<string> | ✅ | When/how to practice (can be empty string) |

**Note**: Even if empty, these fields should be present in the JSON for consistency.

### Complete Example

See `/content/techniques/katate-dori-kaiten-nage-soto.json` for a real working example with both standard and trainer-specific versions.

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

1. **Steps**: Keep to 4-8 clear, actionable cues per entry type — not essays
2. **Common Mistakes**: Help students avoid typical errors
3. **Context**: Explain when you'd use irimi vs tenkan for this technique
4. **Uke guidance**: Include notes for the attacking partner's role
5. **Media**: Add video links only if high quality and relevant (use youtube-nocookie.com URLs)

### Naming Conventions

- **IDs**: `t-abbreviation-attack-technique` (e.g., `t-shn-katatedori-omote`, `t1`, `t8`)
- **Slugs**: `kebab-case` matching common usage (e.g., `katate-dori-shiho-nage-omote`)
- **Version IDs**: `v-standard` (required first), then `v-trainername` (e.g., `v-haase`, `v-mustermann`)
- **Trainer IDs**: `kebab-case` (e.g., `max-mustermann`, `alfred-haase`)
- **Dojo IDs**: `kebab-case` or abbreviation (e.g., `bsv`, `example-dojo`)

---

## Status

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
