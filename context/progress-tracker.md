# Progress Tracker

Update this file after every meaningful implementation change. If bugs or any suggestion found, add it to Next Up.

## Current Phase

- In progress

## Current Goal

- Phase B complete — Quiz 1 improvements shipped

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
- First-launch gate in `app/index.tsx`: hydrates auth, checks onboarding flag, routes to onboarding / login / tabs accordingly
- Auth types (`src/features/auth/types.ts`): `User`, `AuthTokens`, `AuthState`, `AuthProvider`
- Zustand auth store (`src/features/auth/store/authStore.ts`): `setAuth`, `setGuest`, `signOut`, `hydrate` — persists to AsyncStorage
- Login screen (`app/auth/login.tsx`): Google + Apple buttons, "Continue as Guest" → tabs; `isGuest` state in store
- Onboarding "Get Started" / Skip now routes to `/auth/login` instead of tabs
- Apple Sign-In (`src/features/auth/service.ts` `signInWithApple`): calls `expo-apple-authentication`, exchanges identity token with `POST /api/auth/verify-apple-id-token`, stores user + tokens via auth store; cancel is silently ignored, other errors shown inline
- `apiPost<T>` and `apiPostForm<T>` added to `src/services/api.ts`; form-encoded variant used by Apple + Google + other auth endpoints
- Google Sign-In (`signInWithGoogle` in service.ts): `expo-auth-session` PKCE flow → Google userinfo API → `POST /api/auth/register-auth-service` (form-encoded, `registrationType: "google"`) → store; cancel/dismiss is silent, errors shown inline
- Me tab (`app/(tabs)/me.tsx`): replaces Explore tab; auth-guarded (unauthenticated → `/auth/login`); shows avatar initials, name, email, provider badge; Support (mailto), Privacy Policy (url), Log Out (alert confirm → signOut), Delete Account (alert confirm → TODO API)
- Tab layout: Explore hidden (`href: null`), Me tab added with person icon
- Purchase course flow (`app/course/purchase.tsx`, `src/features/courses/service/purchaseService.ts`): IAP via `react-native-iap` (deferred require for Expo Go safety); connects IAP, loads product price, handles new purchase + existing entitlement resume, records to `POST /api/v1/purchase-history`, finishes transaction; auto-refreshes expired access token during purchase
- Lesson progress store (`src/features/lessons/store/progressStore.ts`): Zustand store persisted to AsyncStorage; tracks completed lessons per course and last-accessed lesson; hydrated on app startup alongside auth store
- Completed lesson UI: `LessonRow` shows green checkmark icon when lesson is complete
- Continue Learning section on home screen: appears after first lesson visit; tapping resumes the last-accessed lesson directly
- Lesson tracking wired end-to-end: `lesson/[id].tsx` calls `setLastAccessed` on load and `markComplete` on Finish; `course/[id].tsx` passes courseId/courseTitle params and shows completed state per row
- Onboarding prefetch: `prefetchCourses()` called on onboarding mount; home screen renders instantly from module-level cache with no loading spinner; animated toast banner shows success / no-internet / server-unavailable as appropriate
- TTS: replaced `expo-speech` with backend proxy (`GET /api/tts?q=<text>`) played via `expo-av`; Khmer language hardcoded server-side; new service at `src/features/lessons/service/ttsService.ts`
- Quiz feature: `GET /api/v1/quizzes` + `GET /api/v1/quizzes/:id`; types at `src/features/quizzes/types.ts`; hooks `useQuizDetail`, `useQuizByLesson`; one-question-at-a-time quiz screen at `app/quiz/[id].tsx` with answer feedback and result screen; "Take the Quiz" banner appears on last lesson section when a quiz exists for that lesson
- **A1** · Course type updated (`hasAccess`, `comingSoon`, `order` added; old `price`/`productId`/`hasPurchased` kept optional for A6 cleanup); `ApiCourse` in `useCourses.ts` updated to new API response shape; `mobile-data-models.md` and `api-overview.md` updated to reflect subscription model
- **A2** · `SubscriptionPlan`, `Subscription`, `SubscriptionStatus` types at `src/features/subscriptions/types.ts`; Zustand store at `src/features/subscriptions/store/subscriptionStore.ts` (AsyncStorage key `subscription_state`); `hydrate()` added to `Promise.all` in `app/index.tsx`
- **A3** · `useSubscriptionPlans` (public, `GET /api/v1/subscription-plans`) and `useMySubscription` (auth-required, `GET /api/v1/subscriptions/me`, syncs result into subscription store) at `src/services/hooks/`
- **A4** · `purchaseService.ts` rewritten for subscription model: `loadSubscriptionProduct` (subs-type StoreKit lookup), `purchaseSubscription(planProductId, token) → Promise<Subscription>` (calls `POST /api/v1/subscriptions` with JWS); removed per-course helpers
- **A5** · `app/subscription/index.tsx` — new paywall screen; loads plans via `useSubscriptionPlans`, fetches StoreKit price, calls `purchaseSubscription` on tap, writes result to subscription store, `router.back()` on success; IAP-unavailable warning for Expo Go; `app/course/purchase.tsx` deleted (no longer referenced)
- **A6** · `CourseCard`: access logic switched to `hasAccess`/`comingSoon`; coming-soon cards non-tappable; price badge removed; "Coming Soon" tag added. `course/[id].tsx`: uses `hasAccess`/`comingSoon`; `handleSubscribe` navigates to `/subscription`; `useFocusEffect` now always refetches on focus; `purchased`/`hasPurchased`/`purchasedLocally` removed
- **A7** · `apiFetch` now parses error body for `message` and `code`. `useCourseLessons` + `useLessonDetail` expose `forbiddenReason: 'tokenExpired' | 'subscription' | 'comingSoon' | null`. `course/[id].tsx` + `lesson/[id].tsx` redirect to `/auth/login` on `tokenExpired`; lesson screen shows subscribe/coming-soon UI for the respective 403 reason
- **B1** · Quiz score store at `src/features/quizzes/store/quizScoreStore.ts`; persists to AsyncStorage key `quiz_scores`; keyed by `lessonId` string; methods `setScore`, `getScore`, `hydrate`; hydrated in `app/index.tsx` alongside auth/progress/subscription stores
- **B2** · Score saved on quiz completion: `quiz/[id].tsx` calls `setScore(quiz.lessonId, correctCount, total)` via `useEffect` when `showResult` becomes true
- **B3** · Color-coded quiz circle on `LessonRow`: left circle is independently tappable (`onQuizPress`); no score → empty outline ring; has score → filled with 4-band color (error/warning/warningDark/success); completion checkmark shown inside circle in score tint color; `course/[id].tsx` reads `quizScores` from store and passes `quizScore` + `onQuizPress` (→ `/quiz/select`) per row
- **B4** · Skipped — quiz circle on `LessonRow` navigates directly to the quiz; `course/[id].tsx` uses `useQuizzes` to build a `lessonId → quizId` map; circle is only tappable when a quiz exists for that lesson; "Take the Quiz" banner in `lesson/[id].tsx` navigates directly to `/quiz/[id]`
- **B5** · TTS speaker button on quiz questions (`quiz/[id].tsx`): toggles `playTTS`/`stopTTS`; icon animates between outline and filled; auto-stops on question change and screen unmount

## In Progress

- None

## Next Up — Implementation Plan

Work these in order. Each item is one unit; run `npx tsc --noEmit` and update this file after each.

---

### Phase A — Subscription Model Migration ✅ Complete

### Phase B — Quiz 1 Improvements ✅ Complete

### Phase C — Support Contact ✅ Complete 

---

### Phase D — Subscription UX Fixes ✅ D1 Complete

**D1 · Hide/disable already-purchased plan on paywall screen** ✅
- Bug: After purchasing Plan 1, the paywall (`app/subscription/index.tsx`) still shows Plan 1 as a purchasable option.
- Fix: In `subscription/index.tsx`, after loading `useMySubscription`, compare `subscription.planLevel` to each plan's `planLevel`. If they match and the subscription is `active` or `trial`, render the plan card as "Current Plan" (non-tappable, visually distinct — e.g. muted border + "Your Plan" badge) instead of showing the purchase CTA.
- Edge cases: expired/cancelled subscription should still show the plan as purchasable so the user can renew.

**D2 · 7-day free trial**
- New feature: first-time subscribers get a 7-day free trial before being charged.
- Backend: `POST /api/v1/subscriptions` already handles `offerType === INTRODUCTORY_OFFER` from StoreKit 2 JWS payload and sets `status: "trial"` in the DB. Confirm `currentPeriodEndsAt` is set to trial end date (7 days from purchase) and `planLevel` is populated correctly.
- Frontend: On the paywall screen, show a "Start 7-day free trial" CTA instead of the price for users with no existing subscription. After trial starts, `useMySubscription` returns `status: "trial"` — subscription store and access gates already handle `trial` the same as `active`, so no other UI changes needed.
- Backend check: verify `server/services/iap/ios/storekit2/` correctly detects `offerType === INTRODUCTORY_OFFER` and routes to `status: "trial"`.

---

## Open Questions

- **Quiz 2**: Deferred — client wants a cost estimate first. Show "in progress" placeholder (B4 above). Full implementation (retry-wrong-answers loop) is a separate scope item.
- **`order` field on Course**: `GET /api/v1/main-lessons` now returns `order`. Should the home screen sort courses by `order`? Assume yes unless backend already returns them sorted.
- **Subscription + guest users**: `GET /api/v1/subscriptions/me` requires auth. Guest users have no subscription. Course list with no token still works (free courses show `hasAccess: true`). Locked course tap for a guest → navigate to `/auth/login` first, then `/subscription` after login? Clarify UX if needed.

## Architecture Decisions

- Theme tokens live in `src/shared/theme/` (not `constants/`) to align with the `src/` folder structure defined in architecture.md
- Old `constants/theme.ts` and boilerplate components kept untouched; new screens use the new design system only
- Mock data lives in `context/mock-data/` until API/SQLite layer is ready
- SQLite offline caching deferred until API-only layer is proven (see earlier recommendation — premium offline adds complexity around entitlement caching)

## Session Notes

- All new screens are under `app/course/[id].tsx` and `app/lesson/[id].tsx`
- `@/src/...` imports work via the existing `@/*` path alias in tsconfig.json
- `react-native-iap` on StoreKit 2 (iOS) returns `purchase.transactionReceipt` as a JWS string — used directly as the `jws` field for `POST /api/v1/subscriptions`
