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
  index.tsx                   # Entry — hydrates auth, routes to onboarding/login/tabs
  onboarding.tsx              # 3-slide intro; routes to /auth/login when done
  auth/login.tsx              # Google + Apple + Guest sign-in
  (tabs)/
    index.tsx                 # Home — continue learning + all courses
    explore.tsx               # Browse with level filter chips (hidden from tab bar)
    me.tsx                    # Profile — auth-guarded, shows user info + log out
  course/[id].tsx             # Course detail + lesson list
  course/purchase.tsx         # IAP purchase modal
  lesson/[id].tsx             # Lesson detail (sections + vocab)
  _layout.tsx                 # Root stack + status bar

src/
  shared/
    theme/index.ts            # Single source for all design tokens
    components/               # Text, Button, Badge, ProgressBar
    utils/image.ts            # Image URI helpers
  features/
    auth/
      types.ts                # User, AuthTokens, AuthState, AuthProvider
      store/authStore.ts      # Zustand auth store (persists to AsyncStorage)
      service.ts              # signInWithGoogle, signInWithApple
    courses/
      types.ts                # Course interface
      components/CourseCard.tsx
      service/purchaseService.ts
    lessons/
      types.ts                # Lesson, LessonDetail, LessonSection, LessonLevel, VocabItem
      components/LessonRow.tsx
  services/
    api.ts                    # apiFetch, apiPost, apiPostForm, apiDelete + BUCKET_URL
    hooks/
      useCourses.ts           # GET /api/v1/main-lessons
      useCourseLessons.ts     # GET /api/v1/main-lessons/:id/lessons
      useLessonDetail.ts      # GET /api/v1/lessons/:id

context/                      # Living project spec — read before implementing
  backend-reference/
    api-overview.md           # Full API endpoint list
    mobile-data-models.md     # Authoritative type shapes from backend
  feature-specs/              # Numbered spec files — work in order
  mock-data/                  # Khmer mock content used until API/SQLite is ready
  progress-tracker.md
  architecture.md
  ai-workflow-rules.md
  code-standards.md
  product-context.md
  ui-context.md
```

**Import alias:** `@/` resolves to the repo root, so `@/src/...` imports work everywhere.

## Environment

Copy `.env.example` → `.env` and fill in values. `.env` is gitignored.

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001
EXPO_PUBLIC_API_KEY=...
EXPO_PUBLIC_BUCKET_URL=http://localhost:5001/uploads
```

Variables are read in `src/services/api.ts`. `BUCKET_URL` is used to resolve `imageCover` paths from the API into full image URIs.

## API Layer

**`src/services/api.ts`** exports:

| Function | Method | Notes |
|---|---|---|
| `apiFetch<T>(path, token?)` | GET | Unwraps `{ data: ... }` envelope or raw response |
| `apiPost<T>(path, body, token?)` | POST | JSON body |
| `apiPostForm<T>(path, body, token?)` | POST | `application/x-www-form-urlencoded` — used by auth endpoints to match the Flutter reference |
| `apiDelete(path, token?)` | DELETE | Returns void |

All throw on non-2xx. All data-fetching hooks return `{ data, loading, error }` — screens must render all three states.

When adding a new endpoint:
1. Check `context/backend-reference/api-overview.md` for the route
2. Check `context/backend-reference/mobile-data-models.md` for the response shape
3. Add a hook in `src/services/hooks/`

## Auth Flow

Auth state lives in `src/features/auth/store/authStore.ts` (Zustand, persisted to AsyncStorage key `auth_state`). Methods: `setAuth`, `setGuest`, `signOut`, `hydrate`, `refreshTokens`.

`app/index.tsx` calls `hydrate()` on mount, then routes to onboarding / login / tabs.

`src/features/auth/service.ts` contains `signInWithApple` and `signInWithGoogle`:
- **Apple**: 2 API calls — `POST /api/auth/verify-apple-id-token` then `POST /api/auth/register-auth-service` (form-encoded, `registrationType: "apple_service"`)
- **Google**: 1 API call — `expo-auth-session` PKCE → Google userinfo → `POST /api/auth/register-auth-service` (form-encoded, `registrationType: "google"`)

Both silently ignore cancel/dismiss; other errors surface inline.

## In-App Purchases

`src/features/courses/service/purchaseService.ts` wraps `react-native-iap`. The IAP module is loaded via deferred `require()` so the file loads safely in Expo Go (NitroModules only work in native builds). Calls in Expo Go throw `IAP_NOT_AVAILABLE` and the purchase modal should handle this.

Purchase flow: `connectIAP` → `loadCourseProduct` (tries in-app, falls back to subscription) → `purchaseCourse` → records to `POST /api/v1/purchase-history` → `finishTransaction`.

## Architecture: Data Flow

```
API → service hooks → Zustand store → UI
```

Planned (not yet built):
```
API → sync service → SQLite → Zustand → UI
```

Offline strategy: free lessons cached locally; premium lessons cached after purchase and require re-validation annually.

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

Audio (`expo-av`) and text-to-speech (`expo-speech`) packages are installed for future lesson audio playback.

## Data Types

```typescript
// src/features/courses/types.ts
interface Course {
  id: number; title: string; description: string;
  imageCover: string; free: boolean; price?: number;
}

// src/features/lessons/types.ts
type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';
interface Lesson { id: number; title: string; description: string; level: LessonLevel; }
interface LessonDetail extends Lesson { sections: LessonSection[]; }
interface LessonSection { title: string; content: string; }
interface VocabItem { word: string; pronunciation: string; meaning: string; }

// src/features/auth/types.ts
type AuthProvider = 'google' | 'apple' | 'email';
interface User { id: string; email: string; name: string; avatarUrl?: string; provider: AuthProvider; }
interface AuthTokens { accessToken: string; refreshToken: string; }
```

When types conflict with `context/backend-reference/mobile-data-models.md`, the backend reference wins.

## Feature Development Flow

For each new feature, work in this order:
1. Create UI with mock data
2. Add local state (Zustand)
3. Add SQLite persistence
4. Add API integration
5. Add sync/offline handling

## AI Workflow Rules

- Read `context/progress-tracker.md` before starting any session.
- Work one feature spec at a time (`context/feature-specs/` in numbered order).
- Only touch files related to the current task.
- Do not invent behavior not defined in the context files.
- After completing a unit: update `progress-tracker.md` and confirm `npx tsc --noEmit` passes.
- Never refactor existing architecture without permission.
- Prefer feature-specific Zustand stores over a single global store.
- Shared UI components → `src/shared/components/`; feature components stay inside their feature folder.
