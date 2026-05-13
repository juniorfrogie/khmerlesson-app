# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- In progress

## Current Goal

- Build core feature components and screens

## Completed

- Design system foundation: `src/shared/theme/index.ts` — Colors, Spacing, Radius, FontSize, FontWeight, Shadow tokens
- Shared UI components: Text, Button, Badge, ProgressBar (`src/shared/components/`)
- Course feature: `Course` type, `CourseCard` component (`src/features/courses/`)
- Lesson feature: `Lesson`, `LessonDetail`, `VocabItem` types, `LessonRow` component (`src/features/lessons/`)
- Mock data: courses and lessons with Khmer script (`context/mock-data/`)
- Home screen: greetings header, "Continue Learning", all courses list
- Explore screen: course browsing with level filter chips (All / Beginner / Intermediate / Advanced)
- Course detail screen (`app/course/[id].tsx`): hero header, progress bar, lesson list
- Lesson detail screen (`app/lesson/[id].tsx`): vocabulary cards, "Mark as Complete" action
- Tab bar updated: Home + Explore tabs using Ionicons
- Root layout: consistent header styling, dark status bar
- Onboarding screen (`app/onboarding.tsx`): 3-slide horizontal pager with icon, English + Khmer title, body copy; Skip / Next / Get Started actions
- First-launch gate in `app/_layout.tsx`: reads `onboarding_complete` from AsyncStorage; redirects to `/onboarding` on first launch, sets key on finish/skip

## In Progress

## Next Up

- Connect to real API (replace mock data)
- Zustand store for lesson progress state
- SQLite offline caching (via `src/database/`)
- Auth screens (sign in / sign up)
- Premium purchase flow

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

- Theme tokens live in `src/shared/theme/` (not `constants/`) to align with the `src/` folder structure defined in architecture.md
- Old `constants/theme.ts` and boilerplate components kept untouched; new screens use the new design system only
- Mock data lives in `context/mock-data/` until API/SQLite layer is ready

## Session Notes

- All new screens are under `app/course/[id].tsx` and `app/lesson/[id].tsx`
- `@/src/...` imports work via the existing `@/*` path alias in tsconfig.json
