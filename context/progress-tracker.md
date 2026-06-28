# Progress Tracker

Update this file after every meaningful implementation change. If bugs or any suggestion found, add it to Next Up.

## Current Phase

- In progress

## Current Goal

- Subscription model migration (API_CHANGES.md) + Quiz 1 improvements (client request)

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

## In Progress

- **B1** · Quiz score store (`src/features/quizzes/store/quizScoreStore.ts`)

## Next Up — Implementation Plan

Work these in order. Each item is one unit; run `npx tsc --noEmit` and update this file after each.

---

### Phase A — Subscription Model Migration (API_CHANGES.md)

**A1 · Update Course type + data model docs**
- `src/features/courses/types.ts`: remove `hasPurchased`, `price`, `productId`; add `hasAccess: boolean`, `comingSoon: boolean`, `lessonCount?: number`, `order?: number`. Keep `isFree` (new meaning: free for anyone, no login needed).
- `context/backend-reference/mobile-data-models.md`: update Course shape to match.
- `context/backend-reference/api-overview.md`: replace old purchase endpoints with new subscription endpoints.

**A2 · Subscription types + store**
- `src/features/subscriptions/types.ts`: `SubscriptionPlan`, `Subscription` (id, userId, planId, platform, productId, originalTransactionId, status, currentPeriodEndsAt), `SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'`.
- `src/features/subscriptions/store/subscriptionStore.ts`: Zustand store (persisted to AsyncStorage); holds `mySubscription: Subscription | null`; methods `setSubscription`, `clearSubscription`; `hydrate()` calls `GET /api/v1/subscriptions/me` (requires token — skip if guest/unauthenticated).
- Wire `hydrate()` into `app/index.tsx` alongside the existing auth + progress hydration.

**A3 · Subscription API hooks**
- `src/services/hooks/useSubscriptionPlans.ts` → `GET /api/v1/subscription-plans` (public, no auth). Returns list of `SubscriptionPlan`.
- `src/services/hooks/useMySubscription.ts` → `GET /api/v1/subscriptions/me` (requires token). Returns `Subscription | null`.

**A4 · Update purchase service for subscription flow**
- `src/features/courses/service/purchaseService.ts`:
  - Remove `loadCourseProduct` (per-course product lookup) — replace with `loadSubscriptionProduct(productIdIos: string)` that loads a single subscription SKU.
  - In purchase completion: instead of `POST /api/v1/purchase-history`, call `POST /api/v1/subscriptions` with `{ jws: purchase.transactionReceipt }` (StoreKit 2 JWS string from `react-native-iap`).
  - Update `purchaseCourse` → rename to `purchaseSubscription(planProductId: string, token: string)`.

**A5 · New subscription paywall screen**
- `app/subscription/index.tsx`: replaces `app/course/purchase.tsx` as the paywall entry point.
- Loads plans via `useSubscriptionPlans`.
- Shows each plan: name, price (cents → formatted "$X.XX/year"), description.
- "Subscribe" button triggers `purchaseSubscription(plan.productIdIos, token)`.
- On success: updates `subscriptionStore`, navigates back and refreshes course list (so `hasAccess` updates).
- On `IAP_NOT_AVAILABLE` (Expo Go): shows friendly message.
- On cancel/dismiss: silently closes.

**A6 · Update course access UI**
- `CourseCard` and/or `app/course/[id].tsx`: replace `hasPurchased`/`price`-based logic with:
  ```
  if comingSoon  → show lock icon + "Coming Soon" label, card non-tappable
  if hasAccess   → normal open behavior
  else           → show lock icon + "Subscribe" button → navigate to /subscription
  ```
- Remove any reference to `price`, `productId`, `hasPurchased` in UI.

**A7 · Handle lesson access errors (401 / 403)**
- In `useCourseLessons` and `useLessonDetail`, catch API errors by code/message:
  - `401` + `code: "TOKEN_EXPIRED"` → call `signOut()` + navigate to `/auth/login`.
  - `403` + message includes `"Active subscription required"` → navigate to `/subscription`.
  - `403` + message includes `"Content not yet available"` → show inline "Coming Soon" message, don't navigate.

---

### Phase B — Quiz 1 Improvements (client request)

**B1 · Quiz score store**
- `src/features/quizzes/store/quizScoreStore.ts`: Zustand store persisted to AsyncStorage.
- Shape: `scores: Record<string, { score: number; total: number }>` keyed by `lessonId` (string).
- Methods: `setScore(lessonId: string, score: number, total: number)`, `getScore(lessonId: string)`.
- Hydrated on app startup.

**B2 · Save score on quiz completion**
- `app/quiz/[id].tsx`: on quiz finish, call `quizScoreStore.setScore(lessonId, correctCount, totalQuestions)`.
- `lessonId` must be passed as a route param when navigating to the quiz (currently the quiz is navigated to by `quizId` — confirm `quizId` → `lessonId` mapping via the quiz detail response or pass `lessonId` explicitly from `lesson/[id].tsx`).

**B3 · Color-coded circle on LessonRow**
- `src/features/lessons/components/LessonRow.tsx`: left side shows a tappable colored circle.
- Color logic based on `percentage = score / total * 100`:
  - No score yet: empty circle (outline, `Colors.border`)
  - 0–49%: `Colors.error` (red)
  - 50–74%: `Colors.warning` (orange/yellow)
  - 75–99%: `Colors.warningLight` or a distinct amber — confirm against theme tokens
  - 100%: `Colors.success` (green)
- Tapping the circle navigates to the quiz selection screen (see B4).
- The existing green checkmark (lesson complete) stays in its current position — the circle is a separate affordance.

**B4 · Quiz selection screen**
- `app/quiz/select.tsx` (or a modal): shown when the user taps the quiz circle on a lesson row.
- Route params: `lessonId`, `lessonTitle`.
- Two options:
  - **Quiz 1** → navigate to `app/quiz/[id].tsx` with the quiz for this lesson.
  - **Quiz 2** → disabled button labeled "(in progress)" — no action.
- The existing "Take the Quiz" banner at the bottom of `lesson/[id].tsx` can route here instead of directly to the quiz.

**B5 · TTS audio button on quiz questions**
- `app/quiz/[id].tsx`: add a speaker icon button next to each question text.
- On press: call existing `ttsService.playText(question.question)` (same service used in lesson detail).
- Handle loading/playing/error states the same way the lesson TTS does.

---

### Phase C — Support Contact (already done per client PDF)

- Client confirmed "Great" — no action needed.

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
