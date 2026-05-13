# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KhmerLesson mobile app — Expo React Native, Khmer language learning. A companion Next.js admin dashboard lives at `../khmerlesson-dashboard`.

## Development Commands

Run from this directory (`khmerlesson-app/`):

```bash
npx expo start           # Dev server — scan QR with Expo Go
npx expo start --ios     # iOS simulator
npx expo start --android # Android emulator
npx expo lint            # ESLint
npx tsc --noEmit         # Type-check without building
```

## Folder Structure

```
app/                          # Expo Router file-based routes
  (tabs)/
    index.tsx                 # Home — course list
    explore.tsx               # Browse with free/premium filter
  course/[id].tsx             # Course detail + lesson list
  lesson/[id].tsx             # Lesson detail (sections)
  _layout.tsx                 # Root stack config
  modal.tsx

src/
  shared/
    theme/index.ts            # Single source for all design tokens
    components/               # Text, Button, Badge, ProgressBar
  features/
    courses/
      types.ts                # Course interface
      components/CourseCard.tsx
    lessons/
      types.ts                # Lesson, LessonDetail, LessonSection, LessonLevel
      components/LessonRow.tsx
  services/
    api.ts                    # apiFetch<T>() + BUCKET_URL
    hooks/
      useCourses.ts           # GET /api/v1/main-lessons
      useCourseLessons.ts     # GET /api/v1/main-lessons/:id/lessons
      useLessonDetail.ts      # GET /api/v1/lessons/:id

context/                      # Living project spec — read before implementing
  backend-reference/
    api-overview.md           # Full API endpoint list
    mobile-data-models.md     # Authoritative type shapes from backend
  feature-specs/              # Numbered spec files — work in order
  progress-tracker.md
  architecture.md
  ui-context.md
```

## Environment

Copy `.env.example` → `.env` and fill in values. `.env` is gitignored.

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001
EXPO_PUBLIC_API_KEY=...
EXPO_PUBLIC_BUCKET_URL=http://localhost:5001/uploads
```

Variables are read in `src/services/api.ts`. `BUCKET_URL` is used to resolve `imageCover` paths from the API into full image URIs.

## API Layer

**`apiFetch<T>(path)`** — handles auth header, unwraps `{ data: ... }` envelope or raw response, throws on non-2xx.

All data fetching uses hooks in `src/services/hooks/`. Each hook returns `{ data, loading, error }`. Screens must render all three states.

When adding a new endpoint:
1. Check `context/backend-reference/api-overview.md` for the route
2. Check `context/backend-reference/mobile-data-models.md` for the response shape
3. Add a hook in `src/services/hooks/`

## Design Tokens

**Single source: `src/shared/theme/index.ts`.** Never hardcode hex values or numeric sizes in components.

| Export | Notable keys |
|--------|-------------|
| `Colors` | `primary`, `primaryLight`, `primaryMuted`, `background`, `surface`, `border`, `borderLight`, `text.{primary,secondary,muted,inverse}`, `success/successLight/successDark`, `warning/warningLight/warningDark`, `info/infoLight/infoDark`, `purple/purpleLight/purpleDark`, `error` |
| `Spacing` | `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 · `xxl` 48 |
| `Radius` | `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `full` 9999 |
| `FontSize` | `xs` 12 · `sm` 14 · `md` 16 · `lg` 18 · `xl` 22 · `xxl` 28 · `hero` 34 |
| `FontWeight` | `regular` · `medium` · `semibold` · `bold` · `extrabold` |
| `Shadow` | `sm` · `md` |

## Components

Use `src/shared/components/` — do not use React Native `Text` directly.

- **`Text`** — variants: `hero` `title` `subtitle` `body` `caption` `label`. Props: `color`, `weight`, any `TextProps`.
- **`Button`** — variants: `primary` `outline` `ghost`. Sizes: `sm` `md` `lg`. Props: `loading`, `fullWidth`.
- **`Badge`** — variants: `free` `premium` `beginner` `intermediate` `advanced`. Returns `null` for unknown variants.
- **`ProgressBar`** — props: `progress` (0–1), `height`, `color`.

Icons: **Ionicons** from `@expo/vector-icons` only.

## Khmer Text

All `Text` variant `lineHeight` values are ~1.6× `fontSize` to prevent Khmer stacked-glyph clipping. For any custom `fontSize` override, apply the same ratio. Never set `lineHeight` below 1.5× for text that may contain Khmer script.

## Data Types

```typescript
// src/features/courses/types.ts
interface Course {
  id: number;
  title: string;
  description: string;
  imageCover: string;
  free: boolean;
  price?: number;
}

// src/features/lessons/types.ts
type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';
interface Lesson { id: number; title: string; description: string; level: LessonLevel; }
interface LessonDetail extends Lesson { sections: LessonSection[]; }
interface LessonSection { title: string; content: string; }
```

## AI Workflow Rules

- Read `context/progress-tracker.md` before starting.
- Work one feature spec at a time (`context/feature-specs/` in numbered order).
- After each unit: update `progress-tracker.md` and confirm `npx tsc --noEmit` passes.
- Do not invent behavior not defined in the context files.
- When types conflict with the backend reference, the backend reference wins.
