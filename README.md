# Enso — Aikidō study companion (v0.9.0)

*A clean, bilingual (EN/DE) catalog of Aikidō techniques with fast search, versions by trainer, and personal study tools.*

> “Your personal Aikidō library and study companion.”

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
